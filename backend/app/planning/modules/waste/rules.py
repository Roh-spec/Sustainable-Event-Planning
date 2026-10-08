"""
Rule-based recommendation engine for the Waste Planning Module.
Generates explainable, deterministic recommendations without LLM dependencies.
"""

from decimal import Decimal
from typing import List, Optional

from backend.app.planning.modules.waste.schemas import (
    FoodWasteResult,
    PackagingWasteSummary,
    PlasticWasteSummary,
    OtherWasteSummary,
    WasteRecommendation,
)


class WasteRulesEngine:
    """
    Evaluates waste quantities and generates actionable, explainable recommendations.
    All recommendations are derived strictly from calculated totals, explicit user inputs,
    or resolved assumptions.
    """

    @staticmethod
    def generate_recommendations(
        food_waste: Optional[FoodWasteResult],
        packaging_summary: PackagingWasteSummary,
        plastic_summary: PlasticWasteSummary,
        other_summary: OtherWasteSummary,
        missing_assumptions: List[str],
    ) -> List[WasteRecommendation]:
        """
        Generates deterministic waste reduction and planning recommendations.
        """
        recommendations: List[WasteRecommendation] = []

        # 1. Packaging: Single-use reduction
        single_use_count = packaging_summary.total_single_use_items or Decimal("0")
        reusable_pct = packaging_summary.reusable_percentage

        # Only recommend if single-use items exist and reusable is not already 100%
        if single_use_count > Decimal("0") and (reusable_pct is None or reusable_pct < Decimal("100")):
            recommendations.append(
                WasteRecommendation(
                    code="REC_WASTE_REDUCE_SINGLE_USE_PACKAGING",
                    title="Transition Single-Use Packaging to Reusable Alternatives",
                    description=(
                        f"The event plan includes {int(single_use_count)} single-use packaging items. "
                        "Transitioning items such as plates, cups, or cutlery to washable reusable alternatives "
                        "eliminates disposable packaging waste."
                    ),
                    reason=f"Single-use items generate avoidable solid waste; {int(single_use_count)} items are currently planned for single use.",
                    impact="Waste Prevention",
                )
            )

        # 2. Plastic: Minimize single-use plastic items
        plastic_count = plastic_summary.total_planning_items or Decimal("0")
        if plastic_count > Decimal("0"):
            recommendations.append(
                WasteRecommendation(
                    code="REC_WASTE_REDUCE_SINGLE_USE_PLASTIC",
                    title="Provide Bulk Dispensers to Minimize Single-Use Plastic",
                    description=(
                        f"The current plan includes {int(plastic_count)} disposable plastic items. "
                        "Offering refillable water stations and reusable bags reduces single-use plastic consumption."
                    ),
                    reason=f"Calculated plastic requirement indicates {int(plastic_count)} plastic items across the event.",
                    impact="Plastic Waste Reduction",
                )
            )

        # 3. Food Waste: Surplus review and redistribution
        if (
            food_waste is not None
            and food_waste.planning_servings is not None
            and food_waste.planning_servings > Decimal("0")
        ):
            servings = int(food_waste.planning_servings)
            recommendations.append(
                WasteRecommendation(
                    code="REC_WASTE_FOOD_SURPLUS_REVIEW",
                    title="Review Planned Food Surplus and Redistribution Options",
                    description=(
                        f"Projected food waste is {servings} servings. "
                        "Review planned buffer quantities or arrange redistribution channels with local dining facilities to prevent food waste."
                    ),
                    reason=f"Calculated food waste estimate indicates {servings} surplus servings from catering.",
                    impact="Food Waste Diversion",
                )
            )

        # 4. Missing Assumptions Alert
        if len(missing_assumptions) > 0:
            sample_params = ", ".join(missing_assumptions[:3])
            suffix = "..." if len(missing_assumptions) > 3 else ""
            recommendations.append(
                WasteRecommendation(
                    code="REC_WASTE_MISSING_ASSUMPTIONS",
                    title="Configure Missing Waste Estimation Parameters",
                    description=(
                        f"Assumptions for {len(missing_assumptions)} parameters ({sample_params}{suffix}) are unconfigured. "
                        "Defining event-specific or global reference assumptions will improve calculation precision."
                    ),
                    reason="Missing assumptions require explicit configuration to prevent guessing or unverified calculations.",
                    impact="Planning Accuracy",
                )
            )

        return recommendations


waste_rules_engine = WasteRulesEngine()
