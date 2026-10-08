"""
Pydantic schemas and domain models for the Waste Planning Module.
Covers Food Waste, Packaging Waste, Plastic Waste, and Other Waste.
Paper Waste is explicitly WAITLISTED and not implemented.
"""

from decimal import Decimal
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.app.planning.modules.food.schemas import FoodPlanRequest
from backend.app.schemas.assumption import ResolvedAssumption


class CalculationBasis(str, Enum):
    """Supported basis for waste quantity estimation."""
    PER_PERSON = "PER_PERSON"
    PER_MEAL = "PER_MEAL"
    PER_EVENT = "PER_EVENT"
    CUSTOM = "CUSTOM"


class PackagingItemType(str, Enum):
    """Component-based packaging items."""
    PLATE = "PLATE"
    CUP = "CUP"
    SPOON = "SPOON"
    FORK = "FORK"
    GLASS = "GLASS"
    OTHER = "OTHER"


class PlasticItemType(str, Enum):
    """Identifiable plastic items."""
    WATER_BOTTLE = "WATER_BOTTLE"
    PLASTIC_BAG = "PLASTIC_BAG"
    WRAPPER = "WRAPPER"
    PLASTIC_CUP = "PLASTIC_CUP"
    OTHER = "OTHER"


class OtherWasteCategory(str, Enum):
    """Predefined categories for other/miscellaneous waste streams."""
    DECORATIONS = "DECORATIONS"
    BROKEN_ITEMS = "BROKEN_ITEMS"
    MIXED_WASTE = "MIXED_WASTE"
    FOOD_CONTAINERS = "FOOD_CONTAINERS"
    OTHER = "OTHER"
    CUSTOM = "CUSTOM"


class WasteCalculationStatus(str, Enum):
    """Calculation precision state."""
    COMPLETE = "COMPLETE"
    PARTIAL = "PARTIAL"
    BLOCKED = "BLOCKED"


class WasteSourceType(str, Enum):
    """Data provenance for estimated quantities."""
    USER_PROVIDED = "USER_PROVIDED"
    ESTIMATED = "ESTIMATED"
    REFERENCE = "REFERENCE"
    ACTUAL = "ACTUAL"
    ML_PREDICTED = "ML_PREDICTED"


# -------------------------------------------------------------------------
# Request / Input Models
# -------------------------------------------------------------------------

class FoodWasteInput(BaseModel):
    """Input for food waste integration and optional user override."""
    food_plan_request: Optional[FoodPlanRequest] = Field(
        default=None,
        description="Optional full FoodPlanRequest to compute food waste directly via the Food Module.",
    )
    estimated_food_waste_servings: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Precomputed food waste estimate in servings from earlier Food Module calculation.",
    )
    estimated_food_waste_kg: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Precomputed food waste in kg from Food Module.",
    )
    user_override_servings: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Organizer override for food waste quantity in servings (does not delete original estimate).",
    )


class PackagingItemInput(BaseModel):
    """Organizer-selected packaging item input."""
    item_type: PackagingItemType = Field(..., description="Type of packaging component (e.g. PLATE, CUP)")
    custom_name: Optional[str] = Field(default=None, description="Custom label for OTHER packaging items")
    calculation_basis: CalculationBasis = Field(
        default=CalculationBasis.PER_PERSON,
        description="Calculation basis (PER_PERSON, PER_MEAL, PER_EVENT, CUSTOM)",
    )
    units_per_basis: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="User-specified items per basis. Falls back to Assumption Engine if omitted.",
    )
    meals_count: Optional[int] = Field(
        default=None,
        ge=1,
        description="Number of meals if calculation_basis is PER_MEAL.",
    )
    user_total_quantity: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Explicit total item count (required if calculation_basis is CUSTOM).",
    )
    user_reusable_quantity: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Explicit count of reusable items.",
    )
    user_single_use_quantity: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Explicit count of single-use items.",
    )

    @model_validator(mode="after")
    def validate_quantities(self) -> "PackagingItemInput":
        if self.user_reusable_quantity is not None and self.user_single_use_quantity is not None and self.user_total_quantity is not None:
            if self.user_reusable_quantity + self.user_single_use_quantity > self.user_total_quantity:
                raise ValueError("Sum of reusable and single-use quantities cannot exceed total quantity.")
        return self


class PlasticItemInput(BaseModel):
    """Organizer-selected plastic item input."""
    item_type: PlasticItemType = Field(..., description="Type of plastic item (e.g. WATER_BOTTLE, PLASTIC_BAG)")
    custom_name: Optional[str] = Field(default=None, description="Custom label for OTHER plastic items")
    calculation_basis: CalculationBasis = Field(
        default=CalculationBasis.PER_PERSON,
        description="Calculation basis (PER_PERSON, PER_MEAL, PER_EVENT, CUSTOM)",
    )
    units_per_basis: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="User-specified items per basis. Falls back to Assumption Engine if omitted.",
    )
    meals_count: Optional[int] = Field(
        default=None,
        ge=1,
        description="Number of meals if calculation_basis is PER_MEAL.",
    )
    user_override_quantity: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Explicit planning quantity override (preserves estimated quantity).",
    )
    participation_rate: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=1,
        description="Fraction of attendees who use this item (e.g. 0.60 for 60% participation override).",
    )


