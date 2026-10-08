"""
Unit tests for WasteCalculator domain engine.
Directly tests pure deterministic calculations without database or network overhead.
"""

from decimal import Decimal
import pytest

from backend.app.planning.modules.waste.calculator import WasteCalculator
from backend.app.planning.modules.waste.schemas import (
    CalculationBasis,
    FoodWasteInput,
    OtherWasteCategory,
    OtherWasteItemInput,
    PackagingItemInput,
    PackagingItemType,
    PlasticItemInput,
    PlasticItemType,
    WasteCalculationStatus,
    WastePlanRequest,
    WasteSourceType,
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


# -------------------------------------------------------------------------
# A. Food Waste Tests
# -------------------------------------------------------------------------

def test_food_waste_consumed_correctly():
    """Verify that Food Module estimate is consumed as default planning value."""
    request = WastePlanRequest(
        event_id=1,
        food_waste=FoodWasteInput(
            estimated_food_waste_servings=Decimal("92.00"),
            estimated_food_waste_kg=Decimal("36.80"),
        ),
    )
    result = WasteCalculator.calculate(
        request=request,
        event_name="Workshop",
        event_type="WORKSHOP",
        expected_attendees=100,
        resolved_assumptions={},
    )
    assert result.status == WasteCalculationStatus.COMPLETE
    assert result.food_waste is not None
    assert result.food_waste.estimated_servings == Decimal("92.00")
    assert result.food_waste.estimated_kg == Decimal("36.80")
    assert result.food_waste.user_override_servings is None
    assert result.food_waste.planning_servings == Decimal("92.00")
    assert result.food_waste.planning_source == "ESTIMATED"


def test_food_waste_user_override_preserves_original_estimate():
    """Verify user override replaces planning value without deleting original estimate."""
    request = WastePlanRequest(
        event_id=1,
        food_waste=FoodWasteInput(
            estimated_food_waste_servings=Decimal("92.00"),
            estimated_food_waste_kg=Decimal("36.80"),
            user_override_servings=Decimal("70.00"),
        ),
    )
    result = WasteCalculator.calculate(
        request=request,
        event_name="Workshop",
        event_type="WORKSHOP",
        expected_attendees=100,
        resolved_assumptions={},
    )
    assert result.food_waste is not None
    # Original estimate preserved
    assert result.food_waste.estimated_servings == Decimal("92.00")
    assert result.food_waste.estimated_kg == Decimal("36.80")
    # Planning value replaced
    assert result.food_waste.planning_servings == Decimal("70.00")
    assert result.food_waste.user_override_servings == Decimal("70.00")
    assert result.food_waste.planning_source == "USER_PROVIDED"
    assert "overridden by user" in result.food_waste.explanation


# -------------------------------------------------------------------------
# B. Packaging Tests
# -------------------------------------------------------------------------

def test_packaging_per_person_calculation():
    """Verify PER_PERSON calculation: attendees * units_per_person."""
    request = WastePlanRequest(
        event_id=1,
        attendee_count=500,
        packaging_items=[
            PackagingItemInput(
                item_type=PackagingItemType.CUP,
                calculation_basis=CalculationBasis.PER_PERSON,
            )
        ],
    )
    assumptions = {
        "packaging_cup_per_person": _make_mock_assumption("packaging_cup_per_person", "2", "items/person"),
        "reusable_ratio_cup": _make_mock_assumption("reusable_ratio_cup", "0.40", "ratio"),
    }
    result = WasteCalculator.calculate(
        request=request,
        event_name="Seminar",
        event_type="SEMINAR",
        expected_attendees=500,
        resolved_assumptions=assumptions,
    )
    assert len(result.packaging_waste.items) == 1
    cup = result.packaging_waste.items[0]
    # 500 * 2 = 1000 total cups
    assert cup.total_quantity == Decimal("1000")
    # Split via reusable_ratio 40%: 400 reusable, 600 single-use
    assert cup.reusable_quantity == Decimal("400")
    assert cup.single_use_quantity == Decimal("600")
    assert cup.is_split_resolved is True
    assert cup.reusable_quantity + cup.single_use_quantity == cup.total_quantity
    assert "500 attendees × 2 per person = 1000 Cups" in cup.explanation


def test_packaging_per_meal_calculation():
    """Verify PER_MEAL calculation: attendees * meals * units_per_meal."""
    request = WastePlanRequest(
        event_id=1,
        attendee_count=500,
        meals_count=2,
        packaging_items=[
            PackagingItemInput(
                item_type=PackagingItemType.PLATE,
                calculation_basis=CalculationBasis.PER_MEAL,
            )
        ],
    )
    assumptions = {
        "packaging_plate_per_meal": _make_mock_assumption("packaging_plate_per_meal", "1", "items/meal"),
        "single_use_ratio_plate": _make_mock_assumption("single_use_ratio_plate", "0.80", "ratio"),
    }
    result = WasteCalculator.calculate(
        request=request,
        event_name="Fest",
        event_type="FEST",
        expected_attendees=500,
        resolved_assumptions=assumptions,
    )
    plate = result.packaging_waste.items[0]
    # 500 * 2 * 1 = 1000 plates
    assert plate.total_quantity == Decimal("1000")
    # 80% single-use: 800 single-use, 200 reusable
    assert plate.single_use_quantity == Decimal("800")
    assert plate.reusable_quantity == Decimal("200")
    assert plate.single_use_quantity + plate.reusable_quantity == plate.total_quantity


def test_packaging_per_event_and_custom_calculation():
    """Verify PER_EVENT and CUSTOM packaging calculations."""
    request = WastePlanRequest(
        event_id=1,
        packaging_items=[
            PackagingItemInput(
                item_type=PackagingItemType.GLASS,
                calculation_basis=CalculationBasis.PER_EVENT,
                units_per_basis=Decimal("150"),
                user_reusable_quantity=Decimal("150"),
                user_single_use_quantity=Decimal("0"),
            ),
            PackagingItemInput(
                item_type=PackagingItemType.OTHER,
                custom_name="Wooden Stirrers",
                calculation_basis=CalculationBasis.CUSTOM,
                user_total_quantity=Decimal("300"),
                user_single_use_quantity=Decimal("300"),
            ),
        ],
    )
    result = WasteCalculator.calculate(
        request=request,
        event_name="Reception",
        event_type="RECEPTION",
        expected_attendees=100,
        resolved_assumptions={},
    )
    assert len(result.packaging_waste.items) == 2
    glass = result.packaging_waste.items[0]
    assert glass.total_quantity == Decimal("150")
    assert glass.reusable_quantity == Decimal("150")
    assert glass.single_use_quantity == Decimal("0")

    stirrers = result.packaging_waste.items[1]
    assert stirrers.total_quantity == Decimal("300")
    assert stirrers.single_use_quantity == Decimal("300")
    assert stirrers.reusable_quantity == Decimal("0")


def test_packaging_invalid_split_raises_error():
    """Verify that split exceeding total quantity is rejected at schema and calculator levels."""
    # 1. Rejected at schema validation when explicit user_total_quantity is specified
    with pytest.raises(ValueError, match="cannot exceed total quantity"):
        PackagingItemInput(
            item_type=PackagingItemType.SPOON,
            calculation_basis=CalculationBasis.CUSTOM,
            user_total_quantity=Decimal("100"),
            user_reusable_quantity=Decimal("80"),
            user_single_use_quantity=Decimal("50"),  # 80 + 50 = 130 > 100
        )

    # 2. Rejected at calculator level when total is dynamically derived from basis
    request = WastePlanRequest(
        event_id=1,
        attendee_count=100,
        packaging_items=[
            PackagingItemInput(
                item_type=PackagingItemType.SPOON,
                calculation_basis=CalculationBasis.PER_PERSON,
                units_per_basis=Decimal("1"),  # total = 100
                user_reusable_quantity=Decimal("80"),
                user_single_use_quantity=Decimal("50"),  # 80 + 50 = 130 > 100
            )
        ],
    )
    with pytest.raises(ValueError, match="exceeds total"):
        WasteCalculator.calculate(
            request=request,
            event_name="Dinner",
            event_type="DINNER",
            expected_attendees=100,
            resolved_assumptions={},
        )



def test_packaging_missing_assumption_not_fabricated():
    """Verify missing packaging assumption yields unresolved state without fabricating data."""
    request = WastePlanRequest(
        event_id=1,
        expected_attendees=100,
        packaging_items=[
            PackagingItemInput(
                item_type=PackagingItemType.FORK,
                calculation_basis=CalculationBasis.PER_PERSON,
            )
        ],
    )
    result = WasteCalculator.calculate(
        request=request,
        event_name="Lunch",
        event_type="LUNCH",
        expected_attendees=100,
        resolved_assumptions={},  # No assumption for packaging_fork_per_person
    )
    assert result.status in [WasteCalculationStatus.PARTIAL, WasteCalculationStatus.BLOCKED]
    fork = result.packaging_waste.items[0]
    assert fork.total_quantity is None
    assert fork.source_type is None
    assert "packaging_fork_per_person" in result.missing_assumptions
    assert "no packaging_fork_per_person assumption is configured" in fork.explanation


# -------------------------------------------------------------------------
# C. Plastic Tests
# -------------------------------------------------------------------------

def test_plastic_water_bottle_calculation_and_user_override():
    """Verify water bottle estimation and user override preservation."""
    request = WastePlanRequest(
        event_id=1,
        attendee_count=500,
        plastic_items=[
            PlasticItemInput(
                item_type=PlasticItemType.WATER_BOTTLE,
                calculation_basis=CalculationBasis.PER_PERSON,
                participation_rate=Decimal("0.60"),  # 60% participation override
            )
        ],
    )
    assumptions = {
        "plastic_water_bottle_per_person": _make_mock_assumption("plastic_water_bottle_per_person", "1", "items/person"),
    }
    result = WasteCalculator.calculate(
        request=request,
        event_name="Symposium",
        event_type="SYMPOSIUM",
        expected_attendees=500,
        resolved_assumptions=assumptions,
    )
    bottle = result.plastic_waste.items[0]
    # 500 * 1 = 500 estimated
    assert bottle.estimated_quantity == Decimal("500")
    # 500 * 0.60 = 300 planning
    assert bottle.planning_quantity == Decimal("300")
    assert bottle.user_override_quantity == Decimal("300")
    assert bottle.source_type == "USER_PROVIDED"
    assert "Adjusted by user-provided participation rate 60%" in bottle.explanation


def test_plastic_items_per_meal_and_missing_assumption():
    """Verify plastic bag, wrapper, and cup calculations and missing assumption handling."""
    request = WastePlanRequest(
        event_id=1,
        attendee_count=200,
        meals_count=2,
        plastic_items=[
            PlasticItemInput(
                item_type=PlasticItemType.WRAPPER,
                calculation_basis=CalculationBasis.PER_MEAL,
            ),
            PlasticItemInput(
                item_type=PlasticItemType.PLASTIC_BAG,
                calculation_basis=CalculationBasis.PER_PERSON,
            ),
        ],
    )
    assumptions = {
        "plastic_wrapper_per_meal": _make_mock_assumption("plastic_wrapper_per_meal", "2", "items/meal"),
        # plastic_bag_per_person is missing
    }
    result = WasteCalculator.calculate(
        request=request,
        event_name="Workshop",
        event_type="WORKSHOP",
        expected_attendees=200,
        resolved_assumptions=assumptions,
    )
    wrapper = next(p for p in result.plastic_waste.items if p.item_type == PlasticItemType.WRAPPER)
    # 200 * 2 meals * 2 = 800 wrappers
    assert wrapper.planning_quantity == Decimal("800")
    assert wrapper.source_type == WasteSourceType.ESTIMATED

    bag = next(p for p in result.plastic_waste.items if p.item_type == PlasticItemType.PLASTIC_BAG)
    assert bag.planning_quantity is None
    assert bag.source_type is None
    assert "plastic_plastic_bag_per_person" in result.missing_assumptions


# -------------------------------------------------------------------------
# D. Other Waste Tests
# -------------------------------------------------------------------------

def test_other_waste_predefined_and_custom():
    """Verify predefined categories and custom other waste items."""
    request = WastePlanRequest(
        event_id=1,
        other_waste_items=[
            OtherWasteItemInput(
                name="Stage Props",
                category=OtherWasteCategory.DECORATIONS,
                calculation_basis=CalculationBasis.CUSTOM,
                quantity=Decimal("15"),
                unit="pieces",
            ),
            OtherWasteItemInput(
                name="Food Packaging Cartons",
                category=OtherWasteCategory.FOOD_CONTAINERS,
                calculation_basis=CalculationBasis.PER_EVENT,
                units_per_basis=Decimal("50"),
                unit="cartons",
            ),
        ],
    )
    result = WasteCalculator.calculate(
        request=request,
        event_name="Drama Fest",
        event_type="CULTURAL",
        expected_attendees=200,
        resolved_assumptions={},
    )
    assert len(result.other_waste.items) == 2
    props = result.other_waste.items[0]
    assert props.quantity == Decimal("15")
    assert props.unit == "pieces"
    assert props.source_type == "USER_PROVIDED"

    cartons = result.other_waste.items[1]
    assert cartons.quantity == Decimal("50")
    assert cartons.unit == "cartons"


# -------------------------------------------------------------------------
# E. Recommendations & Sustainability Tests
# -------------------------------------------------------------------------

def test_waste_recommendations_calculation_driven():
    """Verify that recommendations are triggered strictly by calculations and missing data."""
    request = WastePlanRequest(
        event_id=1,
        food_waste=FoodWasteInput(estimated_food_waste_servings=Decimal("45.00")),
        packaging_items=[
            PackagingItemInput(
                item_type=PackagingItemType.PLATE,
                calculation_basis=CalculationBasis.CUSTOM,
                user_total_quantity=Decimal("200"),
                user_single_use_quantity=Decimal("180"),
                user_reusable_quantity=Decimal("20"),
            )
        ],
        plastic_items=[
            PlasticItemInput(
                item_type=PlasticItemType.WATER_BOTTLE,
                calculation_basis=CalculationBasis.CUSTOM,
                user_override_quantity=Decimal("150"),
            )
        ],
    )
    result = WasteCalculator.calculate(
        request=request,
        event_name="Conference",
        event_type="CONFERENCE",
        expected_attendees=200,
        resolved_assumptions={},
    )
    rec_codes = [r.code for r in result.recommendations]

    # Single-use packaging recommendation triggered by 180 single-use plates
    assert "REC_WASTE_REDUCE_SINGLE_USE_PACKAGING" in rec_codes
    single_use_rec = next(r for r in result.recommendations if r.code == "REC_WASTE_REDUCE_SINGLE_USE_PACKAGING")
    assert "180" in single_use_rec.description
    assert "College events typically" not in single_use_rec.description
    assert "Studies show" not in single_use_rec.description

    # Plastic reduction recommendation triggered by 150 bottles
    assert "REC_WASTE_REDUCE_SINGLE_USE_PLASTIC" in rec_codes

    # Food surplus review triggered by 45 servings
    assert "REC_WASTE_FOOD_SURPLUS_REVIEW" in rec_codes


def test_no_single_use_recommendation_when_100_percent_reusable():
    """Verify single-use recommendation is NOT generated when 100% reusable."""
    request = WastePlanRequest(
        event_id=1,
        packaging_items=[
            PackagingItemInput(
                item_type=PackagingItemType.PLATE,
                calculation_basis=CalculationBasis.CUSTOM,
                user_total_quantity=Decimal("100"),
                user_reusable_quantity=Decimal("100"),
                user_single_use_quantity=Decimal("0"),
            )
        ],
    )
    result = WasteCalculator.calculate(
        request=request,
        event_name="Eco Banquet",
        event_type="BANQUET",
        expected_attendees=100,
        resolved_assumptions={},
    )
    rec_codes = [r.code for r in result.recommendations]
    assert "REC_WASTE_REDUCE_SINGLE_USE_PACKAGING" not in rec_codes


def test_plastic_cup_calculation():
    """Verify plastic cup calculation via per-person assumption."""
    request = WastePlanRequest(
        event_id=1,
        attendee_count=250,
        plastic_items=[
            PlasticItemInput(
                item_type=PlasticItemType.PLASTIC_CUP,
                calculation_basis=CalculationBasis.PER_PERSON,
            )
        ],
    )
    assumptions = {
        "plastic_plastic_cup_per_person": _make_mock_assumption("plastic_plastic_cup_per_person", "2", "items/person"),
    }
    result = WasteCalculator.calculate(
        request=request,
        event_name="Networking Night",
        event_type="NETWORKING",
        expected_attendees=250,
        resolved_assumptions=assumptions,
    )
    cup = result.plastic_waste.items[0]
    # 250 * 2 = 500 cups
    assert cup.planning_quantity == Decimal("500")
    assert cup.source_type == WasteSourceType.ESTIMATED


def test_other_waste_validation():
    """Verify validation for other waste items."""
    with pytest.raises(Exception):
        OtherWasteItemInput(
            name="",  # Empty name rejected
            category=OtherWasteCategory.OTHER,
        )


def test_waste_provenance_preservation_across_source_types():
    """
    Verify that Waste calculations preserve the standard provenance model:
    ESTIMATED, USER_PROVIDED, REFERENCE, ACTUAL, ML_PREDICTED.
    Confirms no pseudo enum values exist and uncalculated items have source_type=None.
    """
    source_mappings = [
        (AssumptionSourceType.REFERENCE, WasteSourceType.REFERENCE),
        (AssumptionSourceType.ACTUAL, WasteSourceType.ACTUAL),
        (AssumptionSourceType.ML_PREDICTED, WasteSourceType.ML_PREDICTED),
        (AssumptionSourceType.USER_PROVIDED, WasteSourceType.USER_PROVIDED),
        (AssumptionSourceType.ASSUMED, WasteSourceType.ESTIMATED),
    ]

    for asm_source, expected_waste_source in source_mappings:
        assumptions = {
            "packaging_plate_per_person": _make_mock_assumption(
                "packaging_plate_per_person", "1", "items/person", source=asm_source
            ),
            "reusable_ratio_plate": _make_mock_assumption(
                "reusable_ratio_plate", "0.50", "ratio", source=asm_source
            ),
        }
        res = WasteCalculator.calculate(
            request=WastePlanRequest(
                event_id=1,
                packaging_items=[
                    PackagingItemInput(
                        item_type=PackagingItemType.PLATE,
                        calculation_basis=CalculationBasis.PER_PERSON,
                    )
                ],
            ),
            event_name="Provenance Test",
            event_type="SEMINAR",
            expected_attendees=100,
            resolved_assumptions=assumptions,
        )
        plate = res.packaging_waste.items[0]
        assert plate.source_type == expected_waste_source
        assert plate.source_type in [
            WasteSourceType.ESTIMATED,
            WasteSourceType.USER_PROVIDED,
            WasteSourceType.REFERENCE,
            WasteSourceType.ACTUAL,
            WasteSourceType.ML_PREDICTED,
        ]
        # Verify metadata preserves the assumption used without corrupting source_type
        assert any(a.parameter == "packaging_plate_per_person" for a in res.assumptions_used)


