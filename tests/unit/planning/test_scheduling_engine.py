"""
Unit tests for the Scheduling Engine, Template Registry, and Checklist Generator.
Tests:
- Valid and invalid time window validation
- Chronological, non-overlapping timetable slots
- Supported event types
- Meal inclusion and exclusion
- Short window handling and conflicts
- Setup and cleanup placement
- Multi-day event schedules
- Checklist phases, categories, and relative deadlines
- Deterministic output consistency
"""

from datetime import date, time, timedelta
import pytest
from pydantic import ValidationError

from backend.app.schemas.event import EventType
from backend.app.planning.modules.food.schemas import MealType
from backend.app.planning.modules.scheduling.schemas import (
    ActivityType,
    ChecklistCategory,
    ChecklistPhase,
    ScheduleRequest,
    ScheduleResult,
)
from backend.app.planning.modules.scheduling.template_registry import (
    EVENT_TEMPLATES,
    get_template_for_event_type,
)
from backend.app.planning.modules.scheduling.scheduler import (
    SchedulingEngine,
    scheduling_engine,
)
from backend.app.planning.modules.scheduling.checklist_generator import (
    ChecklistGenerator,
    checklist_generator,
)


def _time_str_to_minutes(time_str: str) -> int:
    h, m = map(int, time_str.split(":"))
    return h * 60 + m


# -------------------------------------------------------------------------
# 1. Validation of Time Windows
# -------------------------------------------------------------------------

def test_valid_time_window_accepted():
    """Verify that a valid window where end_time > start_time passes validation."""
    req = ScheduleRequest(
        event_type=EventType.WORKSHOP,
        expected_attendees=50,
        event_date=date(2026, 11, 15),
        start_time=time(9, 0),
        end_time=time(17, 0),
    )
    assert req.start_time == time(9, 0)
    assert req.end_time == time(17, 0)
    assert req.duration_days == 1


def test_invalid_time_window_rejected():
    """Verify that end_time <= start_time raises a ValidationError and is not silently defaulted."""
    # End time equal to start time
    with pytest.raises(ValidationError) as exc_info:
        ScheduleRequest(
            event_type=EventType.WORKSHOP,
            expected_attendees=50,
            event_date=date(2026, 11, 15),
            start_time=time(10, 0),
            end_time=time(10, 0),
        )
    assert "must be strictly after start time" in str(exc_info.value)

    # End time before start time
    with pytest.raises(ValidationError) as exc_info:
        ScheduleRequest(
            event_type=EventType.WORKSHOP,
            expected_attendees=50,
            event_date=date(2026, 11, 15),
            start_time=time(18, 0),
            end_time=time(9, 0),
        )
    assert "must be strictly after start time" in str(exc_info.value)


def test_invalid_attendees_rejected():
    """Verify attendee count must be strictly positive."""
    with pytest.raises(ValidationError):
        ScheduleRequest(
            event_type=EventType.WORKSHOP,
            expected_attendees=0,
            event_date=date(2026, 11, 15),
            start_time=time(9, 0),
            end_time=time(17, 0),
        )


# -------------------------------------------------------------------------
# 2. Chronological and Non-Overlapping Timetable Slots
# -------------------------------------------------------------------------

def test_chronological_and_non_overlapping_slots():
    """
    Verify that generated slots:
    1. Are ordered chronologically.
    2. Do NOT overlap with each other.
    3. Stay strictly within the window boundaries.
    """
    req = ScheduleRequest(
        event_type=EventType.CONFERENCE,
        expected_attendees=120,
        event_date=date(2026, 11, 20),
        start_time=time(9, 30),
        end_time=time(17, 30),
        selected_meal_types=[MealType.LUNCH, MealType.SNACKS],
    )
    result = scheduling_engine.generate_schedule(req)

    assert len(result.daily_schedules) == 1
    slots = result.daily_schedules[0].slots
    assert len(slots) >= 4

    req_start_min = _time_str_to_minutes("09:30")
    req_end_min = _time_str_to_minutes("17:30")

    assert _time_str_to_minutes(slots[0].start_time) >= req_start_min
    assert _time_str_to_minutes(slots[-1].end_time) <= req_end_min

    for i in range(len(slots)):
        slot = slots[i]
        start_m = _time_str_to_minutes(slot.start_time)
        end_m = _time_str_to_minutes(slot.end_time)
        assert end_m > start_m, f"Slot {slot.title} must have positive duration"
        assert slot.duration_minutes == (end_m - start_m)

        if i > 0:
            prev_slot = slots[i - 1]
            prev_end_m = _time_str_to_minutes(prev_slot.end_time)
            assert start_m >= prev_end_m, (
                f"Overlap detected between slot {prev_slot.title} (ends {prev_slot.end_time}) "
                f"and slot {slot.title} (starts {slot.start_time})"
            )