class OtherWasteItemInput(BaseModel):
    """Input for other or custom waste items."""
    name: str = Field(..., min_length=1, description="Item or category name")
    category: OtherWasteCategory = Field(default=OtherWasteCategory.OTHER, description="Predefined waste category")
    calculation_basis: CalculationBasis = Field(
        default=CalculationBasis.CUSTOM,
        description="Calculation basis (CUSTOM, PER_PERSON, PER_EVENT)",
    )
    quantity: Optional[Decimal] = Field(default=None, ge=0, description="Quantity for CUSTOM basis or explicit count")
    unit: str = Field(default="items", min_length=1, description="Unit of measurement (items, kg, bags, etc.)")
    units_per_basis: Optional[Decimal] = Field(default=None, ge=0, description="Rate if PER_PERSON or PER_EVENT")


class WastePlanRequest(BaseModel):
    """Waste planning request payload."""
    event_id: int = Field(..., description="Existing Event ID")
    attendee_count: Optional[int] = Field(
        default=None,
        gt=0,
        description="Attendee count override if distinct from Event.expected_attendees",
    )
    meals_count: Optional[int] = Field(
        default=None,
        gt=0,
        description="Default number of meals for PER_MEAL calculations",
    )
    food_waste: Optional[FoodWasteInput] = Field(
        default=None,
        description="Food waste estimates or Food Module integration input",
    )
    packaging_items: List[PackagingItemInput] = Field(
        default_factory=list,
        description="List of packaging items selected by the organizer",
    )
    plastic_items: List[PlasticItemInput] = Field(
        default_factory=list,
        description="List of plastic items selected by the organizer",
    )
    other_waste_items: List[OtherWasteItemInput] = Field(
        default_factory=list,
        description="List of other / miscellaneous waste items",
    )


# -------------------------------------------------------------------------
# Output / Result Models
# -------------------------------------------------------------------------

class FoodWasteResult(BaseModel):
    """Consumed and planning food waste figures."""
    estimated_servings: Optional[Decimal] = None
    estimated_kg: Optional[Decimal] = None
    user_override_servings: Optional[Decimal] = None
    planning_servings: Optional[Decimal] = None
    planning_source: Optional[WasteSourceType] = Field(
        default=None,
        description="Data provenance for food waste planning quantity",
    )
    explanation: str


class PackagingItemResult(BaseModel):
    """Estimated quantities for a packaging item."""
    item_name: str
    item_type: PackagingItemType
    calculation_basis: CalculationBasis
    total_quantity: Optional[Decimal] = None
    reusable_quantity: Optional[Decimal] = None
    single_use_quantity: Optional[Decimal] = None
    is_split_resolved: bool = True
    source_type: Optional[WasteSourceType] = Field(
        default=None,
        description="Data provenance for packaging quantity",
    )
    explanation: str


class PackagingWasteSummary(BaseModel):
    """Consolidated packaging waste summary."""
    total_items: Optional[Decimal] = None
    total_reusable_items: Optional[Decimal] = None
    total_single_use_items: Optional[Decimal] = None
    reusable_percentage: Optional[Decimal] = None
    items: List[PackagingItemResult] = Field(default_factory=list)


class PlasticItemResult(BaseModel):
    """Estimated quantities for a plastic item."""
    item_name: str
    item_type: PlasticItemType
    calculation_basis: CalculationBasis
    estimated_quantity: Optional[Decimal] = None
    user_override_quantity: Optional[Decimal] = None
    planning_quantity: Optional[Decimal] = None
    source_type: Optional[WasteSourceType] = Field(
        default=None,
        description="Data provenance for plastic quantity",
    )
    explanation: str


class PlasticWasteSummary(BaseModel):
    """Consolidated plastic waste summary."""
    total_planning_items: Optional[Decimal] = None
    items: List[PlasticItemResult] = Field(default_factory=list)


class OtherWasteItemResult(BaseModel):
    """Quantities for an other/miscellaneous waste item."""
    name: str
    category: OtherWasteCategory
    calculation_basis: CalculationBasis
    quantity: Optional[Decimal] = None
    unit: str = "items"
    source_type: Optional[WasteSourceType] = Field(
        default=None,
        description="Data provenance for other waste quantity",
    )
    explanation: str


class OtherWasteSummary(BaseModel):
    """Consolidated other waste summary."""
    total_items: Optional[Decimal] = None
    items: List[OtherWasteItemResult] = Field(default_factory=list)


class WasteRecommendation(BaseModel):
    """Actionable, explainable waste reduction recommendation."""
    code: str
    title: str
    description: str
    reason: str
    impact: str


class WastePlanResponse(BaseModel):
    """Standardized output model for Waste Planning Module."""
    event_id: int
    event_name: str
    event_type: str
    expected_attendees: int
    status: WasteCalculationStatus
    food_waste: Optional[FoodWasteResult] = None
    packaging_waste: PackagingWasteSummary
    plastic_waste: PlasticWasteSummary
    other_waste: OtherWasteSummary
    recommendations: List[WasteRecommendation] = Field(default_factory=list)
    assumptions_used: List[ResolvedAssumption] = Field(default_factory=list)
    missing_assumptions: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
