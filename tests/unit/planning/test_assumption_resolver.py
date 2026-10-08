"""
Unit tests for the AssumptionResolver domain engine.
Executed independently of FastAPI HTTP routing.
"""

from decimal import Decimal
from backend.app.models.event import Event
from backend.app.models.assumption import Assumption
from backend.app.planning.assumption_engine.manager import AssumptionResolver
from backend.app.schemas.assumption import AssumptionScope, AssumptionSourceType


def test_resolve_global_assumption(db_session):
    """Test resolving a parameter defined as a global assumption."""
    assumption = Assumption(
        event_id=None,
        category="WATER",
        parameter="water_per_person_per_day",
        value="5",
        unit="litres/person/day",
        source_type=AssumptionSourceType.ASSUMED.value,
        confidence=Decimal("0.85"),
        reference_notes="Baseline heuristic",
    )
    db_session.add(assumption)
    db_session.commit()

    resolved = AssumptionResolver.resolve(
        db=db_session,
        parameter="water_per_person_per_day",
    )

    assert resolved.is_resolved is True
    assert resolved.parameter == "water_per_person_per_day"
    assert resolved.value == "5"
    assert resolved.unit == "litres/person/day"
    assert resolved.source_type == AssumptionSourceType.ASSUMED
    assert resolved.scope == AssumptionScope.GLOBAL
    assert resolved.confidence == Decimal("0.85")
    assert "global" in resolved.explanation.lower()


def test_resolve_event_specific_assumption(db_session):
    """Test resolving a parameter defined specifically for an event."""
    event = Event(
        name="Hackathon 2026",
        event_type="HACKATHON",
        expected_attendees=200,
        duration_days=2,
    )
    db_session.add(event)
    db_session.commit()

    assumption = Assumption(
        event_id=event.id,
        category="FOOD",
        parameter="meal_cost_per_person",
        value="180",
        unit="INR/person/meal",
        source_type=AssumptionSourceType.USER_PROVIDED.value,
    )
    db_session.add(assumption)
    db_session.commit()

    resolved = AssumptionResolver.resolve(
        db=db_session,
        parameter="meal_cost_per_person",
        event_id=event.id,
    )

    assert resolved.is_resolved is True
    assert resolved.value == "180"
    assert resolved.unit == "INR/person/meal"
    assert resolved.source_type == AssumptionSourceType.USER_PROVIDED
    assert resolved.scope == AssumptionScope.EVENT
    assert "event-specific" in resolved.explanation.lower()


def test_event_specific_overrides_global(db_session):
    """
    Core Rule: Event-specific assumption must take precedence over
    a global assumption with the same parameter name.
    """
    event = Event(
        name="Tech Fest",
        event_type="TECH_FEST",
        expected_attendees=1000,
        duration_days=3,
    )
    db_session.add(event)
    db_session.commit()

    # 1. Global assumption (value = 5)
    global_assump = Assumption(
        event_id=None,
        category="WATER",
        parameter="water_per_person_per_day",
        value="5",
        unit="litres/person/day",
        source_type=AssumptionSourceType.REFERENCE.value,
    )
    # 2. Event override (value = 4)
    event_assump = Assumption(
        event_id=event.id,
        category="WATER",
        parameter="water_per_person_per_day",
        value="4",
        unit="litres/person/day",
        source_type=AssumptionSourceType.USER_PROVIDED.value,
    )
    db_session.add_all([global_assump, event_assump])
    db_session.commit()

    # Query with target event -> returns event override
    resolved_event = AssumptionResolver.resolve(
        db=db_session,
        parameter="water_per_person_per_day",
        event_id=event.id,
    )
    assert resolved_event.is_resolved is True
    assert resolved_event.value == "4"
    assert resolved_event.scope == AssumptionScope.EVENT
    assert resolved_event.source_type == AssumptionSourceType.USER_PROVIDED

    # Query without event -> returns global baseline
    resolved_global = AssumptionResolver.resolve(
        db=db_session,
        parameter="water_per_person_per_day",
        event_id=None,
    )
    assert resolved_global.is_resolved is True
    assert resolved_global.value == "5"
    assert resolved_global.scope == AssumptionScope.GLOBAL
    assert resolved_global.source_type == AssumptionSourceType.REFERENCE


def test_missing_assumption_reported_clearly(db_session):
    """
    Missing assumption must be explicitly reported as unresolved (never invented).
    Must be clearly distinguishable from zero or empty strings.
    """
    resolved = AssumptionResolver.resolve(
        db=db_session,
        parameter="unknown_energy_coefficient",
        event_id=42,
    )

    assert resolved.is_resolved is False
    assert resolved.value is None
    assert resolved.unit is None
    assert resolved.source_type is None
    assert resolved.scope is None
    assert "missing assumption" in resolved.explanation.lower()
    assert "unknown_energy_coefficient" in resolved.explanation


def test_source_type_provenance_preservation(db_session):
    """
    Verify that source types are preserved faithfully and never collapsed:
    USER_PROVIDED, REFERENCE, ASSUMED, ACTUAL, ML_PREDICTED.
    """
    sources = [
        ("param_user", AssumptionSourceType.USER_PROVIDED),
        ("param_ref", AssumptionSourceType.REFERENCE),
        ("param_assumed", AssumptionSourceType.ASSUMED),
        ("param_actual", AssumptionSourceType.ACTUAL),
        ("param_ml", AssumptionSourceType.ML_PREDICTED),
    ]

    for param, src in sources:
        db_session.add(
            Assumption(
                event_id=None,
                category="TEST",
                parameter=param,
                value="100",
                unit="units",
                source_type=src.value,
            )
        )
    db_session.commit()

    for param, expected_src in sources:
        res = AssumptionResolver.resolve(db=db_session, parameter=param)
        assert res.is_resolved is True
        assert res.source_type == expected_src


def test_actual_and_ml_predicted_not_converted_to_assumed(db_session):
    """
    Verify that ACTUAL measurements and ML_PREDICTED values maintain their
    distinct source types and are never converted into ASSUMED.
    """
    actual_record = Assumption(
        event_id=None,
        category="WATER",
        parameter="water_meter_reading",
        value="4300",
        unit="litres",
        source_type=AssumptionSourceType.ACTUAL.value,
    )
    ml_record = Assumption(
        event_id=None,
        category="ATTENDANCE",
        parameter="predicted_turnout",
        value="450",
        unit="attendees",
        source_type=AssumptionSourceType.ML_PREDICTED.value,
    )
    db_session.add_all([actual_record, ml_record])
    db_session.commit()

    res_actual = AssumptionResolver.resolve(db=db_session, parameter="water_meter_reading")
    assert res_actual.source_type == AssumptionSourceType.ACTUAL
    assert res_actual.source_type != AssumptionSourceType.ASSUMED

    res_ml = AssumptionResolver.resolve(db=db_session, parameter="predicted_turnout")
    assert res_ml.source_type == AssumptionSourceType.ML_PREDICTED
    assert res_ml.source_type != AssumptionSourceType.ASSUMED