# -------------------------------------------------------------------------
# 3. All 9 Supported Event Types
# -------------------------------------------------------------------------

@pytest.mark.parametrize("event_type", list(EventType))
def test_all_supported_event_types(event_type):
    """Verify that every supported event type produces a valid schedule."""
    template = get_template_for_event_type(event_type)
    assert template.event_type == event_type
    assert len(template.day_1_activities) > 0

    req = ScheduleRequest(
        event_type=event_type,
        expected_attendees=80,
        event_date=date(2026, 12, 1),
        start_time=time(10, 0),
        end_time=time(16, 0),
        selected_meal_types=[MealType.LUNCH],
    )
    result = scheduling_engine.generate_schedule(req)
    assert result.event_type == event_type
    assert len(result.daily_schedules) == 1
    assert len(result.daily_schedules[0].slots) > 0

    # Ensure all slots are explicitly labeled as suggestions
    for slot in result.daily_schedules[0].slots:
        assert slot.is_suggestion is True


# -------------------------------------------------------------------------
# 4. Meal Inclusion and Exclusion
# -------------------------------------------------------------------------

def test_meal_inclusion_and_exclusion():
    """
    Verify:
    1. Only meals present in selected_meal_types are placed in the timetable.
    2. Unselected meals are NEVER placed.
    3. When selected_meal_types is empty, no meal slots are placed.
    """
    # Case A: Only LUNCH and SNACKS selected
    req_a = ScheduleRequest(
        event_type=EventType.WORKSHOP,
        expected_attendees=60,
        event_date=date(2026, 11, 10),
        start_time=time(9, 0),
        end_time=time(17, 0),
        selected_meal_types=[MealType.LUNCH, MealType.SNACKS],
    )
    result_a = scheduling_engine.generate_schedule(req_a)
    slots_a = result_a.all_slots

    meal_types_present = [s.meal_type for s in slots_a if s.is_meal]
    assert MealType.LUNCH in meal_types_present
    assert MealType.SNACKS in meal_types_present
    assert MealType.BREAKFAST not in meal_types_present
    assert MealType.DINNER not in meal_types_present

    # Case B: No meals selected
    req_b = ScheduleRequest(
        event_type=EventType.WORKSHOP,
        expected_attendees=60,
        event_date=date(2026, 11, 10),
        start_time=time(9, 0),
        end_time=time(17, 0),
        selected_meal_types=[],
    )
    result_b = scheduling_engine.generate_schedule(req_b)
    slots_b = result_b.all_slots
    assert not any(s.is_meal for s in slots_b), "No meal slots should exist when selected_meal_types is empty"


# -------------------------------------------------------------------------
# 5. Setup and Cleanup Slots
# -------------------------------------------------------------------------

def test_setup_and_cleanup_placement():
    """Verify setup slot is at the beginning and cleanup slot is at the end when requested."""
    # When include_setup_cleanup is True
    req_with = ScheduleRequest(
        event_type=EventType.TECH_FEST,
        expected_attendees=150,
        event_date=date(2026, 11, 15),
        start_time=time(9, 0),
        end_time=time(17, 0),
        include_setup_cleanup=True,
    )
    res_with = scheduling_engine.generate_schedule(req_with)
    slots_with = res_with.daily_schedules[0].slots

    assert slots_with[0].activity_type == ActivityType.SETUP
    assert slots_with[-1].activity_type == ActivityType.CLEANUP

    # When include_setup_cleanup is False
    req_without = ScheduleRequest(
        event_type=EventType.TECH_FEST,
        expected_attendees=150,
        event_date=date(2026, 11, 15),
        start_time=time(9, 0),
        end_time=time(17, 0),
        include_setup_cleanup=False,
    )
    res_without = scheduling_engine.generate_schedule(req_without)
    slots_without = res_without.daily_schedules[0].slots

    assert not any(s.activity_type == ActivityType.SETUP for s in slots_without)
    assert not any(s.activity_type == ActivityType.CLEANUP for s in slots_without)


# -------------------------------------------------------------------------
# 6. Short Windows and Conflict Reporting
# -------------------------------------------------------------------------

