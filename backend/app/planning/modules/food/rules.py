from decimal import Decimal
from typing import List, Optional

from backend.app.planning.modules.food.schemas import (
    ConstraintEvaluationStatus,
    DietaryPreference,
    FoodConstraintEvaluation,
    FoodRecommendation,
    MealPlanResult,
)
from backend.app.schemas.assumption import ResolvedAssumption


class FoodRulesEngine:
    """
    Evaluates food-specific institutional constraints and generates
    transparent, rule-based recommendations without LLM dependencies.
    """

    @staticmethod
    def evaluate_constraints(
        constraints: List[dict],
        meal_plans: List[MealPlanResult],
        estimated_total_cost: Optional[Decimal],
        food_budget: Optional[Decimal],
        default_dietary_preference: DietaryPreference,
    ) -> List[FoodConstraintEvaluation]:
        """
        Evaluates structured constraints relevant to food planning.
        Supports vegetarian mandates, budget ceilings, and prohibited practices.
        """
        evaluations: List[FoodConstraintEvaluation] = []

        # Check dietary composition across planned meals
        has_non_veg = any(
            (m.dietary_preference in [DietaryPreference.NON_VEGETARIAN, DietaryPreference.MIXED]
             and (m.non_veg_servings or 0) > 0)
            for m in meal_plans
        ) or default_dietary_preference in [DietaryPreference.NON_VEGETARIAN, DietaryPreference.MIXED]

        for c in constraints:
            cat = (c.get("category") or "").upper()
            desc = (c.get("description") or "").lower()
            val = (c.get("value") or "").lower()
            c_type = (c.get("constraint_type") or "REQUIRED").upper()
            c_id = c.get("id")

            # 1. Vegetarian Only Constraint
            if cat == "FOOD" and any(k in desc or k in val for k in ["vegetarian", "veg_only", "no_meat", "pure_veg"]):
                if has_non_veg:
                    status = (
                        ConstraintEvaluationStatus.VIOLATED
                        if c_type == "REQUIRED"
                        else ConstraintEvaluationStatus.WARNING
                    )
                    evaluations.append(
                        FoodConstraintEvaluation(
                            constraint_id=c_id,
                            category=c.get("category", "FOOD"),
                            constraint_type=c_type,
                            description=c.get("description", "Vegetarian food requirement"),
                            status=status,
                            message="Non-vegetarian meal selection violates the vegetarian-only constraint.",
                        )
                    )
                else:
                    evaluations.append(
                        FoodConstraintEvaluation(
                            constraint_id=c_id,
                            category=c.get("category", "FOOD"),
                            constraint_type=c_type,
                            description=c.get("description", "Vegetarian food requirement"),
                            status=ConstraintEvaluationStatus.SATISFIED,
                            message="All planned meals comply with the vegetarian-only requirement.",
                        )
                    )

            # 2. Food Budget Constraint
            elif cat in ["FOOD", "BUDGET"] and any(k in desc for k in ["food budget", "catering budget", "food cost limit"]):
                if estimated_total_cost is not None and food_budget is not None:
                    if estimated_total_cost > food_budget:
                        status = (
                            ConstraintEvaluationStatus.VIOLATED
                            if c_type == "REQUIRED"
                            else ConstraintEvaluationStatus.WARNING
                        )
                        diff = estimated_total_cost - food_budget
                        evaluations.append(
                            FoodConstraintEvaluation(
                                constraint_id=c_id,
                                category=c.get("category", "FOOD"),
                                constraint_type=c_type,
                                description=c.get("description", "Food budget limit"),
                                status=status,
                                message=f"Estimated food cost (₹{estimated_total_cost:,.2f}) exceeds allocated budget (₹{food_budget:,.2f}) by ₹{diff:,.2f}.",
                            )
                        )
                    else:
                        evaluations.append(
                            FoodConstraintEvaluation(
                                constraint_id=c_id,
                                category=c.get("category", "FOOD"),
                                constraint_type=c_type,
                                description=c.get("description", "Food budget limit"),
                                status=ConstraintEvaluationStatus.SATISFIED,
                                message=f"Estimated food cost is within the allocated budget limit.",
                            )
                        )

            # 3. Prohibited Practices (NOT_ALLOWED)
            elif c_type == "NOT_ALLOWED" and cat in ["FOOD", "WASTE"]:
                evaluations.append(
                    FoodConstraintEvaluation(
                        constraint_id=c_id,
                        category=c.get("category", "FOOD"),
                        constraint_type=c_type,
                        description=c.get("description", "Prohibited food/catering item"),
                        status=ConstraintEvaluationStatus.SATISFIED,
                        message="Rule acknowledged for catering vendor procurement guidelines.",
                    )
                )

        return evaluations

    @staticmethod
    def generate_recommendations(
        meal_plans: List[MealPlanResult],
        estimated_total_cost: Optional[Decimal],
        food_budget: Optional[Decimal],
        is_over_budget: bool,
        estimated_waste_servings: Optional[Decimal] = None,
        attrition_buffer_assumption: Optional[ResolvedAssumption] = None,
        assumptions_used: Optional[List[ResolvedAssumption]] = None,
    ) -> List[FoodRecommendation]:
        """
        Generates actionable, explainable, rule-based recommendations for organizers.
        Only generates recommendations backed directly by calculations, constraints,
        or resolved assumptions.
        """
        recommendations: List[FoodRecommendation] = []

        # 1. Budget overrun mitigation (Calculation-driven)
        if is_over_budget and estimated_total_cost is not None and food_budget is not None:
            diff = estimated_total_cost - food_budget
            recommendations.append(
                FoodRecommendation(
                    code="REC_FOOD_BUDGET_DEFICIT",
                    title="Mitigate Food Budget Deficit",
                    description=(
                        f"Estimated catering cost of ₹{estimated_total_cost:,.2f} exceeds allocated budget of "
                        f"₹{food_budget:,.2f} by ₹{diff:,.2f}. Consider reducing food unit costs, decreasing planned "
                        "servings, or adjusting the meal plan to bring costs within budget."
                    ),
                    reason=(
                        f"Estimated food cost of ₹{estimated_total_cost:,.2f} exceeds the allocated food budget of "
                        f"₹{food_budget:,.2f}."
                    ),
                    impact="Cost Optimization",
                )
            )

        # 2. Participation buffer calibration (Assumption-driven)
        # Only generated if food_participation_attrition_buffer_rate assumption is resolved
        if (
            attrition_buffer_assumption
            and attrition_buffer_assumption.is_resolved
            and attrition_buffer_assumption.value
        ):
            try:
                buffer_rate = Decimal(attrition_buffer_assumption.value)
                if buffer_rate > 1:
                    buffer_rate = buffer_rate / Decimal("100")

                if Decimal("0.0") < buffer_rate < Decimal("1.0"):
                    # Threshold above which participation is high relative to buffer
                    threshold = Decimal("1.0") - buffer_rate
                    meals_with_high_participation = [
                        m for m in meal_plans
                        if m.participation_rate_used is not None and m.participation_rate_used >= threshold
                    ]
                    if meals_with_high_participation:
                        recommendations.append(
                            FoodRecommendation(
                                code="REC_FOOD_BUFFER_CALIBRATION",
                                title="Calibrate Attendance Attrition Buffer",
                                description=(
                                    "The current meal participation estimate is high. "
                                    "Applying the configured participation buffer may reduce the planned serving quantity."
                                ),
                                reason="This recommendation is based on the configured food participation attrition assumption.",
                                impact="Waste & Cost Reduction",
                            )
                        )
                        if assumptions_used is not None and attrition_buffer_assumption not in assumptions_used:
                            assumptions_used.append(attrition_buffer_assumption)
            except Exception:
                pass

        return recommendations


food_rules_engine = FoodRulesEngine()
