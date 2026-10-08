"""
Unit tests for the FoodCalculator domain engine.
Directly tests pure calculations without database or HTTP network overhead.
"""

from decimal import Decimal
import pytest

from backend.app.planning.modules.food.calculator import FoodCalculator
from backend.app.planning.modules.food.schemas import (
    CalculationStatus,
    DietaryPreference,
    FoodPlanRequest,
    FoodPricingUnit,
    MealInput,
    MealType,
    WasteEstimationStatus,
    ConstraintEvaluationStatus,
)
from backend.app.schemas.assumption import (
    AssumptionScope,
    AssumptionSourceType,
    ResolvedAssumption,
)


def _make_mock_assumption(param: str, value: str, unit: str, source=AssumptionSourceType.ASSUMED):
    return ResolvedAssumption(
        parameter=param,
        value=value,
        unit=unit,
        source_type=source,
        scope=AssumptionScope.GLOBAL,
        is_resolved=True,
        explanation="Mock assumption",
    )


# 1. Single-meal calculation
def test_single_meal_calculation():
    """Verify single-meal calculation with attendance and participation."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(
                meal_type=MealType.LUNCH,
                name="Conference Lunch",
                day=1,
                dietary_preference=DietaryPreference.VEGETARIAN,
            )
        ],
    )
    assumptions = {
        "meal_participation_rate_lunch": _make_mock_assumption("meal_participation_rate_lunch", "0.80", "ratio"),
        "meal_cost_per_serving_lunch": _make_mock_assumption("meal_cost_per_serving_lunch", "120.00", "INR/serving"),
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg/serving"),
    }

    result = FoodCalculator.calculate(
        request=request,
        event_name="AI Workshop",
        event_type="WORKSHOP",
        expected_attendees=100,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    assert result.status == CalculationStatus.COMPLETE
    assert len(result.meal_plans) == 1
    meal = result.meal_plans[0]
    # 100 * 0.80 = 80 servings
    assert meal.estimated_servings == 80
    assert meal.veg_servings == 80
    assert meal.non_veg_servings == 0
    # Cost: 80 * 120 = 9600
    assert meal.total_cost == Decimal("9600.00")
    assert result.total_estimated_servings == 80
    assert result.cost_summary.estimated_total_cost == Decimal("9600.00")


# 2. Multiple-meal calculation
def test_multiple_meal_calculation():
    """Verify multiple meals across days with mixed dietary split."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.BREAKFAST, day=1),
            MealInput(meal_type=MealType.LUNCH, day=1),
            MealInput(meal_type=MealType.SNACKS, day=1),
        ],
        default_dietary_preference=DietaryPreference.MIXED,
        vegetarian_ratio=Decimal("0.70"),
    )
    assumptions = {
        "meal_participation_rate_breakfast": _make_mock_assumption("meal_participation_rate_breakfast", "0.50", "ratio"),
        "meal_participation_rate_lunch": _make_mock_assumption("meal_participation_rate_lunch", "0.90", "ratio"),
        "meal_participation_rate_snacks": _make_mock_assumption("meal_participation_rate_snacks", "0.60", "ratio"),
        "meal_cost_per_serving_breakfast": _make_mock_assumption("meal_cost_per_serving_breakfast", "60", "INR"),
        "meal_cost_per_serving_lunch": _make_mock_assumption("meal_cost_per_serving_lunch", "150", "INR"),
        "meal_cost_per_serving_snacks": _make_mock_assumption("meal_cost_per_serving_snacks", "40", "INR"),
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.35", "kg"),
    }

    result = FoodCalculator.calculate(
        request=request,
        event_name="Hackathon",
        event_type="HACKATHON",
        expected_attendees=200,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    assert result.status == CalculationStatus.COMPLETE
    assert len(result.meal_plans) == 3
    # Breakfast: 200 * 0.50 = 100 servings
    assert result.meal_plans[0].estimated_servings == 100
    # Lunch: 200 * 0.90 = 180 servings
    assert result.meal_plans[1].estimated_servings == 180
    # Snacks: 200 * 0.60 = 120 servings
    assert result.meal_plans[2].estimated_servings == 120
    # Total: 100 + 180 + 120 = 400 servings
    assert result.total_estimated_servings == 400
    # Total cost: 100*60 (6000) + 180*150 (27000) + 120*40 (4800) = 37800
    assert result.cost_summary.estimated_total_cost == Decimal("37800.00")


# 3. Different participation assumptions
def test_different_participation_assumptions():
    """Verify that different participation rates yield expected whole-number servings."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.DINNER, user_participation_rate=Decimal("0.65")),
        ],
    )
    assumptions = {
        "meal_cost_per_serving_dinner": _make_mock_assumption("meal_cost_per_serving_dinner", "200", "INR"),
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.15", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
    }

    result = FoodCalculator.calculate(
        request=request,
        event_name="Gala",
        event_type="FAREWELL",
        expected_attendees=105,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    # 105 * 0.65 = 68.25 -> ceil = 69
    assert result.meal_plans[0].estimated_servings == 69


# 4. User-provided total food cost (Approach A)
def test_user_provided_total_cost():
    """Verify Approach A: User provides lump-sum total food cost."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH, user_servings=100),
            MealInput(meal_type=MealType.DINNER, user_servings=100),
        ],
        known_total_cost=Decimal("50000.00"),
    )
    assumptions = {
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
    }

    result = FoodCalculator.calculate(
        request=request,
        event_name="Symposium",
        event_type="CONFERENCE",
        expected_attendees=100,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    assert result.cost_summary.cost_status == "USER_PROVIDED"
    assert result.cost_summary.pricing_approach == "USER_PROVIDED_TOTAL"
    assert result.cost_summary.estimated_total_cost == Decimal("50000.00")
    assert result.cost_summary.cost_per_attendee == Decimal("500.00")
    # Proportional split between 2 identical meals
    assert result.meal_plans[0].total_cost == Decimal("25000.00")
    assert result.meal_plans[1].total_cost == Decimal("25000.00")


# 5. User-provided unit cost (Approach B)
def test_user_provided_unit_cost():
    """Verify Approach B: User provides unit cost per serving."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH, user_servings=150),
        ],
        known_unit_cost=Decimal("135.50"),
        cost_pricing_unit=FoodPricingUnit.PER_SERVING,
    )
    assumptions = {
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
    }

    result = FoodCalculator.calculate(
        request=request,
        event_name="Workshop",
        event_type="WORKSHOP",
        expected_attendees=150,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    assert result.cost_summary.cost_status == "USER_PROVIDED"
    assert result.cost_summary.pricing_approach == "USER_PROVIDED_UNIT"
    # 150 * 135.50 = 20325.00
    assert result.cost_summary.estimated_total_cost == Decimal("20325.00")


# 6. Assumption-based food cost (Approach C)
def test_assumption_based_food_cost():
    """Verify Approach C: Cost resolved from reference assumption."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.SNACKS, user_servings=50),
        ],
    )
    assumptions = {
        "meal_cost_per_serving_snacks": _make_mock_assumption("meal_cost_per_serving_snacks", "35.00", "INR"),
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.05", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.20", "kg"),
    }

    result = FoodCalculator.calculate(
        request=request,
        event_name="Seminar",
        event_type="DEPARTMENT_EVENT",
        expected_attendees=50,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    assert result.cost_summary.cost_status == "ESTIMATED"
    assert result.cost_summary.pricing_approach == "ASSUMPTION_BASED"
    # 50 * 35.00 = 1750.00
    assert result.cost_summary.estimated_total_cost == Decimal("1750.00")


# 7. Missing assumptions
def test_missing_assumptions():
    """Verify that missing participation or cost assumptions are explicitly reported."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH),
        ],
    )
    # No assumptions provided at all
    result = FoodCalculator.calculate(
        request=request,
        event_name="Tech Meet",
        event_type="TECH_FEST",
        expected_attendees=100,
        resolved_assumptions={},
        constraints=[],
    )

    assert result.status == CalculationStatus.BLOCKED
    assert "meal_participation_rate_lunch" in result.missing_assumptions
    assert result.meal_plans[0].estimated_servings is None
    assert result.cost_summary.estimated_total_cost is None


# 8. Food budget exceeded
def test_food_budget_exceeded():
    """Verify budget comparison flags deficit when cost exceeds limit."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.DINNER, user_servings=100, user_unit_cost=Decimal("300.00")),
        ],
        food_budget=Decimal("20000.00"),  # Cost will be 30,000
    )
    assumptions = {
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
    }

    result = FoodCalculator.calculate(
        request=request,
        event_name="Annual Dinner",
        event_type="FAREWELL",
        expected_attendees=100,
        resolved_assumptions=assumptions,
        constraints=[
            {
                "id": 10,
                "category": "FOOD",
                "description": "Catering budget limit",
                "constraint_type": "REQUIRED",
                "value": "20000",
            }
        ],
    )

    assert result.cost_summary.estimated_total_cost == Decimal("30000.00")
    assert result.cost_summary.is_over_budget is True
    assert result.cost_summary.remaining_budget == Decimal("-10000.00")
    assert result.cost_summary.variance_amount == Decimal("10000.00")
    # Verify constraint violation
    budget_eval = next(e for e in result.constraints_evaluation if "budget" in e.description.lower())
    assert budget_eval.status == ConstraintEvaluationStatus.VIOLATED


