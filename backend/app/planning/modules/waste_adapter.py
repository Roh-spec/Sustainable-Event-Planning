"""
Adapter implementing ModuleEvaluator for the Waste Planning Module.
Translates WastePlanResponse into a standardized ModuleEvaluationResult.
"""

from decimal import Decimal
from typing import Any, Dict, List, Optional

from backend.app.planning.modules.evaluator import ModuleEvaluationResult, ModuleEvaluator
from backend.app.planning.modules.waste.calculator import WasteCalculator
from backend.app.planning.modules.waste.schemas import (
    FoodWasteInput,
    WastePlanRequest,
    WastePlanResponse,
    WasteSourceType,
)
from backend.app.planning.orchestrator.schemas import SustainabilityMetric
from backend.app.services.waste_planning_service import waste_planning_service


class WasteModuleEvaluator(ModuleEvaluator):
    """
    Adapter that executes the Waste Planning Module against candidate configurations.
    """

    @property
    def module_name(self) -> str:
        return "WASTE"

    def evaluate(self, candidate_config: Any, context: Any) -> ModuleEvaluationResult:
        waste_req: Optional[WastePlanRequest] = getattr(candidate_config, "waste_config", None)
        if not waste_req:
            return ModuleEvaluationResult(module_name=self.module_name, success=True)

        # 1. Connect food waste from previous food evaluation if available
        food_eval: Optional[ModuleEvaluationResult] = getattr(context, "food_result", None) if context else None
        effective_waste_req = waste_req.model_copy(deep=True)

        if food_eval and food_eval.metrics:
            fw_servings = food_eval.metrics.get("estimated_waste_servings")
            fw_kg = food_eval.metrics.get("estimated_waste_kg")
            if fw_servings is not None or fw_kg is not None:
                if effective_waste_req.food_waste is None:
                    effective_waste_req.food_waste = FoodWasteInput(
                        estimated_food_waste_servings=Decimal(str(fw_servings)) if fw_servings is not None else None,
                        estimated_food_waste_kg=Decimal(str(fw_kg)) if fw_kg is not None else None,
                    )
                else:
                    if effective_waste_req.food_waste.estimated_food_waste_servings is None and fw_servings is not None:
                        effective_waste_req.food_waste.estimated_food_waste_servings = Decimal(str(fw_servings))
                    if effective_waste_req.food_waste.estimated_food_waste_kg is None and fw_kg is not None:
                        effective_waste_req.food_waste.estimated_food_waste_kg = Decimal(str(fw_kg))

        # 2. Execute via waste_planning_service if database session is in context
        db = getattr(context, "db", None) if context else None
        waste_response: WastePlanResponse

        if db is not None:
            waste_response = waste_planning_service.plan_waste(db=db, request=effective_waste_req)
        else:
            resolved_assumptions = getattr(context, "resolved_assumptions", {}) if context else {}
            event_name = getattr(context, "event_name", "Event") if context else "Event"
            event_type = getattr(context, "event_type", "GENERAL") if context else "GENERAL"
            attendees = getattr(context, "expected_attendees", 100) if context else 100

            precomputed_fw = None
            if effective_waste_req.food_waste:
                precomputed_fw = (
                    effective_waste_req.food_waste.estimated_food_waste_servings,
                    effective_waste_req.food_waste.estimated_food_waste_kg,
                )

            waste_response = WasteCalculator.calculate(
                request=effective_waste_req,
                event_name=event_name,
                event_type=event_type,
                expected_attendees=attendees,
                resolved_assumptions=resolved_assumptions,
                precomputed_food_waste=precomputed_fw,
            )

        # 3. Extract metrics
        tot_pkg = waste_response.packaging_waste.total_items
        reusable_pkg = waste_response.packaging_waste.total_reusable_items
        single_use_pkg = waste_response.packaging_waste.total_single_use_items
        reusable_pct = waste_response.packaging_waste.reusable_percentage
        tot_plastic = waste_response.plastic_waste.total_planning_items
        tot_other = waste_response.other_waste.total_items

        metrics = {
            "total_packaging_items": tot_pkg,
            "reusable_packaging_items": reusable_pkg,
            "single_use_packaging_items": single_use_pkg,
            "reusable_percentage": reusable_pct,
            "total_plastic_items": tot_plastic,
            "total_other_items": tot_other,
        }

        # 4. Build measurable sustainability indicators
        indicators: List[SustainabilityMetric] = []

        if reusable_pkg is not None:
            indicators.append(
                SustainabilityMetric(
                    metric_name="reusable_packaging_items",
                    value=Decimal(str(reusable_pkg)),
                    unit="items",
                    source_type=WasteSourceType.ESTIMATED,
                    module=self.module_name,
                    description="Reusable, washable catering packaging items",
                )
            )

        if single_use_pkg is not None:
            indicators.append(
                SustainabilityMetric(
                    metric_name="single_use_packaging_items",
                    value=Decimal(str(single_use_pkg)),
                    unit="items",
                    source_type=WasteSourceType.ESTIMATED,
                    module=self.module_name,
                    description="Disposable single-use packaging items to be landfilled/recycled",
                )
            )

        if tot_plastic is not None:
            indicators.append(
                SustainabilityMetric(
                    metric_name="total_plastic_items",
                    value=Decimal(str(tot_plastic)),
                    unit="items",
                    source_type=WasteSourceType.ESTIMATED,
                    module=self.module_name,
                    description="Planned disposable plastic items (bottles, cups, wrappers, bags)",
                )
            )

        return ModuleEvaluationResult(
            module_name=self.module_name,
            success=True,
            estimated_cost=None,  # Waste module does not calculate financial cost
            metrics=metrics,
            sustainability_indicators=indicators,
            assumptions_used=waste_response.assumptions_used,
            missing_assumptions=waste_response.missing_assumptions,
            warnings=waste_response.warnings,
            raw_response=waste_response,
        )


waste_module_evaluator = WasteModuleEvaluator()
