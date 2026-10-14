"""
Application service orchestrating the Complete Event Plan generation.
Combines Event details, Budget, Selected Sustainable Plan, Food/Waste metrics,
and the Scheduling Engine to produce a unified, actionable execution plan.
Does NOT duplicate existing calculations; reuses domain module results.
"""

from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.models.event import Event
from backend.app.schemas.event import EventType
from backend.app.schemas.assumption import ResolvedAssumption
from backend.app.planning.modules.food.schemas import MealType
from backend.app.planning.modules.scheduling.schemas import (
    AssumptionsAndConfirmations,
    BudgetSummary,
    CompletePlanRequest,
    CompletePlanResponse,
    EventOverview,
    FoodResourceManifest,
    PlasticResourceManifest,
    ResourceItem,
    ResourceManifest,
    ScheduleRequest,
    SustainabilityActionItem,
    TablewareResourceManifest,
)
from backend.app.planning.modules.scheduling.scheduler import scheduling_engine
from backend.app.planning.modules.scheduling.checklist_generator import checklist_generator
from backend.app.services.planning_service import planning_service
from backend.app.planning.orchestrator.schemas import PlanningRequest


class CompletePlanService:
    """
    Coordinates event domain context with scheduling, resources, budget, and checklists.
    """

    @classmethod
    def generate_complete_plan(
        cls,
        db: Session,
        request: CompletePlanRequest,
    ) -> CompletePlanResponse:
        """
        Builds a comprehensive, actionable event plan.
        """
        # 1. Fetch Event from database
        event = db.query(Event).filter(Event.id == request.event_id).first()
        if not event:
            raise ValueError(f"Event with id {request.event_id} does not exist.")

        # 2. Extract Event properties
        try:
            event_type = EventType(event.event_type)
        except ValueError:
            event_type = EventType.OTHER

        expected_attendees = event.expected_attendees
        duration_days = request.duration_days or event.duration_days
        location = event.location

        # 3. Extract Budget details
        allocated_budget: Optional[Decimal] = None
        currency: str = "INR"
        if event.budget:
            allocated_budget = event.budget.total_budget
            if event.budget.currency:
                currency = event.budget.currency

        # 4. Resolve Selected Plan Alternative
        plan = request.selected_plan
        if plan is None:
            # If organizer has not passed a pre-selected plan, generate alternatives
            # using PlanningService so metrics remain grounded in existing calculations
            try:
                planning_resp = planning_service.generate_plan(
                    db=db,
                    request=PlanningRequest(
                        event_id=event.id,
                        module_context=request.module_context,
                    ),
                )
                if planning_resp.plans:
                    plan = planning_resp.plans[0]
            except Exception:
                plan = None

        # 5. Resolve Meals to Schedule
        if request.selected_meal_types is not None:
            selected_meals = request.selected_meal_types
        elif (
            request.module_context
            and request.module_context.food
            and request.module_context.food.meals
        ):
            selected_meals = [m.meal_type for m in request.module_context.food.meals]
        elif plan and plan.food_metrics and plan.food_metrics.estimated_servings:
            # Fall back to standard lunch if food servings exist
            selected_meals = [MealType.LUNCH]
        else:
            selected_meals = []

        # 6. Execute Scheduling Engine
        sched_req = ScheduleRequest(
            event_type=event_type,
            expected_attendees=expected_attendees,
            event_date=request.event_date,
            start_time=request.start_time,
            end_time=request.end_time,
            duration_days=duration_days,
            selected_meal_types=selected_meals,
            include_setup_cleanup=request.include_setup_cleanup,
            event_name=event.name,
        )
        schedule_result = scheduling_engine.generate_schedule(sched_req)

        # 7. Execute Checklist Generator
        checklist_items = checklist_generator.generate_checklist(sched_req)

        # 8. Build Resource Manifest (Reusing existing Food & Waste calculations)
        # Food & Catering resources
        if plan and plan.food_metrics:
            food_manifest = FoodResourceManifest(
                estimated_servings=plan.food_metrics.estimated_servings,
                veg_servings=plan.food_metrics.veg_servings,
                non_veg_servings=plan.food_metrics.non_veg_servings,
                estimated_food_waste_kg=plan.food_metrics.estimated_waste_kg,
                description="Portions and estimated food waste calculated by the Food Planning Module based on planned meals.",
                provenance="Calculated from planning assumptions",
            )
        else:
            food_manifest = FoodResourceManifest(
                estimated_servings=None,
                veg_servings=None,
                non_veg_servings=None,
                estimated_food_waste_kg=None,
                description="Food catering was not configured for this plan alternative.",
                provenance="Not estimated",
            )

        # Tableware resources
        if plan and plan.waste_metrics:
            tableware_manifest = TablewareResourceManifest(
                reusable_items=plan.waste_metrics.reusable_packaging_items,
                single_use_items=plan.waste_metrics.single_use_packaging_items,
                reusable_percentage=plan.waste_metrics.reusable_percentage,
                description="Estimated plates, cups, and utensils required for event dining.",
                provenance="Calculated from planning assumptions",
            )
            plastic_manifest = PlasticResourceManifest(
                estimated_plastic_items=plan.waste_metrics.total_plastic_items,
                description="Estimated plastic bottles or packaging containers.",
                provenance="Calculated from planning assumptions",
            )
        else:
            tableware_manifest = TablewareResourceManifest(
                reusable_items=None,
                single_use_items=None,
                reusable_percentage=None,
                description="Tableware streams were not configured for this plan alternative.",
                provenance="Not estimated",
            )
            plastic_manifest = PlasticResourceManifest(
                estimated_plastic_items=None,
                description="Plastic streams were not configured for this plan alternative.",
                provenance="Not estimated",
            )

        # Suggested Equipment & Station Guidelines (Clearly identified as suggestions)
        equipment_suggestions: List[ResourceItem] = [
            ResourceItem(
                name="Water Refill Station (Carboys / Dispensers)",
                suggested_quantity=f"{max(1, expected_attendees // 75)} stations",
                category="WASTE_MANAGEMENT",
                notes="Place near main hall entrance and dining area to eliminate disposable plastic water bottles.",
                is_suggestion=True,
            ),
            ResourceItem(
                name="Segregated Waste Station Bins (Compostable + Dry Recyclables)",
                suggested_quantity=f"{max(2, expected_attendees // 50)} bin pairs",
                category="WASTE_MANAGEMENT",
                notes="Color-coded paired bins with clear visual signage to ensure proper segregation.",
                is_suggestion=True,
            ),
            ResourceItem(
                name="Audio-Visual Presentation Setup",
                suggested_quantity="1 podium mic + 2 handheld roving mics + 1 projector",
                category="AV_EQUIPMENT",
                notes="Standard AV arrangement for speaker sessions and audience Q&A; confirm venue specs.",
                is_suggestion=True,
            ),
        ]

        resource_manifest = ResourceManifest(
            food_and_catering=food_manifest,
            tableware_and_serving=tableware_manifest,
            plastic_items=plastic_manifest,
            suggested_equipment=equipment_suggestions,
        )

        # 9. Build Budget Summary
        estimated_cost = plan.estimated_cost if plan else None
        food_cost = plan.food_metrics.estimated_cost if (plan and plan.food_metrics) else None
        packaging_cost: Optional[Decimal] = None
        if estimated_cost is not None and food_cost is not None and estimated_cost >= food_cost:
            packaging_cost = estimated_cost - food_cost

        is_budget_feasible = True
        remaining_contingency: Optional[Decimal] = None
        budget_deficit: Optional[Decimal] = None
        budget_notes: Optional[str] = None

        if allocated_budget is not None and estimated_cost is not None:
            if estimated_cost <= allocated_budget:
                remaining_contingency = allocated_budget - estimated_cost
                is_budget_feasible = True
                budget_notes = f"Estimated plan cost fits comfortably within the allocated budget of ₹{allocated_budget}."
            else:
                is_budget_feasible = False
                budget_deficit = estimated_cost - allocated_budget
                budget_notes = (
                    f"Estimated plan cost (₹{estimated_cost}) exceeds the event budget of ₹{allocated_budget} "
                    f"by ₹{budget_deficit}. Organizer approval for budget increase is required."
                )

        budget_summary = BudgetSummary(
            total_budget=allocated_budget,
            currency=currency,
            estimated_plan_cost=estimated_cost,
            food_cost=food_cost,
            packaging_cost=packaging_cost,
            remaining_contingency=remaining_contingency,
            is_budget_feasible=is_budget_feasible,
            budget_deficit=budget_deficit,
            notes=budget_notes,
        )

        # 10. Derive Sustainability Actions from Selected Plan
        sustainability_actions: List[SustainabilityActionItem] = []

        if plan and plan.waste_metrics and plan.waste_metrics.reusable_packaging_items:
            reusable_count = plan.waste_metrics.reusable_packaging_items
            sustainability_actions.append(
                SustainabilityActionItem(
                    title="Zero-Single-Use Tableware Service",
                    action_type="REUSABLE_PACKAGING",
                    description=(
                        f"Deploy {reusable_count} washable, reusable dining items (plates, cups, spoons). "
                        "Coordinate with the campus dishwashing facility or catering team to eliminate disposable waste."
                    ),
                    target_metric=f"{reusable_count} reusable items ({plan.waste_metrics.reusable_percentage or '100'}%)",
                    verification_step="Verify that catering setup uses washable plates and count returned tableware post-event.",
                )
            )

        if plan and plan.waste_metrics and plan.waste_metrics.total_plastic_items is not None:
            if plan.waste_metrics.total_plastic_items == Decimal("0"):
                sustainability_actions.append(
                    SustainabilityActionItem(
                        title="Single-Use Plastic Bottle Elimination",
                        action_type="PLASTIC_ELIMINATION",
                        description="Ban disposable plastic bottles. Provide bulk water dispensers and ask attendees to bring personal refillable bottles.",
                        target_metric="0 single-use plastic bottles",
                        verification_step="Inspect session and dining areas to ensure no bottled water is distributed.",
                    )
                )

        if plan and plan.food_metrics and plan.food_metrics.estimated_waste_kg:
            waste_kg = plan.food_metrics.estimated_waste_kg
            sustainability_actions.append(
                SustainabilityActionItem(
                    title="Surplus Food Recovery & Redistribution Protocol",
                    action_type="FOOD_WASTE_REDUCTION",
                    description=(
                        "Arrange for clean packaging and rapid redistribution of untouched surplus meals "
                        "to campus support staff or a local food charity within 1 hour after lunch."
                    ),
                    target_metric=f"Divert unserved portions (estimated waste: ~{waste_kg} kg)",
                    verification_step="Log the number of surplus meals packed and handed over to the redistribution partner.",
                )
            )

        # 11. Compile Assumptions and Items Requiring Confirmation
        planning_assumptions: List[ResolvedAssumption] = []
        if plan and plan.assumptions_used:
            planning_assumptions = plan.assumptions_used

        confirmations: List[str] = [
            "Confirm dishwashing water supply and drying station at the venue before deploying reusable tableware.",
            "Reconfirm final attendee headcount with the catering vendor 48 hours prior to the event.",
            "Ensure drinking water dispensers and clean paper/washable cups are staged prior to attendee registration.",
            "Verify venue room capacity, emergency exits, and electrical power connections with the campus facility manager.",
        ]

        if duration_days > 1:
            confirmations.append("Confirm overnight security and locking access for AV equipment and exhibits between event days.")

        if not is_budget_feasible:
            confirmations.append(
                f"BUDGET NOTICE: Total plan cost exceeds allocated budget by ₹{budget_deficit}. "
                "Organizer approval for budget increase is required before signing vendor agreements."
            )

        if schedule_result.conflicts:
            confirmations.append("TIMING NOTICE: Scheduling conflicts detected in the requested time window; review timing warnings before publishing schedule.")

        assumptions_and_confirmations = AssumptionsAndConfirmations(
            planning_assumptions=planning_assumptions,
            items_requiring_confirmation=confirmations,
        )

        # 12. Determine Overall Plan Feasibility
        # Plan is feasible ONLY if:
        # 1. Selected plan alternative has feasible=True
        # 2. Budget is satisfied (not in deficit)
        # 3. No critical scheduling conflicts exist
        plan_feasible = plan.feasible if plan else True
        no_conflicts = len(schedule_result.conflicts) == 0
        overall_feasible = plan_feasible and is_budget_feasible and no_conflicts

        # 13. Assemble Event Overview
        overview = EventOverview(
            event_id=event.id,
            name=event.name,
            event_type=event_type,
            expected_attendees=expected_attendees,
            duration_days=duration_days,
            location=location,
            event_date=request.event_date.isoformat(),
            start_time=request.start_time.strftime("%H:%M"),
            end_time=request.end_time.strftime("%H:%M"),
            selected_plan_name=plan.name if plan else "Standard Event Configuration",
            selected_plan_objective=plan.planning_objective.value if plan else None,
            is_feasible=overall_feasible,
        )

        return CompletePlanResponse(
            event_overview=overview,
            daily_timetable=schedule_result.daily_schedules,
            scheduling_warnings=schedule_result.warnings,
            scheduling_conflicts=schedule_result.conflicts,
            checklist=checklist_items,
            resource_manifest=resource_manifest,
            budget_summary=budget_summary,
            sustainability_actions=sustainability_actions,
            assumptions_and_confirmations=assumptions_and_confirmations,
        )


complete_plan_service = CompletePlanService()
