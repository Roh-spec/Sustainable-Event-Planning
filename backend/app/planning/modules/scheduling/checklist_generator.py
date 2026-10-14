"""
Deterministic Checklist Generator for Sustainable Event Planning.
Produces actionable, phase-grouped checklists with relative deadlines
and transparent provenance.
Does NOT invent confirmed vendor bookings, staff assignments, or completed tasks.
All tasks are explicitly labeled as suggestions.
"""

from datetime import date, timedelta
from typing import List, Optional

from backend.app.schemas.event import EventType
from backend.app.planning.modules.food.schemas import MealType
from backend.app.planning.modules.scheduling.schemas import (
    ChecklistCategory,
    ChecklistItem,
    ChecklistPhase,
    ScheduleRequest,
)


class ChecklistGenerator:
    """
    Compiles phase-grouped operational and sustainability checklists.
    """

    @classmethod
    def generate_checklist(cls, request: ScheduleRequest) -> List[ChecklistItem]:
        """
        Generates a complete checklist for an event based on its type, attendee count,
        timing, and selected meals.
        """
        tasks: List[ChecklistItem] = []
        event_date = request.event_date
        attendees = request.expected_attendees
        event_type = request.event_type
        meals = request.selected_meal_types

        # -------------------------------------------------------------
        # Phase 1: BEFORE_EVENT (T-14 to T-1 Days)
        # -------------------------------------------------------------
        tasks.append(
            ChecklistItem(
                task_id="task_prep_01_venue",
                title=f"Confirm Venue Booking & Space Allocation for {event_type.value}",
                description=(
                    f"Reconfirm reservation of main auditorium/hall for {attendees} attendees. "
                    "Verify seating capacity, ventilation, and emergency exits."
                ),
                phase=ChecklistPhase.BEFORE_EVENT,
                category=ChecklistCategory.LOGISTICS,
                deadline_relative="T-14 days",
                suggested_deadline_date=(event_date - timedelta(days=14)).isoformat(),
                is_sustainability_action=False,
                is_suggestion=True,
                notes="Check that venue manager has approved scheduled start and end times.",
            )
        )

        tasks.append(
            ChecklistItem(
                task_id="task_prep_02_av",
                title="Reserve Audio-Visual & Power Infrastructure",
                description="Book projector, sound system, wireless microphones, and power strips for attendee stations.",
                phase=ChecklistPhase.BEFORE_EVENT,
                category=ChecklistCategory.AV_EQUIPMENT,
                deadline_relative="T-14 days",
                suggested_deadline_date=(event_date - timedelta(days=14)).isoformat(),
                is_sustainability_action=False,
                is_suggestion=True,
                notes="Ensure projection resolution matches speaker presentation formats.",
            )
        )

        tasks.append(
            ChecklistItem(
                task_id="task_prep_03_team",
                title="Recruit Student Volunteers & Assign Lead Roles",
                description="Form organizing sub-teams for registration, stage management, catering, and waste auditing.",
                phase=ChecklistPhase.BEFORE_EVENT,
                category=ChecklistCategory.LOGISTICS,
                deadline_relative="T-10 days",
                suggested_deadline_date=(event_date - timedelta(days=10)).isoformat(),
                is_sustainability_action=False,
                is_suggestion=True,
            )
        )

        if meals:
            meal_list_str = ", ".join(m.value.title() for m in meals)
            tasks.append(
                ChecklistItem(
                    task_id="task_prep_04_catering",
                    title=f"Confirm Catering Contract for {attendees} Attendees ({meal_list_str})",
                    description=(
                        f"Finalize menu items for planned meals ({meal_list_str}) based on {attendees} expected attendees. "
                        "Confirm serving times, delivery schedule, and dietary split (veg/non-veg)."
                    ),
                    phase=ChecklistPhase.BEFORE_EVENT,
                    category=ChecklistCategory.CATERING,
                    deadline_relative="T-10 days",
                    suggested_deadline_date=(event_date - timedelta(days=10)).isoformat(),
                    is_sustainability_action=False,
                    is_suggestion=True,
                )
            )

            tasks.append(
                ChecklistItem(
                    task_id="task_prep_05_reusables",
                    title="Coordinate Reusable Tableware & Wash Facility",
                    description=(
                        f"Arrange for washable plates, cups, and spoons for {attendees} attendees. "
                        "Confirm dishwashing water supply or contracted dish-rental service to minimize disposable packaging."
                    ),
                    phase=ChecklistPhase.BEFORE_EVENT,
                    category=ChecklistCategory.WASTE_MANAGEMENT,
                    deadline_relative="T-7 days",
                    suggested_deadline_date=(event_date - timedelta(days=7)).isoformat(),
                    is_sustainability_action=True,
                    is_suggestion=True,
                    notes="Aim for 100% reusable dining items where campus facilities permit.",
                )
            )

        tasks.append(
            ChecklistItem(
                task_id="task_prep_06_water_stations",
                title="Plan Water Refill Stations to Eliminate Plastic Bottles",
                description="Arrange 2-3 water dispensers or carboys near session halls. Request attendees bring refillable bottles.",
                phase=ChecklistPhase.BEFORE_EVENT,
                category=ChecklistCategory.WASTE_MANAGEMENT,
                deadline_relative="T-7 days",
                suggested_deadline_date=(event_date - timedelta(days=7)).isoformat(),
                is_sustainability_action=True,
                is_suggestion=True,
            )
        )

        tasks.append(
            ChecklistItem(
                task_id="task_prep_07_comms",
                title="Send Digital Attendee Reminder with Green Guidelines",
                description="Email participants with agenda, venue location map, public transit options, and zero-waste guidelines.",
                phase=ChecklistPhase.BEFORE_EVENT,
                category=ChecklistCategory.COMMUNICATIONS,
                deadline_relative="T-3 days",
                suggested_deadline_date=(event_date - timedelta(days=3)).isoformat(),
                is_sustainability_action=True,
                is_suggestion=True,
            )
        )

        tasks.append(
            ChecklistItem(
                task_id="task_prep_08_bins",
                title="Stage Segregated Waste Bins & Clear Visual Signage",
                description="Acquire paired color-coded bins (Food Waste, Dry Recyclables, General Waste) with visual icon signs.",
                phase=ChecklistPhase.BEFORE_EVENT,
                category=ChecklistCategory.WASTE_MANAGEMENT,
                deadline_relative="T-3 days",
                suggested_deadline_date=(event_date - timedelta(days=3)).isoformat(),
                is_sustainability_action=True,
                is_suggestion=True,
            )
        )

        tasks.append(
            ChecklistItem(
                task_id="task_prep_09_safety",
                title="Verify First Aid Kit & Emergency Contacts",
                description="Ensure first aid kit is stocked and campus health center/security contact numbers are printed.",
                phase=ChecklistPhase.BEFORE_EVENT,
                category=ChecklistCategory.SAFETY,
                deadline_relative="T-1 day",
                suggested_deadline_date=(event_date - timedelta(days=1)).isoformat(),
                is_sustainability_action=False,
                is_suggestion=True,
            )
        )

        # -------------------------------------------------------------
        # Phase 2: EVENT_DAY_MORNING (Day of Event, Pre-event)
        # -------------------------------------------------------------
        tasks.append(
            ChecklistItem(
                task_id="task_morning_01_unlock",
                title="Venue Access & Physical Hall Walkthrough",
                description="Arrive 90-120 minutes before start time. Unlock doors, inspect seating cleanliness, and turn on lights/fans/AC.",
                phase=ChecklistPhase.EVENT_DAY_MORNING,
                category=ChecklistCategory.LOGISTICS,
                deadline_relative="Morning of event (2 hours before start)",
                suggested_deadline_date=event_date.isoformat(),
                is_sustainability_action=False,
                is_suggestion=True,
            )
        )

        tasks.append(
            ChecklistItem(
                task_id="task_morning_02_av_test",
                title="Comprehensive AV & Microphone Soundcheck",
                description="Test main podium mic, roving handheld mics, slide presentation laptop, and sound amplification.",
                phase=ChecklistPhase.EVENT_DAY_MORNING,
                category=ChecklistCategory.AV_EQUIPMENT,
                deadline_relative="Morning of event (90 mins before start)",
                suggested_deadline_date=event_date.isoformat(),
                is_sustainability_action=False,
                is_suggestion=True,
            )
        )

        tasks.append(
            ChecklistItem(
                task_id="task_morning_03_refill_setup",
                title="Verify Water Dispensers & Place Waste Bins at Key Points",
                description="Ensure water dispensers are filled with clean drinking water and waste bins are positioned near dining/entry areas.",
                phase=ChecklistPhase.EVENT_DAY_MORNING,
                category=ChecklistCategory.WASTE_MANAGEMENT,
                deadline_relative="Morning of event (60 mins before start)",
                suggested_deadline_date=event_date.isoformat(),
                is_sustainability_action=True,
                is_suggestion=True,
            )
        )

        tasks.append(
            ChecklistItem(
                task_id="task_morning_04_registration",
                title="Staff the Registration Desk & Digital QR Sign-in",
                description="Deploy volunteers with attendee rosters, name tags, and QR code posters for digital check-in.",
                phase=ChecklistPhase.EVENT_DAY_MORNING,
                category=ChecklistCategory.LOGISTICS,
                deadline_relative="Morning of event (45 mins before start)",
                suggested_deadline_date=event_date.isoformat(),
                is_sustainability_action=False,
                is_suggestion=True,
            )
        )

        if meals:
            tasks.append(
                ChecklistItem(
                    task_id="task_morning_05_caterer_arrival",
                    title="Catering Delivery Check & Dining Area Staging",
                    description="Verify delivery of food supplies, check temperature, and stage reusable plates and utensils.",
                    phase=ChecklistPhase.EVENT_DAY_MORNING,
                    category=ChecklistCategory.CATERING,
                    deadline_relative="Morning of event (30 mins before start)",
                    suggested_deadline_date=event_date.isoformat(),
                    is_sustainability_action=False,
                    is_suggestion=True,
                )
            )

        # -------------------------------------------------------------
        # Phase 3: DURING_EVENT (Active Program)
        # -------------------------------------------------------------
        tasks.append(
            ChecklistItem(
                task_id="task_during_01_timekeeping",
                title="Session Timekeeping & Schedule Adherence",
                description="Signal remaining time to speakers (5-min / 1-min warnings) to maintain planned timetable slots.",
                phase=ChecklistPhase.DURING_EVENT,
                category=ChecklistCategory.LOGISTICS,
                deadline_relative="During event sessions",
                suggested_deadline_date=event_date.isoformat(),
                is_sustainability_action=False,
                is_suggestion=True,
            )
        )

        if meals:
            tasks.append(
                ChecklistItem(
                    task_id="task_during_02_meal_service",
                    title="Monitor Meal Service & Portion Serving",
                    description="Ensure orderly buffet lines, supervise portion consistency, and prevent food runout.",
                    phase=ChecklistPhase.DURING_EVENT,
                    category=ChecklistCategory.CATERING,
                    deadline_relative="During meal periods",
                    suggested_deadline_date=event_date.isoformat(),
                    is_sustainability_action=False,
                    is_suggestion=True,
                )
            )

            tasks.append(
                ChecklistItem(
                    task_id="task_during_03_plate_collection",
                    title="Supervise Reusable Plate Collection & Waste Sorting",
                    description="Station 1-2 volunteers near drop-off tables to guide attendees in clearing plates and sorting food scraps.",
                    phase=ChecklistPhase.DURING_EVENT,
                    category=ChecklistCategory.WASTE_MANAGEMENT,
                    deadline_relative="During & immediately after meal service",
                    suggested_deadline_date=event_date.isoformat(),
                    is_sustainability_action=True,
                    is_suggestion=True,
                )
            )

        # -------------------------------------------------------------
        # Phase 4: AFTER_EVENT (Teardown & Follow-up)
        # -------------------------------------------------------------
        if meals:
            tasks.append(
                ChecklistItem(
                    task_id="task_post_01_food_rescue",
                    title="Coordinate Surplus Food Packaging & Redistribution",
                    description="Pack wholesome uneaten meals in clean containers for campus staff or local community distribution.",
                    phase=ChecklistPhase.AFTER_EVENT,
                    category=ChecklistCategory.CATERING,
                    deadline_relative="Immediately post-event (within 1 hour)",
                    suggested_deadline_date=event_date.isoformat(),
                    is_sustainability_action=True,
                    is_suggestion=True,
                    notes="Ensure prompt refrigeration or immediate consumption within safe food handling limits.",
                )
            )

            tasks.append(
                ChecklistItem(
                    task_id="task_post_02_reusables_inventory",
                    title="Tableware Count & Wash Verification",
                    description="Count all returned reusable plates, glasses, and cutlery against check-out records before vendor return.",
                    phase=ChecklistPhase.AFTER_EVENT,
                    category=ChecklistCategory.WASTE_MANAGEMENT,
                    deadline_relative="Immediately post-event (within 2 hours)",
                    suggested_deadline_date=event_date.isoformat(),
                    is_sustainability_action=True,
                    is_suggestion=True,
                )
            )

        tasks.append(
            ChecklistItem(
                task_id="task_post_03_av_pack",
                title="Pack AV Hardware & Venue Clearing",
                description="Unplug all electronics, coil cables neatly, collect extension boards, and store rented equipment.",
                phase=ChecklistPhase.AFTER_EVENT,
                category=ChecklistCategory.AV_EQUIPMENT,
                deadline_relative="Immediately post-event (within 2 hours)",
                suggested_deadline_date=event_date.isoformat(),
                is_sustainability_action=False,
                is_suggestion=True,
            )
        )

        tasks.append(
            ChecklistItem(
                task_id="task_post_04_handover",
                title="Final Venue Cleanliness Inspection & Handover",
                description="Conduct joint walk-through with venue caretaker to verify room is clean, undamaged, and locked.",
                phase=ChecklistPhase.AFTER_EVENT,
                category=ChecklistCategory.LOGISTICS,
                deadline_relative="Immediately post-event (within 3 hours)",
                suggested_deadline_date=event_date.isoformat(),
                is_sustainability_action=False,
                is_suggestion=True,
            )
        )

        tasks.append(
            ChecklistItem(
                task_id="task_post_05_thank_you",
                title="Send Thank-You Notes with Sustainability Highlights",
                description="Email attendees, keynote speakers, and volunteers thanking them and sharing event green accomplishments.",
                phase=ChecklistPhase.AFTER_EVENT,
                category=ChecklistCategory.COMMUNICATIONS,
                deadline_relative="Post-event within 48 hours",
                suggested_deadline_date=(event_date + timedelta(days=2)).isoformat(),
                is_sustainability_action=True,
                is_suggestion=True,
            )
        )

        return tasks


checklist_generator = ChecklistGenerator()
