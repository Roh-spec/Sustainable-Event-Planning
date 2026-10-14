"""
Domain schemas for the Scheduling and Complete Event Planning Engine.
Defines requests, timetable slots, daily schedules, conflicts, checklist items,
resource manifests, budget summaries, and full complete-plan payloads.
"""

from datetime import date, time
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.app.schemas.event import EventType
from backend.app.schemas.assumption import ResolvedAssumption
from backend.app.planning.modules.food.schemas import MealType
from backend.app.planning.orchestrator.schemas import PlanAlternative, PlanningModuleContext


class ActivityType(str, Enum):
    """Categorization of event schedule activities."""
    SETUP = "SETUP"
    REGISTRATION = "REGISTRATION"
    OPENING = "OPENING"
    KEYNOTE = "KEYNOTE"
    SESSION = "SESSION"
    WORKSHOP = "WORKSHOP"
    COMPETITION = "COMPETITION"
    ACTIVITY = "ACTIVITY"
    MEAL = "MEAL"
    BREAK = "BREAK"
    NETWORKING = "NETWORKING"
    AWARDS = "AWARDS"
    CLOSING = "CLOSING"
    CLEANUP = "CLEANUP"
    TEARDOWN = "TEARDOWN"
    OTHER = "OTHER"


class ChecklistPhase(str, Enum):
    """Execution timeline phases for event preparation and delivery."""
    BEFORE_EVENT = "BEFORE_EVENT"
    EVENT_DAY_MORNING = "EVENT_DAY_MORNING"
    DURING_EVENT = "DURING_EVENT"
    AFTER_EVENT = "AFTER_EVENT"


class ChecklistCategory(str, Enum):
    """Operational functional areas for event checklist tasks."""
    LOGISTICS = "LOGISTICS"
    CATERING = "CATERING"
    WASTE_MANAGEMENT = "WASTE_MANAGEMENT"
    AV_EQUIPMENT = "AV_EQUIPMENT"
    COMMUNICATIONS = "COMMUNICATIONS"
    SAFETY = "SAFETY"


class ScheduleRequest(BaseModel):
    """
    Input payload for generating an event timetable and schedule.
    Rejects invalid windows where end_time is not after start_time.
    """
    event_type: EventType = Field(..., description="Supported event type")
    expected_attendees: int = Field(..., gt=0, description="Expected attendee count (must be > 0)")
    event_date: date = Field(..., description="Start date of the event (YYYY-MM-DD)")
    start_time: time = Field(..., description="Daily start time (HH:MM)")
    end_time: time = Field(..., description="Daily end time (HH:MM)")
    duration_days: int = Field(default=1, gt=0, le=14, description="Event duration in days (1-14)")
    selected_meal_types: List[MealType] = Field(
        default_factory=list,
        description="Explicit list of meals selected by the organizer",
    )
    include_setup_cleanup: bool = Field(
        default=True,
        description="Whether to include setup and cleanup periods within the window",
    )
    event_name: Optional[str] = Field(default=None, max_length=255, description="Optional event title")

    @model_validator(mode="after")
    def validate_time_window(self) -> "ScheduleRequest":
        if self.end_time <= self.start_time:
            start_str = self.start_time.strftime("%H:%M")
            end_str = self.end_time.strftime("%H:%M")
            raise ValueError(
                f"Event end time ({end_str}) must be strictly after start time ({start_str}). "
                "Negative or zero-duration event windows are invalid."
            )
        return self

    model_config = ConfigDict(from_attributes=True)


class TimetableSlot(BaseModel):
    """
    Individual activity slot in an event timetable.
    Chronological and non-overlapping.
    """
    slot_id: str = Field(..., description="Unique deterministic identifier for the slot")
    day: int = Field(default=1, gt=0, description="Event day number (1-indexed)")
    start_time: str = Field(..., description="Slot start time (HH:MM)")
    end_time: str = Field(..., description="Slot end time (HH:MM)")
    duration_minutes: int = Field(..., gt=0, description="Duration in minutes")
    title: str = Field(..., description="Human-readable activity title")
    activity_type: ActivityType = Field(..., description="Classification of the activity")
    description: Optional[str] = Field(default=None, description="Operational notes or activity summary")
    is_meal: bool = Field(default=False, description="Whether this slot represents a meal or refreshment")
    meal_type: Optional[MealType] = Field(default=None, description="Specific meal type if is_meal is True")
    is_sustainability_action: bool = Field(
        default=False,
        description="Whether this slot involves a sustainability action (e.g. waste sorting, green briefing)",
    )
    is_suggestion: bool = Field(default=True, description="Identifies this activity as an unverified suggestion")

    model_config = ConfigDict(from_attributes=True)


class DaySchedule(BaseModel):
    """Daily schedule containing a sequence of chronological timetable slots."""
    day_number: int = Field(..., gt=0, description="Day number (1-indexed)")
    date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    start_time: str = Field(..., description="Day operational start time (HH:MM)")
    end_time: str = Field(..., description="Day operational end time (HH:MM)")
    total_duration_minutes: int = Field(..., gt=0, description="Total window span in minutes")
    slots: List[TimetableSlot] = Field(default_factory=list, description="Chronological, non-overlapping slots")

    model_config = ConfigDict(from_attributes=True)