def test_short_window_handling():
    """
    Verify that very short windows (e.g. 75 minutes) do not crash the engine,
    produce appropriate warning/conflict notices, and still generate non-overlapping slots.
    """
    req = ScheduleRequest(
        event_type=EventType.WORKSHOP,
        expected_attendees=40,
        event_date=date(2026, 11, 15),
        start_time=time(14, 0),
        end_time=time(15, 15),  # 75 minutes
        selected_meal_types=[MealType.SNACKS],
        include_setup_cleanup=True,
    )
    result = scheduling_engine.generate_schedule(req)

    assert len(result.daily_schedules) == 1
    slots = result.daily_schedules[0].slots
    assert len(slots) > 0

    # Ensure warning is reported about the brief window
    assert len(result.warnings) > 0

    # Ensure slots are still strictly non-overlapping
    for i in range(1, len(slots)):
        prev_end = _time_str_to_minutes(slots[i - 1].end_time)
        curr_start = _time_str_to_minutes(slots[i].start_time)
        assert curr_start >= prev_end


# -------------------------------------------------------------------------
# 7. Multi-day Event Scheduling
# -------------------------------------------------------------------------

def test_multi_day_scheduling():
    """
    Verify multi-day events generate a coherent daily schedule for each day,
    with dates incrementing sequentially.
    """
    start_d = date(2026, 11, 15)
    req = ScheduleRequest(
        event_type=EventType.HACKATHON,
        expected_attendees=100,
        event_date=start_d,
        start_time=time(9, 0),
        end_time=time(18, 0),
        duration_days=3,
        selected_meal_types=[MealType.LUNCH, MealType.SNACKS],
    )
    result = scheduling_engine.generate_schedule(req)

    assert result.duration_days == 3
    assert len(result.daily_schedules) == 3

    for idx, day_sched in enumerate(result.daily_schedules):
        expected_date = (start_d + timedelta(days=idx)).isoformat()
        assert day_sched.day_number == idx + 1
        assert day_sched.date == expected_date
        assert len(day_sched.slots) >= 3

        # Non-overlapping verification for each day
        for i in range(1, len(day_sched.slots)):
            prev_end = _time_str_to_minutes(day_sched.slots[i - 1].end_time)
            curr_start = _time_str_to_minutes(day_sched.slots[i].start_time)
            assert curr_start >= prev_end


# -------------------------------------------------------------------------
# 8. Checklist Generation & Phases
# -------------------------------------------------------------------------

def test_checklist_generation():
    """
    Verify that generated checklists:
    1. Contain all four distinct chronological phases.
    2. Have relative deadlines and computed dates.
    3. Include sustainability-specific tasks.
    4. Are explicitly labeled as suggestions.
    """
    event_d = date(2026, 11, 20)
    req = ScheduleRequest(
        event_type=EventType.CONFERENCE,
        expected_attendees=150,
        event_date=event_d,
        start_time=time(9, 0),
        end_time=time(17, 0),
        selected_meal_types=[MealType.LUNCH],
    )
    tasks = checklist_generator.generate_checklist(req)

    assert len(tasks) >= 10

    phases_present = {t.phase for t in tasks}
    assert ChecklistPhase.BEFORE_EVENT in phases_present
    assert ChecklistPhase.EVENT_DAY_MORNING in phases_present
    assert ChecklistPhase.DURING_EVENT in phases_present
    assert ChecklistPhase.AFTER_EVENT in phases_present

    # Verify all tasks are marked as suggestions
    for t in tasks:
        assert t.is_suggestion is True
        assert t.deadline_relative is not None

    # Verify pre-event tasks have calculated suggested_deadline_date
    pre_event_tasks = [t for t in tasks if t.phase == ChecklistPhase.BEFORE_EVENT]
    assert all(t.suggested_deadline_date is not None for t in pre_event_tasks)

    # Verify sustainability-tagged tasks exist
    green_tasks = [t for t in tasks if t.is_sustainability_action]
    assert len(green_tasks) >= 3


# -------------------------------------------------------------------------
# 9. Deterministic Output Consistency
# -------------------------------------------------------------------------

def test_deterministic_results():
    """Verify that identical inputs produce 100% identical timetables and checklists."""
    req = ScheduleRequest(
        event_type=EventType.TECH_FEST,
        expected_attendees=200,
        event_date=date(2026, 11, 25),
        start_time=time(9, 30),
        end_time=time(17, 0),
        selected_meal_types=[MealType.LUNCH, MealType.HIGH_TEA],
    )

    run_1_schedule = scheduling_engine.generate_schedule(req)
    run_2_schedule = scheduling_engine.generate_schedule(req)

    run_1_checklist = checklist_generator.generate_checklist(req)
    run_2_checklist = checklist_generator.generate_checklist(req)

    assert run_1_schedule.model_dump() == run_2_schedule.model_dump()
    assert [t.model_dump() for t in run_1_checklist] == [t.model_dump() for t in run_2_checklist]
