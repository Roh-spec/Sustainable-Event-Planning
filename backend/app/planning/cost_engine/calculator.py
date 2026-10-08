"""
Pure calculation engine for cost aggregation and budget evaluation.
"""

from decimal import Decimal
from typing import List, Optional

from backend.app.planning.cost_engine.schemas import CostBreakdownItem, CostSummaryResult


class CostCalculator:
    """
    Computes aggregate event costs across active planning modules
    and evaluates financial budget variance.
    """

    @classmethod
    def aggregate_costs(
        cls,
        food_cost: Optional[Decimal] = None,
        waste_cost: Optional[Decimal] = None,
        additional_items: Optional[List[CostBreakdownItem]] = None,
        budget: Optional[Decimal] = None,
    ) -> CostSummaryResult:
        """
        Aggregates costs from domain modules into a consolidated summary.
        """
        items: List[CostBreakdownItem] = []
        total = Decimal("0.00")

        if food_cost is not None and food_cost > Decimal("0.00"):
            items.append(
                CostBreakdownItem(
                    category="FOOD",
                    description="Estimated catering and meal costs",
                    amount=food_cost,
                    source_type="ESTIMATED",
                )
            )
            total += food_cost

        if waste_cost is not None and waste_cost > Decimal("0.00"):
            items.append(
                CostBreakdownItem(
                    category="WASTE",
                    description="Estimated waste management and reusable service costs",
                    amount=waste_cost,
                    source_type="ESTIMATED",
                )
            )
            total += waste_cost

        if additional_items:
            for item in additional_items:
                items.append(item)
                total += item.amount

        variance: Optional[Decimal] = None
        is_over = False
        if budget is not None:
            variance = budget - total
            is_over = total > budget

        return CostSummaryResult(
            total_estimated_cost=total,
            budget=budget,
            variance_amount=variance,
            is_over_budget=is_over,
            items=items,
        )


cost_calculator = CostCalculator()
