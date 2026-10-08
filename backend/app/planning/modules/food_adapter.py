"""
Adapter implementing ModuleEvaluator for the Food Planning Module.
Translates FoodPlanResponse into a standardized ModuleEvaluationResult.
"""

from decimal import Decimal
from typing import Any, Dict, List, Optional

from backend.app.planning.modules.evaluator import ModuleEvaluationResult, ModuleEvaluator
from backend.app.planning.modules.food.calculator import FoodCalculator
from backend.app.planning.modules.food.schemas import FoodPlanRequest, FoodPlanResponse
from backend.app.planning.modules.waste.schemas import WasteSourceType
from backend.app.planning.orchestrator.schemas import SustainabilityMetric
from backend.app.services.food_planning_service import food_planning_service


class FoodModuleEvaluator(ModuleEvaluator):
    """
    Adapter that executes the Food Planning Module against candidate configurations.
    """

    @property
    def module_name(self) -> str:
        return "FOOD"

    def evaluate(self, candidate_config: Any, context: Any) -> ModuleEvaluationResult:
        food_req: Optional[FoodPlanRequest] = getattr(candidate_config, "food_config", None)
        if not food_req:
            return ModuleEvaluationResult(module_name=self.module_name, success=True)

        # 1. Execute via food_planning_service if database session is in context
        db = getattr(context, "db", None) if context else None
        food_response: FoodPlanResponse

        if db is not None:
            food_response = food_planning_service.plan_food(db=db, request=food_req)
        else:
            # Pure evaluation via injected context attributes
            resolved_assumptions = getattr(context, "resolved_assumptions", {}) if context else {}
            constraints = getattr(context, "constraints", []) if context else []
            event_name = getattr(context, "event_name", "Event") if context else "Event"
            event_type = getattr(context, "event_type", "GENERAL") if context else "GENERAL"
            attendees = getattr(context, "expected_attendees", 100) if context else 100

            food_response = FoodCalculator.calculate(
                request=food_req,
                event_name=event_name,
                event_type=event_type,
                expected_attendees=attendees,
                resolved_assumptions=resolved_assumptions,
                constraints=[c.model_dump() if hasattr(c, "model_dump") else c for c in constraints],
            )

        # 2. Extract measurable metrics
        veg_servings = food_response.total_veg_servings
        if veg_servings is None and food_response.meal_plans:
            veg_servings = sum(m.veg_servings or 0 for m in food_response.meal_plans)

        non_veg_servings = food_response.total_non_veg_servings
        if non_veg_servings is None and food_response.meal_plans:
            non_veg_servings = sum(m.non_veg_servings or 0 for m in food_response.meal_plans)

        total_servings = food_response.total_estimated_servings
        if total_servings is None and food_response.meal_plans:
            total_servings = sum(m.estimated_servings or 0 for m in food_response.meal_plans)

        cost = food_response.cost_summary.estimated_total_cost
        waste_servings = food_response.waste_summary.estimated_waste_servings
        waste_kg = food_response.waste_summary.estimated_waste_kg

        metrics = {
            "estimated_servings": total_servings,
            "estimated_cost": cost,
            "estimated_waste_servings": waste_servings,
            "estimated_waste_kg": waste_kg,
            "veg_servings": veg_servings,
            "non_veg_servings": non_veg_servings,
        }

        # 3. Build measurable sustainability indicators
        indicators: List[SustainabilityMetric] = []
        if waste_servings is not None:
            indicators.append(
                SustainabilityMetric(
                    metric_name="food_waste_servings",
                    value=Decimal(str(waste_servings)),
                    unit="servings",
                    source_type=WasteSourceType.ESTIMATED,
                    module=self.module_name,
                    description="Projected surplus food servings from catering buffer",
                )
            )

        if waste_kg is not None:
            indicators.append(
                SustainabilityMetric(
                    metric_name="food_waste_kg",
                    value=Decimal(str(waste_kg)),
                    unit="kg",
                    source_type=WasteSourceType.ESTIMATED,
                    module=self.module_name,
                    description="Projected physical food waste mass in kilograms",
                )
            )

        return ModuleEvaluationResult(
            module_name=self.module_name,
            success=True,
            estimated_cost=cost,
            metrics=metrics,
            sustainability_indicators=indicators,
            assumptions_used=food_response.assumptions_used,
            missing_assumptions=food_response.missing_assumptions,
            raw_response=food_response,
        )


food_module_evaluator = FoodModuleEvaluator()
