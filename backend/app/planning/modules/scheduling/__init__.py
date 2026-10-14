"""
Scheduling Module for Sustainable Event Planning.
Provides deterministic timetable generation, configurable event templates,
phased execution checklist generation, and complete event plan consolidation.
"""

from backend.app.planning.modules.scheduling.schemas import (
    ActivityType,
    AssumptionsAndConfirmations,
    BudgetSummary,
    ChecklistCategory,
    ChecklistItem,
    ChecklistPhase,
    CompletePlanRequest,
    CompletePlanResponse,
    DaySchedule,
    EventOverview,
    FoodResourceManifest,
    PlasticResourceManifest,
    ResourceItem,
    ResourceManifest,
    ScheduleConflict,
    ScheduleRequest,
    ScheduleResult,
    SustainabilityActionItem,
    TablewareResourceManifest,
    TimetableSlot,
)
from backend.app.planning.modules.scheduling.template_registry import (
    EVENT_TEMPLATES,
    MEAL_DEFAULTS,
    EventTemplate,
    TemplateActivity,
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

__all__ = [
    "ActivityType",
    "AssumptionsAndConfirmations",
    "BudgetSummary",
    "ChecklistCategory",
    "ChecklistItem",
    "ChecklistPhase",
    "CompletePlanRequest",
    "CompletePlanResponse",
    "DaySchedule",
    "EventOverview",
    "FoodResourceManifest",
    "PlasticResourceManifest",
    "ResourceItem",
    "ResourceManifest",
    "ScheduleConflict",
    "ScheduleRequest",
    "ScheduleResult",
    "SustainabilityActionItem",
    "TablewareResourceManifest",
    "TimetableSlot",
    "EVENT_TEMPLATES",
    "MEAL_DEFAULTS",
    "EventTemplate",
    "TemplateActivity",
    "get_template_for_event_type",
    "SchedulingEngine",
    "scheduling_engine",
    "ChecklistGenerator",
    "checklist_generator",
]