# 9. Vegetarian-only constraint
def test_vegetarian_only_constraint_evaluation():
    """Verify constraint evaluation for vegetarian mandate."""
    # Non-vegetarian selection with vegetarian required constraint
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(
                meal_type=MealType.LUNCH,
                user_servings=100,
                dietary_preference=DietaryPreference.NON_VEGETARIAN,
            )
        ],
    )
    assumptions = {
        "meal_cost_per_serving_lunch": _make_mock_assumption("meal_cost_per_serving_lunch", "100", "INR"),
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
    }
    constraints = [
        {
            "id": 5,
            "category": "FOOD",
            "description": "Vegetarian food only on campus",
            "constraint_type": "REQUIRED",
            "value": "VEGETARIAN_ONLY",
        }
    ]

    result = FoodCalculator.calculate(
        request=request,
        event_name="College Day",
        event_type="CULTURAL_FEST",
        expected_attendees=100,
        resolved_assumptions=assumptions,
        constraints=constraints,
    )

    veg_eval = next(e for e in result.constraints_evaluation if "vegetarian" in e.description.lower())
    assert veg_eval.status == ConstraintEvaluationStatus.VIOLATED
    assert "violates" in veg_eval.message.lower()


# 10. Food waste calculation (servings + kilograms)
def test_food_waste_calculation():
    """Verify waste estimation in both servings and kilograms."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH, user_servings=200),
        ],
    )
    assumptions = {
        "meal_cost_per_serving_lunch": _make_mock_assumption("meal_cost_per_serving_lunch", "100", "INR"),
        # 15% waste rate
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.15", "ratio"),
        # 0.45 kg per serving
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.45", "kg"),
    }

    result = FoodCalculator.calculate(
        request=request,
        event_name="Summit",
        event_type="CONFERENCE",
        expected_attendees=200,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    assert result.waste_summary.waste_status == WasteEstimationStatus.COMPLETE
    # 200 servings * 0.15 = 30.00 waste servings
    assert result.waste_summary.estimated_waste_servings == Decimal("30.00")
    # 30 * 0.45 kg = 13.50 kg
    assert result.waste_summary.estimated_waste_kg == Decimal("13.50")


# 11. Missing serving-weight assumption
def test_missing_serving_weight_assumption():
    """
    Verify that missing weight assumption yields SERVINGS_ONLY waste status
    without failing cost or servings calculation.
    """
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH, user_servings=100),
        ],
    )
    assumptions = {
        "meal_cost_per_serving_lunch": _make_mock_assumption("meal_cost_per_serving_lunch", "100", "INR"),
        # Waste rate available, but weight unavailable
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.20", "ratio"),
    }

    result = FoodCalculator.calculate(
        request=request,
        event_name="Cultural Fest",
        event_type="CULTURAL_FEST",
        expected_attendees=100,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    assert result.status == CalculationStatus.PARTIAL
    assert result.waste_summary.waste_status == WasteEstimationStatus.SERVINGS_ONLY
    # Servings: 100 * 0.20 = 20 servings
    assert result.waste_summary.estimated_waste_servings == Decimal("20.00")
    assert result.waste_summary.estimated_waste_kg is None
    assert "food_serving_weight_kg_default" in result.missing_assumptions
    # Cost should still be completely valid
    assert result.cost_summary.estimated_total_cost == Decimal("10000.00")


# 12. Decimal precision in calculations
def test_decimal_precision():
    """Verify monetary and weight calculations use exact Decimal precision."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.SNACKS, user_servings=33, user_unit_cost=Decimal("33.33")),
        ],
        known_unit_cost=Decimal("33.33"),
        cost_pricing_unit=FoodPricingUnit.PER_SERVING,
    )
    assumptions = {
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.125", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.333", "kg"),
    }

    result = FoodCalculator.calculate(
        request=request,
        event_name="Workshop",
        event_type="WORKSHOP",
        expected_attendees=33,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    # 33 * 33.33 = 1099.89
    assert result.cost_summary.estimated_total_cost == Decimal("1099.89")
    assert isinstance(result.cost_summary.estimated_total_cost, Decimal)
    assert isinstance(result.waste_summary.estimated_waste_kg, Decimal)


# 13. Recommendation: Food Budget Deficit appears when over budget
def test_recommendation_food_budget_deficit_appears_when_over_budget():
    """Verify REC_FOOD_BUDGET_DEFICIT is generated when cost exceeds budget."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH, user_servings=100, user_unit_cost=Decimal("200.00")),
        ],
        food_budget=Decimal("15000.00"),  # Cost is 20,000, deficit is 5,000
    )
    assumptions = {
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
    }
    result = FoodCalculator.calculate(
        request=request,
        event_name="Seminar",
        event_type="SEMINAR",
        expected_attendees=100,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    rec_codes = [r.code for r in result.recommendations]
    assert "REC_FOOD_BUDGET_DEFICIT" in rec_codes

    rec = next(r for r in result.recommendations if r.code == "REC_FOOD_BUDGET_DEFICIT")
    assert "20,000.00" in rec.description
    assert "15,000.00" in rec.description
    assert "5,000.00" in rec.description
    assert rec.impact == "Cost Optimization"
    assert "exceeds the allocated food budget" in rec.reason


# 14. Recommendation: Food Budget Deficit absent when within budget
def test_recommendation_food_budget_deficit_absent_when_within_budget():
    """Verify REC_FOOD_BUDGET_DEFICIT is NOT generated when cost <= budget."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH, user_servings=100, user_unit_cost=Decimal("100.00")),
        ],
        food_budget=Decimal("15000.00"),  # Cost is 10,000, within budget
    )
    assumptions = {
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
    }
    result = FoodCalculator.calculate(
        request=request,
        event_name="Seminar",
        event_type="SEMINAR",
        expected_attendees=100,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    rec_codes = [r.code for r in result.recommendations]
    assert "REC_FOOD_BUDGET_DEFICIT" not in rec_codes


# 15. Recommendation: Participation buffer appears with resolved assumption
def test_recommendation_buffer_calibration_with_assumption():
    """
    Verify REC_FOOD_BUFFER_CALIBRATION appears when assumption is resolved
    and meal participation rate is high relative to buffer.
    """
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH, user_participation_rate=Decimal("0.90"), user_unit_cost=Decimal("100.00")),
        ],
        food_budget=Decimal("50000.00"),
    )
    # buffer rate = 0.15 -> threshold = 1.0 - 0.15 = 0.85; 0.90 >= 0.85 triggers
    assumptions = {
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
        "food_participation_attrition_buffer_rate": _make_mock_assumption(
            "food_participation_attrition_buffer_rate", "0.15", "ratio"
        ),
    }
    result = FoodCalculator.calculate(
        request=request,
        event_name="Tech Meetup",
        event_type="MEETUP",
        expected_attendees=100,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    rec_codes = [r.code for r in result.recommendations]
    assert "REC_FOOD_BUFFER_CALIBRATION" in rec_codes

    rec = next(r for r in result.recommendations if r.code == "REC_FOOD_BUFFER_CALIBRATION")
    assert "The current meal participation estimate is high" in rec.description
    assert "Applying the configured participation buffer may reduce the planned serving quantity" in rec.description
    assert "College events typically observe" not in rec.description
    assert "prevents over-ordering" not in rec.description
    assert rec.reason == "This recommendation is based on the configured food participation attrition assumption."

    # Verify assumption is tracked in assumptions_used
    used_params = [a.parameter for a in result.assumptions_used]
    assert "food_participation_attrition_buffer_rate" in used_params


# 16. Recommendation: Participation buffer absent when assumption is missing
def test_recommendation_buffer_calibration_absent_when_assumption_missing():
    """Verify REC_FOOD_BUFFER_CALIBRATION does not appear when assumption is missing."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH, user_participation_rate=Decimal("1.0"), user_unit_cost=Decimal("100.00")),
        ],
        food_budget=Decimal("50000.00"),
    )
    # Missing buffer rate
    assumptions = {
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
    }
    result = FoodCalculator.calculate(
        request=request,
        event_name="Tech Meetup",
        event_type="MEETUP",
        expected_attendees=100,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    rec_codes = [r.code for r in result.recommendations]
    assert "REC_FOOD_BUFFER_CALIBRATION" not in rec_codes


# 17. Recommendation: Participation buffer absent when participation is below threshold
def test_recommendation_buffer_calibration_absent_when_participation_low():
    """Verify REC_FOOD_BUFFER_CALIBRATION does not appear when participation rate is below threshold."""
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH, user_participation_rate=Decimal("0.60"), user_unit_cost=Decimal("100.00")),
        ],
        food_budget=Decimal("50000.00"),
    )
    # buffer rate = 0.15 -> threshold = 0.85; 0.60 < 0.85 so should not trigger
    assumptions = {
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
        "food_participation_attrition_buffer_rate": _make_mock_assumption(
            "food_participation_attrition_buffer_rate", "0.15", "ratio"
        ),
    }
    result = FoodCalculator.calculate(
        request=request,
        event_name="Tech Meetup",
        event_type="MEETUP",
        expected_attendees=100,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    rec_codes = [r.code for r in result.recommendations]
    assert "REC_FOOD_BUFFER_CALIBRATION" not in rec_codes


# 18. Removed recommendations verification
def test_removed_recommendations_never_generated():
    """
    Verify REC_FOOD_DONATION_PARTNER and REC_FOOD_REUSABLE_SERVICEWARE
    are never generated by the Food module.
    """
    request = FoodPlanRequest(
        event_id=1,
        meals=[
            MealInput(meal_type=MealType.LUNCH, user_servings=500, user_unit_cost=Decimal("100.00")),
        ],
        food_budget=Decimal("100000.00"),
    )
    # Generates 50 surplus servings (500 * 0.10 = 50), which previously triggered donation
    assumptions = {
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
        "food_serving_weight_kg_default": _make_mock_assumption("food_serving_weight_kg_default", "0.40", "kg"),
    }
    result = FoodCalculator.calculate(
        request=request,
        event_name="Mega Fest",
        event_type="FEST",
        expected_attendees=500,
        resolved_assumptions=assumptions,
        constraints=[],
    )

    assert result.waste_summary.estimated_waste_servings == Decimal("50.00")
    rec_codes = [r.code for r in result.recommendations]
    assert "REC_FOOD_DONATION_PARTNER" not in rec_codes
    assert "REC_FOOD_REUSABLE_SERVICEWARE" not in rec_codes

