"""
Waste management module exports.
Provides WasteCalculator, WasteRulesEngine, WastePlanningService, and domain schemas.
"""

from backend.app.planning.modules.waste.calculator import (
    WasteCalculator,
    waste_calculator,
)
from backend.app.planning.modules.waste.rules import (
    WasteRulesEngine,
    waste_rules_engine,
)
from backend.app.planning.modules.waste.schemas import (
    CalculationBasis,
    PackagingItemType,
    PlasticItemType,
    OtherWasteCategory,
    WasteCalculationStatus,
    WasteSourceType,
    FoodWasteInput,
    PackagingItemInput,
    PlasticItemInput,
    OtherWasteItemInput,
    WastePlanRequest,
    FoodWasteResult,
    PackagingItemResult,
    PackagingWasteSummary,
    PlasticItemResult,
    PlasticWasteSummary,
    OtherWasteItemResult,
    OtherWasteSummary,
    WasteRecommendation,
    WastePlanResponse,
)
from backend.app.planning.modules.waste.waste_planning_service import (
    WastePlanningService,
    waste_planning_service,
)

__all__ = [
    "WasteCalculator",
    "waste_calculator",
    "WasteRulesEngine",
    "waste_rules_engine",
    "WastePlanningService",
    "waste_planning_service",
    "CalculationBasis",
    "PackagingItemType",
    "PlasticItemType",
    "OtherWasteCategory",
    "WasteCalculationStatus",
    "WasteSourceType",
    "FoodWasteInput",
    "PackagingItemInput",
    "PlasticItemInput",
    "OtherWasteItemInput",
    "WastePlanRequest",
    "FoodWasteResult",
    "PackagingItemResult",
    "PackagingWasteSummary",
    "PlasticItemResult",
    "PlasticWasteSummary",
    "OtherWasteItemResult",
    "OtherWasteSummary",
    "WasteRecommendation",
    "WastePlanResponse",
]
