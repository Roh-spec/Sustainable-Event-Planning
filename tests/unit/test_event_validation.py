import pytest
from pydantic import ValidationError

from backend.app.schemas.event import EventCreate
from backend.app.schemas.budget import BudgetCreate


def test_event_valid_schema():
    """Verify valid event schema instantiates properly."""
    data = {
        "name": "Annual Hackathon 2026",
        "event_type": "HACKATHON",
        "expected_attendees": 250,
        "duration_days": 2,
        "location": "Main Auditorium",
        "budget": {
            "total_budget": "150000.00",
            "currency": "INR",
        },
    }
    event = EventCreate(**data)
    assert event.name == "Annual Hackathon 2026"
    assert event.expected_attendees == 250
    assert event.duration_days == 2
    assert event.budget is not None
    assert event.budget.total_budget == 150000


def test_event_attendees_must_be_positive():
    """Verify attendees <= 0 fails validation."""
    with pytest.raises(ValidationError):
        EventCreate(
            name="Invalid Event",
            event_type="WORKSHOP",
            expected_attendees=0,
            duration_days=1,
        )

    with pytest.raises(ValidationError):
        EventCreate(
            name="Invalid Event",
            event_type="WORKSHOP",
            expected_attendees=-10,
            duration_days=1,
        )


def test_event_duration_must_be_positive():
    """Verify duration <= 0 fails validation."""
    with pytest.raises(ValidationError):
        EventCreate(
            name="Invalid Event",
            event_type="WORKSHOP",
            expected_attendees=50,
            duration_days=0,
        )

    with pytest.raises(ValidationError):
        EventCreate(
            name="Invalid Event",
            event_type="WORKSHOP",
            expected_attendees=50,
            duration_days=-1,
        )


def test_budget_must_be_non_negative():
    """Verify negative budget fails validation."""
    with pytest.raises(ValidationError):
        BudgetCreate(
            total_budget="-500.00",
            currency="INR",
        )
