"""
Deterministic candidate evaluation and planning pipeline.
Executes the multi-stage evaluation across Food, Waste, Cost, Constraint,
and Sustainability indicators to produce ranked plan alternatives.
"""

from decimal import Decimal
from typing import Any, List, Optional

from backend.app.planning.constraint_engine.evaluator import constraint_evaluator
from backend.app.planning.cost_engine.calculator import cost_calculator
from backend.app.planning.modules.food_adapter import food_module_evaluator
from backend.app.planning.modules.waste_adapter import waste_module_evaluator
from backend.app.planning.orchestrator.candidate_generator import candidate_generator
from backend.app.planning.orchestrator.ranking import plan_ranker
from backend.app.planning.orchestrator.schemas import (
    CandidateEvaluation,
    FoodMetrics,
    PlanAlternative,
    PlanningRequest,
    PlanningResponse,
    WasteMetrics,
)
from backend.app.schemas.assumption import ResolvedAssumption
from backend.app.schemas.constraint import ConstraintBase


class PlanningPipelineContext:
    """Carries environmental and context data across module evaluation steps."""
    def __init__(
        self,
        db: Any = None,
        event_name: str = "Event",
        event_type: str = "GENERAL",
        expected_attendees: int = 100,
        resolved_assumptions: Any = None,
        constraints: Optional[List[ConstraintBase]] = None,
    ):
        self.db = db
        self.event_name = event_name
        self.event_type = event_type
        self.expected_attendees = expected_attendees
        self.resolved_assumptions = resolved_assumptions or {}
        self.constraints = constraints or []
        self.food_result = None