class ScheduleConflict(BaseModel):
    """Details of any timing or fit constraint that could not be fully satisfied."""
    conflict_type: str = Field(..., description="Category code (e.g. WINDOW_TOO_SHORT, MEAL_OUTSIDE_WINDOW)")
    description: str = Field(..., description="Human-readable plain-language explanation of the conflict")
    affected_activities: List[str] = Field(default_factory=list, description="Names of affected activities")
    severity: str = Field(default="WARNING", description="Severity level: WARNING or ERROR")

    model_config = ConfigDict(from_attributes=True)


class ChecklistItem(BaseModel):
    """
    Structured actionable task for the event organizer.
    Includes suggested phase, relative deadline, and sustainability labels.
    """
    task_id: str = Field(..., description="Deterministic unique task ID")
    title: str = Field(..., description="Task title")
    description: Optional[str] = Field(default=None, description="Detailed guidance or instructions")
    phase: ChecklistPhase = Field(..., description="Chronological project phase")
    category: ChecklistCategory = Field(..., description="Operational domain category")
    deadline_relative: str = Field(..., description="Human-readable relative deadline (e.g. T-14 days)")
    suggested_deadline_date: Optional[str] = Field(default=None, description="Calculated target date (YYYY-MM-DD)")
    is_sustainability_action: bool = Field(
        default=False,
        description="Whether this task is a specific environmental/sustainable practice",
    )
    is_suggestion: bool = Field(
        default=True,
        description="Explicitly indicates this task is an unverified planning suggestion",
    )
    notes: Optional[str] = Field(default=None, description="Additional context or reminders")

    model_config = ConfigDict(from_attributes=True)


class ScheduleResult(BaseModel):
    """
    Overall output of the Scheduling Engine.
    Contains daily schedules, flattened slots, conflicts, warnings, and assumptions.
    """
    event_type: EventType
    event_date: str
    start_time: str
    end_time: str
    duration_days: int
    daily_schedules: List[DaySchedule] = Field(default_factory=list)
    all_slots: List[TimetableSlot] = Field(default_factory=list)
    conflicts: List[ScheduleConflict] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------------------
# Complete Event Plan Schemas (Phase 2)
# -------------------------------------------------------------------------

class ResourceItem(BaseModel):
    """Suggested equipment or facility station."""
    name: str = Field(..., description="Resource name")
    suggested_quantity: str = Field(..., description="Quantity with units (e.g. '2 stations', '4 pairs')")
    category: str = Field(..., description="Resource domain: WASTE_MANAGEMENT, AV_EQUIPMENT, LOGISTICS")
    notes: Optional[str] = Field(default=None, description="Guidance or venue check reminder")
    is_suggestion: bool = Field(default=True, description="Identifies resource as a suggestion")

    model_config = ConfigDict(from_attributes=True)


class FoodResourceManifest(BaseModel):
    """Consolidated food quantities derived from Food Planning Module."""
    estimated_servings: Optional[int] = Field(default=None, description="Calculated total meal portions")
    veg_servings: Optional[int] = Field(default=None, description="Vegetarian portions")
    non_veg_servings: Optional[int] = Field(default=None, description="Non-vegetarian portions")
    estimated_food_waste_kg: Optional[Decimal] = Field(default=None, description="Estimated unconsumed food in kg")
    description: Optional[str] = Field(default=None, description="Context of the catering estimate")
    provenance: str = Field(default="Calculated from planning assumptions", description="Origin of the data")

    model_config = ConfigDict(from_attributes=True)


class TablewareResourceManifest(BaseModel):
    """Consolidated tableware quantities derived from Waste Planning Module."""
    reusable_items: Optional[Decimal] = Field(default=None, description="Washable plates, cups, and utensils")
    single_use_items: Optional[Decimal] = Field(default=None, description="Disposable packaging items")
    reusable_percentage: Optional[Decimal] = Field(default=None, description="Percentage of serving items that are reusable")
    description: Optional[str] = Field(default=None, description="Context of tableware requirements")
    provenance: str = Field(default="Calculated from planning assumptions", description="Origin of the data")

    model_config = ConfigDict(from_attributes=True)


class PlasticResourceManifest(BaseModel):
    """Identifiable plastic item counts derived from Waste Planning Module."""
    estimated_plastic_items: Optional[Decimal] = Field(default=None, description="Plastic bottles, cups, or bags")
    description: Optional[str] = Field(default=None, description="Context of plastic reduction estimate")
    provenance: str = Field(default="Calculated from planning assumptions", description="Origin of the data")

    model_config = ConfigDict(from_attributes=True)


