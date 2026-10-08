"""
Unit tests for Assumption Pydantic schema validation.
"""

import pytest
from decimal import Decimal
from pydantic import ValidationError

from backend.app.schemas.assumption import (
    AssumptionCreate,
    AssumptionUpdate,
    AssumptionSourceType,
)


def test_valid_assumption_create():
    """Verify valid assumption payload instantiates correctly."""
    data = {
        "category": "WATER",
        "parameter": "water_per_person_per_day",
        "value": "5",
        "unit": "litres/person/day",
        "source_type": "ASSUMED",
        "confidence": "0.90",
        "reference_notes": "Campus utility benchmark",
    }
    obj = AssumptionCreate(**data)
    assert obj.category == "WATER"
    assert obj.parameter == "water_per_person_per_day"
    assert obj.value == "5"
    assert obj.unit == "litres/person/day"
    assert obj.source_type == AssumptionSourceType.ASSUMED
    assert obj.confidence == Decimal("0.90")
    assert obj.event_id is None


def test_empty_parameter_rejected():
    """Verify empty parameter fails validation."""
    with pytest.raises(ValidationError):
        AssumptionCreate(
            category="FOOD",
            parameter="",
            value="100",
            unit="INR",
        )


def test_empty_category_rejected():
    """Verify empty category fails validation."""
    with pytest.raises(ValidationError):
        AssumptionCreate(
            category="",
            parameter="meal_cost",
            value="100",
            unit="INR",
        )


def test_empty_unit_rejected():
    """Verify empty unit fails validation."""
    with pytest.raises(ValidationError):
        AssumptionCreate(
            category="FOOD",
            parameter="meal_cost",
            value="100",
            unit="",
        )


def test_confidence_range_validation():
    """Verify confidence must be between 0.0 and 1.0."""
    # Negative confidence
    with pytest.raises(ValidationError):
        AssumptionCreate(
            category="FOOD",
            parameter="meal_cost",
            value="100",
            unit="INR",
            confidence=Decimal("-0.1"),
        )

    # Confidence > 1.0
    with pytest.raises(ValidationError):
        AssumptionCreate(
            category="FOOD",
            parameter="meal_cost",
            value="100",
            unit="INR",
            confidence=Decimal("1.05"),
        )