class PlanningPipeline:
    """
    Master pipeline orchestrating candidate generation, module evaluations,
    cost computation, constraint verification, and alternative ranking.
    """

    @classmethod
    def run(
        cls,
        request: PlanningRequest,
        event_name: str,
        event_type: str,
        expected_attendees: int,
        budget: Optional[Decimal] = None,
        constraints: Optional[List[ConstraintBase]] = None,
        db: Any = None,
        resolved_assumptions: Any = None,
    ) -> PlanningResponse:
        """
        Executes the deterministic planning pipeline.
        """
        all_constraints = list(constraints or [])
        if request.constraints:
            all_constraints.extend(request.constraints)

        effective_budget = request.budget if request.budget is not None else budget
        warnings: List[str] = []

        # 1. Generate candidate configurations
        candidates = candidate_generator.generate_candidates(
            request=request,
            expected_attendees=expected_attendees,
            constraints=all_constraints,
        )

        evaluated_candidates: List[CandidateEvaluation] = []
        all_assumptions_used: List[ResolvedAssumption] = []
        all_missing_assumptions: List[str] = []

        # 2. Evaluate each candidate across domain modules
        for cand in candidates:
            ctx = PlanningPipelineContext(
                db=db,
                event_name=event_name,
                event_type=event_type,
                expected_attendees=expected_attendees,
                resolved_assumptions=resolved_assumptions,
                constraints=all_constraints,
            )

            # A. Evaluate Food Module
            food_eval = food_module_evaluator.evaluate(cand, ctx)
            ctx.food_result = food_eval

            # B. Evaluate Waste Module (consuming food waste from previous step)
            waste_eval = waste_module_evaluator.evaluate(cand, ctx)

            # C. Aggregate Cost
            cost_summary = cost_calculator.aggregate_costs(
                food_cost=food_eval.estimated_cost,
                waste_cost=None,
                budget=effective_budget,
            )

            # D. Build Metrics
            food_metrics = None
            if food_eval.metrics:
                food_metrics = FoodMetrics(
                    estimated_servings=food_eval.metrics.get("estimated_servings"),
                    estimated_cost=food_eval.metrics.get("estimated_cost"),
                    estimated_waste_servings=food_eval.metrics.get("estimated_waste_servings"),
                    estimated_waste_kg=food_eval.metrics.get("estimated_waste_kg"),
                    veg_servings=food_eval.metrics.get("veg_servings"),
                    non_veg_servings=food_eval.metrics.get("non_veg_servings"),
                )

            waste_metrics = None
            if waste_eval.metrics:
                waste_metrics = WasteMetrics(
                    total_packaging_items=waste_eval.metrics.get("total_packaging_items"),
                    reusable_packaging_items=waste_eval.metrics.get("reusable_packaging_items"),
                    single_use_packaging_items=waste_eval.metrics.get("single_use_packaging_items"),
                    reusable_percentage=waste_eval.metrics.get("reusable_percentage"),
                    total_plastic_items=waste_eval.metrics.get("total_plastic_items"),
                    total_other_items=waste_eval.metrics.get("total_other_items"),
                )

            sustainability_indicators = (
                food_eval.sustainability_indicators + waste_eval.sustainability_indicators
            )

            # E. Evaluate Constraints
            eval_budget = effective_budget
            if (
                request.allow_budget_increase
                and request.max_approved_budget is not None
                and (effective_budget is None or cost_summary.total_estimated_cost > effective_budget)
            ):
                eval_budget = request.max_approved_budget

            constraint_res = constraint_evaluator.evaluate(
                constraints=all_constraints,
                total_cost=cost_summary.total_estimated_cost,
                budget=eval_budget,
                food_metrics=food_eval.metrics,
                waste_metrics=waste_eval.metrics,
            )

            # F. Collect assumptions and warnings
            cand_assumptions = food_eval.assumptions_used + waste_eval.assumptions_used
            cand_missing = list(dict.fromkeys(food_eval.missing_assumptions + waste_eval.missing_assumptions))

            for a in cand_assumptions:
                if not any(existing.parameter == a.parameter for existing in all_assumptions_used):
                    all_assumptions_used.append(a)

            all_missing_assumptions.extend(cand_missing)
            warnings.extend(waste_eval.warnings)

            # G. Assemble candidate evaluation
            evaluated_candidates.append(
                CandidateEvaluation(
                    candidate_id=cand.candidate_id,
                    name=cand.name,
                    configuration=cand,
                    feasible=constraint_res.feasible,
                    total_cost=cost_summary.total_estimated_cost,
                    food_metrics=food_metrics,
                    waste_metrics=waste_metrics,
                    sustainability_metrics=sustainability_indicators,
                    constraint_result=constraint_res,
                    assumptions_used=cand_assumptions,
                    missing_assumptions=cand_missing,
                    explanations=[cand.description],
                )
            )

        unique_missing = list(dict.fromkeys(all_missing_assumptions))
        unique_warnings = list(dict.fromkeys(warnings))

        # 3. Assess overall budget feasibility
        feasible_candidates = [c for c in evaluated_candidates if c.feasible]

        min_feasible_budget: Optional[Decimal] = None
        budget_deficit: Optional[Decimal] = None
        status = "COMPLETE"

        costs_available = [c.total_cost for c in evaluated_candidates if c.total_cost is not None]
        if costs_available:
            min_feasible_budget = min(costs_available)

        if not feasible_candidates and effective_budget is not None and min_feasible_budget is not None:
            if min_feasible_budget > effective_budget:
                status = "INFEASIBLE_BUDGET"
                budget_deficit = min_feasible_budget - effective_budget
                unique_warnings.append(
                    f"No candidate configuration is feasible within current budget of ₹{effective_budget:.2f}. "
                    f"Minimum required estimated budget is ₹{min_feasible_budget:.2f} (deficit of ₹{budget_deficit:.2f})."
                )

        # 4. Rank and select final plan alternatives
        plans: List[PlanAlternative] = []
        if feasible_candidates:
            plans = plan_ranker.select_plans(
                evaluations=evaluated_candidates,
                requested_objectives=request.planning_objectives,
            )
        elif status == "COMPLETE" and unique_missing:
            status = "PARTIAL"

        return PlanningResponse(
            event_id=request.event_id,
            event_name=event_name,
            expected_attendees=expected_attendees,
            budget=effective_budget,
            status=status,
            min_feasible_budget=min_feasible_budget,
            budget_deficit=budget_deficit,
            plans=plans,
            all_evaluated_candidates=evaluated_candidates,
            assumptions_used=all_assumptions_used,
            missing_assumptions=unique_missing,
            warnings=unique_warnings,
        )


planning_pipeline = PlanningPipeline()