class ResourceManifest(BaseModel):
    """
    Consolidated bill of operational resources.
    Keeps food, tableware, plastic, and station estimates strictly separate.
    """
    food_and_catering: FoodResourceManifest
    tableware_and_serving: TablewareResourceManifest
    plastic_items: PlasticResourceManifest
    suggested_equipment: List[ResourceItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class BudgetSummary(BaseModel):
    """Financial breakdown and budget feasibility comparison."""
    total_budget: Optional[Decimal] = Field(default=None, description="Organizer's allocated budget ceiling")
    currency: str = Field(default="INR", description="Currency symbol/code")
    estimated_plan_cost: Optional[Decimal] = Field(default=None, description="Total cost calculated for selected plan")
    food_cost: Optional[Decimal] = Field(default=None, description="Subtotal for catering")
    packaging_cost: Optional[Decimal] = Field(default=None, description="Subtotal for tableware and packaging")
    remaining_contingency: Optional[Decimal] = Field(default=None, description="Surplus budget remaining")
    is_budget_feasible: bool = Field(default=True, description="Whether estimated cost fits within allocated budget")
    budget_deficit: Optional[Decimal] = Field(default=None, description="Amount by which cost exceeds budget")
    notes: Optional[str] = Field(default=None, description="Explanatory notes regarding budget evaluation")

    model_config = ConfigDict(from_attributes=True)


class SustainabilityActionItem(BaseModel):
    """Concrete operational action tied to the selected sustainable plan alternative."""
    title: str = Field(..., description="Action title")
    action_type: str = Field(..., description="Classification: FOOD_WASTE_REDUCTION, REUSABLE_PACKAGING, PLASTIC_ELIMINATION")
    description: str = Field(..., description="Operational guidance for realizing the target")
    target_metric: Optional[str] = Field(default=None, description="Associated sustainability metric or target")
    verification_step: str = Field(..., description="How organizers verify this action was completed")

    model_config = ConfigDict(from_attributes=True)


class AssumptionsAndConfirmations(BaseModel):
    """
    Honest disclosure of reference assumptions and items requiring organizer verification.
    """
    planning_assumptions: List[ResolvedAssumption] = Field(
        default_factory=list,
        description="Assumptions used to produce estimates",
    )
    items_requiring_confirmation: List[str] = Field(
        default_factory=list,
        description="Operational dependencies requiring organizer or venue confirmation",
    )

    model_config = ConfigDict(from_attributes=True)


class EventOverview(BaseModel):
    """High-level summary of the planned event and selected configuration."""
    event_id: int
    name: str
    event_type: EventType
    expected_attendees: int
    duration_days: int
    location: Optional[str] = None
    event_date: str
    start_time: str
    end_time: str
    selected_plan_name: Optional[str] = None
    selected_plan_objective: Optional[str] = None
    is_feasible: bool = True

    model_config = ConfigDict(from_attributes=True)


class CompletePlanRequest(BaseModel):
    """
    Request payload for POST /api/v1/planning/complete-plan.
    Accepts event_id, timing window, and selected plan from wizard state.
    """
    event_id: int = Field(..., description="Target Event ID in the database")
    event_date: date = Field(..., description="Calendar date of the event (YYYY-MM-DD)")
    start_time: time = Field(..., description="Daily start time (HH:MM)")
    end_time: time = Field(..., description="Daily end time (HH:MM)")
    duration_days: Optional[int] = Field(
        default=None,
        gt=0,
        le=14,
        description="Event duration override in days; falls back to Event duration if omitted",
    )
    selected_plan: Optional[PlanAlternative] = Field(
        default=None,
        description="Organizer-selected sustainable plan alternative from Step 6",
    )
    selected_meal_types: Optional[List[MealType]] = Field(
        default=None,
        description="Meal courses to place in timetable; falls back to food module context if omitted",
    )
    include_setup_cleanup: bool = Field(
        default=True,
        description="Whether to include setup and cleanup buffers in timetable",
    )
    module_context: Optional[PlanningModuleContext] = Field(
        default=None,
        description="Optional domain module context (Food, Waste)",
    )

    @model_validator(mode="after")
    def validate_time_window(self) -> "CompletePlanRequest":
        if self.end_time <= self.start_time:
            start_str = self.start_time.strftime("%H:%M")
            end_str = self.end_time.strftime("%H:%M")
            raise ValueError(
                f"Event end time ({end_str}) must be strictly after start time ({start_str}). "
                "Negative or zero-duration event windows are invalid."
            )
        return self

    model_config = ConfigDict(from_attributes=True)


class CompletePlanResponse(BaseModel):
    """
    Master response payload for POST /api/v1/planning/complete-plan.
    Consolidates overview, timetable, checklist, resources, budget,
    sustainability actions, and open assumptions.
    """
    event_overview: EventOverview
    daily_timetable: List[DaySchedule] = Field(default_factory=list)
    scheduling_warnings: List[str] = Field(default_factory=list)
    scheduling_conflicts: List[ScheduleConflict] = Field(default_factory=list)
    checklist: List[ChecklistItem] = Field(default_factory=list)
    resource_manifest: ResourceManifest
    budget_summary: BudgetSummary
    sustainability_actions: List[SustainabilityActionItem] = Field(default_factory=list)
    assumptions_and_confirmations: AssumptionsAndConfirmations

    model_config = ConfigDict(from_attributes=True)
