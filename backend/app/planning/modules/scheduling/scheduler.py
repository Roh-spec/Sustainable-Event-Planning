"""
Deterministic Scheduling Engine for Sustainable Event Plans.
Generates chronological, non-overlapping timetables fitting strictly within
the organizer-provided event date, start time, and end time.
Does NOT use LLMs, random numbers, external APIs, or fictitious data.
"""

from copy import deepcopy
from datetime import date, time, timedelta
from typing import List, Optional, Tuple

from backend.app.schemas.event import EventType
from backend.app.planning.modules.food.schemas import MealType
from backend.app.planning.modules.scheduling.schemas import (
    ActivityType,
    DaySchedule,
    ScheduleConflict,
    ScheduleRequest,
    ScheduleResult,
    TimetableSlot,
)
from backend.app.planning.modules.scheduling.template_registry import (
    MEAL_DEFAULTS,
    TemplateActivity,
    get_template_for_event_type,
)


def _time_to_minutes(t: time) -> int:
    """Converts a datetime.time to total minutes from midnight."""
    return t.hour * 60 + t.minute


def _minutes_to_time_str(minutes: int) -> str:
    """Converts minutes from midnight to a 24-hour HH:MM string."""
    norm = minutes % (24 * 60)
    hours = norm // 60
    mins = norm % 60
    return f"{hours:02d}:{mins:02d}"


