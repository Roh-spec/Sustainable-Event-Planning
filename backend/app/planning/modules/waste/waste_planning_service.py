"""
Orchestration service for the Waste Planning Module.
Coordinates Event retrieval, Food Module waste consumption, and Assumption resolution,
then delegates deterministic calculations to the decoupled WasteCalculator.
"""

from typing import Dict, Optional, Set, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session

from backend.app.models.event import Event
from backend.app.planning.assumption_engine.manager import AssumptionResolver
from backend.app.planning.modules.waste.calculator import WasteCalculator
from backend.app.planning.modules.waste.schemas import (
    WastePlanRequest,
    WastePlanResponse,
)
from backend.app.schemas.assumption import ResolvedAssumption
from backend.app.services.food_planning_service import food_planning_service


class WastePlanningService:
    """
    Service coordinating waste planning context, food waste reuse, and assumption resolution.
    """

    @classmethod
    def plan_waste(
        cls,
        db: Session,
        request: WastePlanRequest,
    ) -> WastePlanResponse:
        """
        Gathers context from Event, resolves Food Module output if requested,
        resolves waste assumptions, and calculates waste quantities.
        """
        # 1. Fetch Event
        event = db.query(Event).filter(Event.id == request.event_id).first()
        if not event:
            raise ValueError(f"Event with id {request.event_id} does not exist.")

        # 2. Consume Food Module output if full FoodPlanRequest is provided
        precomputed_food_waste: Optional[Tuple[Optional[Decimal], Optional[Decimal]]] = None
        if request.food_waste and request.food_waste.food_plan_request:
            food_response = food_planning_service.plan_food(
                db=db,
                request=request.food_waste.food_plan_request,
            )
            precomputed_food_waste = (
                food_response.waste_summary.estimated_waste_servings,
                food_response.waste_summary.estimated_waste_kg,
            )

        # 3. Collect parameters to resolve from Assumption Engine
        params_to_resolve: Set[str] = set()

        for item in request.packaging_items:
            item_key = item.item_type.value.lower()
            params_to_resolve.add(f"packaging_{item_key}_per_person")
            params_to_resolve.add(f"packaging_{item_key}_per_meal")
            params_to_resolve.add(f"packaging_{item_key}_per_event")
            params_to_resolve.add(f"reusable_ratio_{item_key}")
            params_to_resolve.add(f"single_use_ratio_{item_key}")

        for item in request.plastic_items:
            item_key = item.item_type.value.lower()
            params_to_resolve.add(f"plastic_{item_key}_per_person")
            params_to_resolve.add(f"plastic_{item_key}_per_meal")
            params_to_resolve.add(f"plastic_{item_key}_per_event")

        for item in request.other_waste_items:
            item_key = item.name.lower().replace(" ", "_")
            params_to_resolve.add(f"other_{item_key}_per_person")
            params_to_resolve.add(f"other_{item_key}_per_event")

        # 4. Resolve assumptions using precedence: Event-specific -> Global -> Missing
        resolved_assumptions: Dict[str, ResolvedAssumption] = {}
        for param in params_to_resolve:
            # First try within category "WASTE"
            resolved = AssumptionResolver.resolve(
                db=db,
                parameter=param,
                event_id=event.id,
                category="WASTE",
            )
            # If not resolved under "WASTE", check without category filter
            if not resolved.is_resolved:
                fallback_resolved = AssumptionResolver.resolve(
                    db=db,
                    parameter=param,
                    event_id=event.id,
                    category=None,
                )
                if fallback_resolved.is_resolved:
                    resolved = fallback_resolved

            resolved_assumptions[param] = resolved

        # 5. Delegate calculation to pure WasteCalculator
        response = WasteCalculator.calculate(
            request=request,
            event_name=event.name,
            event_type=event.event_type,
            expected_attendees=event.expected_attendees,
            resolved_assumptions=resolved_assumptions,
            precomputed_food_waste=precomputed_food_waste,
        )

        return response


waste_planning_service = WastePlanningService()