class SchedulingEngine:
    """
    Modular, deterministic scheduler that builds complete event timetables.
    """

    @classmethod
    def generate_schedule(cls, request: ScheduleRequest) -> ScheduleResult:
        """
        Main entry point for generating an event timetable.
        """
        # 1. Fetch template for event type
        template = get_template_for_event_type(request.event_type)

        daily_schedules: List[DaySchedule] = []
        all_conflicts: List[ScheduleConflict] = []
        all_warnings: List[str] = []
        assumptions: List[str] = [
            f"Schedule generated using reference template for '{request.event_type.value}'.",
            "Timetable slots and durations are suggested guidelines, not verified facts.",
            f"Daily operational window: {request.start_time.strftime('%H:%M')} to {request.end_time.strftime('%H:%M')}.",
        ]

        if request.selected_meal_types:
            meal_names = ", ".join(m.value for m in request.selected_meal_types)
            assumptions.append(f"Included meals based on organizer selection: {meal_names}.")
        else:
            assumptions.append("No meals requested; catering periods excluded from the schedule.")

        # 2. Build schedule for each day
        for day_num in range(1, request.duration_days + 1):
            current_date = request.event_date + timedelta(days=day_num - 1)
            day_schedule, conflicts, warnings = cls._schedule_single_day(
                request=request,
                day_num=day_num,
                current_date=current_date,
                template=template,
            )
            daily_schedules.append(day_schedule)
            all_conflicts.extend(conflicts)
            all_warnings.extend(warnings)

        # 3. Compile flattened slots list
        all_slots: List[TimetableSlot] = [
            slot for day in daily_schedules for slot in day.slots
        ]

        return ScheduleResult(
            event_type=request.event_type,
            event_date=request.event_date.isoformat(),
            start_time=request.start_time.strftime("%H:%M"),
            end_time=request.end_time.strftime("%H:%M"),
            duration_days=request.duration_days,
            daily_schedules=daily_schedules,
            all_slots=all_slots,
            conflicts=all_conflicts,
            warnings=all_warnings,
            assumptions=assumptions,
        )

    @classmethod
    def _schedule_single_day(
        cls,
        request: ScheduleRequest,
        day_num: int,
        current_date: date,
        template: any,
    ) -> Tuple[DaySchedule, List[ScheduleConflict], List[str]]:
        """
        Builds a single-day chronological timetable within start_time and end_time.
        """
        conflicts: List[ScheduleConflict] = []
        warnings: List[str] = []

        start_min = _time_to_minutes(request.start_time)
        end_min = _time_to_minutes(request.end_time)
        total_window = end_min - start_min

        # Setup and cleanup buffer calculations
        setup_min = template.recommended_setup_minutes if request.include_setup_cleanup else 0
        cleanup_min = template.recommended_cleanup_minutes if request.include_setup_cleanup else 0

        # Handle very short window gracefully: scale down setup and cleanup if window is tight
        if total_window < (setup_min + cleanup_min + 60):
            if request.include_setup_cleanup:
                setup_min = min(15, total_window // 6)
                cleanup_min = min(15, total_window // 6)
                warnings.append(
                    f"Day {day_num}: Event window is brief ({total_window} mins). Setup and cleanup were reduced to {setup_min}m and {cleanup_min}m."
                )

        # Selected meals for this day
        # For single-day, all selected meals belong to Day 1.
        # For multi-day, standard meals apply daily.
        meals_to_schedule = deepcopy(request.selected_meal_types)

        # Check whether meals fit in the window
        meal_total_min = sum(MEAL_DEFAULTS.get(m, {}).get("min_duration_minutes", 30) for m in meals_to_schedule)
        fixed_essential_time = setup_min + cleanup_min + meal_total_min

        if fixed_essential_time > total_window:
            conflicts.append(
                ScheduleConflict(
                    conflict_type="WINDOW_TOO_SHORT",
                    description=(
                        f"Day {day_num}: Requested window ({total_window} mins) is too brief to accommodate "
                        f"setup ({setup_min}m), cleanup ({cleanup_min}m), and selected meals ({meal_total_min}m)."
                    ),
                    affected_activities=[m.value for m in meals_to_schedule],
                    severity="WARNING",
                )
            )
            # Condense meal durations to absolute minimum (15m each)
            meal_total_min = len(meals_to_schedule) * 15

        # -------------------------------------------------------------
        # Determine Activity Candidates from Template
        # -------------------------------------------------------------
        raw_activities: List[TemplateActivity]
        if day_num == 1:
            raw_activities = template.day_1_activities
        else:
            # For Day 2+, use subsequent activities or standard progression
            raw_activities = [
                TemplateActivity(
                    title=f"Day {day_num} Morning Check-in & Daily Agenda",
                    activity_type=ActivityType.REGISTRATION,
                    default_duration_minutes=25,
                    min_duration_minutes=15,
                    description="Welcome back attendees and review the day's schedule.",
                    priority=1,
                ),
                TemplateActivity(
                    title="Morning Core Work Sessions & Competitions",
                    activity_type=ActivityType.COMPETITION,
                    default_duration_minutes=120,
                    min_duration_minutes=60,
                    description="Continuation of primary competitive or collaborative activities.",
                    priority=1,
                ),
                TemplateActivity(
                    title="Afternoon Synthesis & Final Presentations",
                    activity_type=ActivityType.SESSION,
                    default_duration_minutes=90,
                    min_duration_minutes=45,
                    description="Review of outcomes, project judging, and concluding proceedings.",
                    priority=1,
                ),
                TemplateActivity(
                    title="Grand Awards Ceremony & Official Adjournment",
                    activity_type=ActivityType.AWARDS,
                    default_duration_minutes=40,
                    min_duration_minutes=25,
                    description="Prize distribution and final event closure.",
                    priority=1,
                ),
            ]

        # Calculate budget available for template activities
        available_for_activities = total_window - setup_min - cleanup_min - meal_total_min
        available_for_activities = max(0, available_for_activities)

        # Select which template activities fit
        selected_activities, omitted_activities = cls._fit_template_activities(
            activities=raw_activities,
            available_minutes=available_for_activities,
        )

        for omitted in omitted_activities:
            warnings.append(
                f"Day {day_num}: Activity '{omitted.title}' omitted to fit inside the {total_window}-minute event window."
            )

        # -------------------------------------------------------------
        # Assemble Chronological Slots (Setup -> Activities & Meals -> Cleanup)
        # -------------------------------------------------------------
        slots: List[TimetableSlot] = []
        current_cursor = start_min
        slot_counter = 1

        # 1. Setup slot (at the very beginning)
        if setup_min > 0:
            slots.append(
                TimetableSlot(
                    slot_id=f"slot_d{day_num}_{slot_counter:02d}_setup",
                    day=day_num,
                    start_time=_minutes_to_time_str(current_cursor),
                    end_time=_minutes_to_time_str(current_cursor + setup_min),
                    duration_minutes=setup_min,
                    title="Venue Preparation, AV Check & Waste Station Staging",
                    activity_type=ActivityType.SETUP,
                    description="Organizers verify venue access, AV equipment, and set up labeled recycling and food waste bins.",
                    is_meal=False,
                    is_sustainability_action=True,
                    is_suggestion=True,
                )
            )
            current_cursor += setup_min
            slot_counter += 1

        # 2. Interleave template activities and requested meals chronologically
        interleaved_items = cls._interleave_activities_and_meals(
            activities=selected_activities,
            selected_meals=meals_to_schedule,
            available_duration=total_window - setup_min - cleanup_min,
            start_cursor=current_cursor,
        )

        for item in interleaved_items:
            duration = item["duration_minutes"]
            # Guard against exceeding total window
            if current_cursor + duration > (end_min - cleanup_min):
                duration = max(10, (end_min - cleanup_min) - current_cursor)

            if duration <= 0:
                continue

            slots.append(
                TimetableSlot(
                    slot_id=f"slot_d{day_num}_{slot_counter:02d}_{item['code']}",
                    day=day_num,
                    start_time=_minutes_to_time_str(current_cursor),
                    end_time=_minutes_to_time_str(current_cursor + duration),
                    duration_minutes=duration,
                    title=item["title"],
                    activity_type=item["activity_type"],
                    description=item.get("description"),
                    is_meal=item.get("is_meal", False),
                    meal_type=item.get("meal_type"),
                    is_sustainability_action=item.get("is_sustainability_action", False),
                    is_suggestion=True,
                )
            )
            current_cursor += duration
            slot_counter += 1

        # If there is remaining slack before cleanup starts, extend the last session or add networking
        slack = (end_min - cleanup_min) - current_cursor
        if slack >= 15:
            slots.append(
                TimetableSlot(
                    slot_id=f"slot_d{day_num}_{slot_counter:02d}_networking",
                    day=day_num,
                    start_time=_minutes_to_time_str(current_cursor),
                    end_time=_minutes_to_time_str(current_cursor + slack),
                    duration_minutes=slack,
                    title="Informal Networking, Green Feedback & Wrap-up",
                    activity_type=ActivityType.NETWORKING,
                    description="Open networking and collection of digital attendee feedback.",
                    is_meal=False,
                    is_sustainability_action=False,
                    is_suggestion=True,
                )
            )
            current_cursor += slack
            slot_counter += 1
        elif slack > 0 and slots:
            # Absorb small slack into previous slot
            prev = slots[-1]
            prev.duration_minutes += slack
            prev.end_time = _minutes_to_time_str(current_cursor + slack)
            current_cursor += slack

        # 3. Cleanup slot (at the very end)
        if cleanup_min > 0:
            slots.append(
                TimetableSlot(
                    slot_id=f"slot_d{day_num}_{slot_counter:02d}_cleanup",
                    day=day_num,
                    start_time=_minutes_to_time_str(current_cursor),
                    end_time=_minutes_to_time_str(end_min),
                    duration_minutes=end_min - current_cursor,
                    title="Venue Cleanup, Reusable Tableware Retrieval & Waste Audit",
                    activity_type=ActivityType.CLEANUP,
                    description="Retrieve reusable tableware, pack surplus food for donation, and perform final waste segregation.",
                    is_meal=False,
                    is_sustainability_action=True,
                    is_suggestion=True,
                )
            )

        day_schedule = DaySchedule(
            day_number=day_num,
            date=current_date.isoformat(),
            start_time=request.start_time.strftime("%H:%M"),
            end_time=request.end_time.strftime("%H:%M"),
            total_duration_minutes=total_window,
            slots=slots,
        )

        return day_schedule, conflicts, warnings

    @classmethod
    def _fit_template_activities(
        cls,
        activities: List[TemplateActivity],
        available_minutes: int,
    ) -> Tuple[List[TemplateActivity], List[TemplateActivity]]:
        """
        Determines which template activities can fit within available minutes.
        Prioritizes high-priority activities (priority 1 > 2 > 3).
        Compresses durations to min_duration_minutes if needed.
        """
        if available_minutes <= 0:
            return [], list(activities)

        # Check total default duration
        total_default = sum(a.default_duration_minutes for a in activities)
        if total_default <= available_minutes:
            return list(activities), []

        # If defaults don't fit, sort by priority
        # Keep vital/core activities and compress durations
        selected: List[TemplateActivity] = []
        omitted: List[TemplateActivity] = []
        current_allocated = 0

        # Sort activities by priority (1 is most important)
        indexed_acts = sorted(enumerate(activities), key=lambda x: (x[1].priority, x[0]))

        for orig_idx, act in indexed_acts:
            min_dur = act.min_duration_minutes
            if current_allocated + min_dur <= available_minutes:
                selected.append(act)
                current_allocated += min_dur
            else:
                omitted.append(act)

        # Restore original chronological order of selected activities
        selected.sort(key=lambda x: activities.index(x))

        return selected, omitted

    @classmethod
    def _interleave_activities_and_meals(
        cls,
        activities: List[TemplateActivity],
        selected_meals: List[MealType],
        available_duration: int,
        start_cursor: int,
    ) -> List[dict]:
        """
        Interleaves template activities and selected meals chronologically.
        Positions meals near their natural preferred times.
        """
        items: List[dict] = []

        # Convert activities to item dicts
        for idx, act in enumerate(activities):
            items.append({
                "code": f"act_{idx+1}",
                "title": act.title,
                "activity_type": act.activity_type,
                "duration_minutes": act.default_duration_minutes,
                "min_duration_minutes": act.min_duration_minutes,
                "description": act.description,
                "is_meal": False,
                "meal_type": None,
                "is_sustainability_action": act.is_sustainability_action,
                "preferred_hour": None,
            })

        # Add meal items
        for m in selected_meals:
            m_def = MEAL_DEFAULTS.get(m, {
                "title": f"{m.value.replace('_', ' ').title()} Service",
                "default_duration_minutes": 45,
                "min_duration_minutes": 30,
                "preferred_hour": 13,
                "preferred_minute": 0,
                "description": f"Scheduled catering period for {m.value}.",
            })
            items.append({
                "code": f"meal_{m.value.lower()}",
                "title": m_def["title"],
                "activity_type": ActivityType.MEAL,
                "duration_minutes": m_def["default_duration_minutes"],
                "min_duration_minutes": m_def["min_duration_minutes"],
                "description": m_def["description"],
                "is_meal": True,
                "meal_type": m,
                "is_sustainability_action": False,
                "preferred_hour": m_def["preferred_hour"],
            })

        # Chronological sorting order:
        # Breakfast -> Morning Sessions -> Refreshments -> Lunch -> Afternoon Sessions -> Snacks/Tea -> Closing -> Dinner
        def sort_key(item: dict) -> Tuple[int, int]:
            if item["is_meal"]:
                m = item["meal_type"]
                if m == MealType.BREAKFAST:
                    return (10, 0)
                if m == MealType.REFRESHMENTS:
                    return (35, 0)
                if m == MealType.LUNCH:
                    return (50, 0)
                if m in (MealType.SNACKS, MealType.HIGH_TEA):
                    return (70, 0)
                if m == MealType.DINNER:
                    return (90, 0)
                return (55, 0)
            else:
                act_type = item["activity_type"]
                if act_type == ActivityType.REGISTRATION:
                    return (5, 0)
                if act_type == ActivityType.OPENING:
                    return (15, 0)
                if act_type == ActivityType.KEYNOTE:
                    return (25, 0)
                if act_type == ActivityType.WORKSHOP:
                    return (40, 0)
                if act_type == ActivityType.COMPETITION:
                    return (45, 0)
                if act_type == ActivityType.SESSION:
                    return (60, 0)
                if act_type == ActivityType.AWARDS:
                    return (80, 0)
                if act_type == ActivityType.CLOSING:
                    return (85, 0)
                return (50, 0)

        items.sort(key=sort_key)

        # Scale durations if total exceeds or is under available duration
        total_items_duration = sum(it["duration_minutes"] for it in items)
        if total_items_duration > available_duration and available_duration > 0:
            scale_ratio = available_duration / total_items_duration
            for it in items:
                scaled = int(it["duration_minutes"] * scale_ratio)
                it["duration_minutes"] = max(it["min_duration_minutes"], scaled)

        return items


scheduling_engine = SchedulingEngine()
