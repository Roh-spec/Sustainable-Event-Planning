from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.assumption import ResolvedAssumption


class MealType(str, Enum):
    """Supported types of meals/refreshments for events."""
    BREAKFAST = "BREAKFAST"
    LUNCH = "LUNCH"
    DINNER = "DINNER"
    SNACKS = "SNACKS"
    HIGH_TEA = "HIGH_TEA"
    REFRESHMENTS = "REFRESHMENTS"


class DietaryPreference(str, Enum):
    """Dietary regime options."""
    VEGETARIAN = "VEGETARIAN"
    NON_VEGETARIAN = "NON_VEGETARIAN"
    MIXED = "MIXED"


class FoodPricingUnit(str, Enum):
    """Pricing units for food cost estimation."""
    PER_PERSON = "PER_PERSON"
    PER_SERVING = "PER_SERVING"
    TOTAL = "TOTAL"


class CalculationStatus(str, Enum):
    """Overall calculation state."""
    COMPLETE = "COMPLETE"
    PARTIAL = "PARTIAL"
    BLOCKED = "BLOCKED"


class WasteEstimationStatus(str, Enum):
    """Waste calculation precision level."""
    COMPLETE = "COMPLETE"            # Both servings and kg calculated
    SERVINGS_ONLY = "SERVINGS_ONLY"  # Servings calculated, weight assumption missing
    UNAVAILABLE = "UNAVAILABLE"      # Waste calculation blocked


class ConstraintEvaluationStatus(str, Enum):
    """Evaluation state of an institutional or organizer constraint."""
    SATISFIED = "SATISFIED"
    VIOLATED = "VIOLATED"
    WARNING = "WARNING"
    NOT_APPLICABLE = "NOT_APPLICABLE"


# -------------------------------------------------------------------------
# Request / Input Models
# -------------------------------------------------------------------------

class MealInput(BaseModel):
    """Input specification for an individual meal course."""
    meal_type: MealType = Field(..., description="Type of meal (e.g. LUNCH, SNACKS)")
    name: Optional[str] = Field(default=None, description="Custom label (e.g. Day 1 Welcome Lunch)")
    day: int = Field(default=1, gt=0, description="Day of the event (1-indexed)")
    dietary_preference: Optional[DietaryPreference] = Field(
        default=None,
        description="Meal-specific dietary preference; falls back to default if omitted",
    )
    attendee_count: Optional[int] = Field(
        default=None,
        gt=0,
        description="Target attendee count if different from overall event attendance",
    )
    user_participation_rate: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=1,
        description="Explicit participation rate (0.0 to 1.0) overriding assumptions",
    )
    user_servings: Optional[int] = Field(
        default=None,
        ge=0,
        description="Explicit servings count overriding calculations",
    )
    user_unit_cost: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Explicit unit cost for this specific meal",
    )
    user_total_cost: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Explicit total cost for this specific meal",
    )


class FoodPlanRequest(BaseModel):
    """Food planning request payload."""
    event_id: int = Field(..., description="Existing Event ID to plan food for")
    meals: List[MealInput] = Field(default_factory=list, description="List of meals to plan")
    default_dietary_preference: DietaryPreference = Field(
        default=DietaryPreference.MIXED,
        description="Default dietary preference if not specified per meal",
    )
    food_budget: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Food-specific budget limit; defaults to Event budget if omitted",
    )
    known_total_cost: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Known overall food cost (Approach A: User-provided total)",
    )
    known_unit_cost: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Known unit cost (Approach B: User-provided unit cost)",
    )
    cost_pricing_unit: Optional[FoodPricingUnit] = Field(
        default=None,
        description="Unit for known_unit_cost (PER_PERSON, PER_SERVING, or TOTAL)",
    )
    vegetarian_ratio: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=1,
        description="Vegetarian portion ratio for MIXED preference (e.g. 0.70 = 70% veg)",
    )


# -------------------------------------------------------------------------
# Output / Result Models
# -------------------------------------------------------------------------

class MealPlanResult(BaseModel):
    """Calculated planning details for a single meal course."""
    meal_type: MealType
    name: str
    day: int
    dietary_preference: DietaryPreference
    attendee_count: int
    participation_rate_used: Optional[Decimal] = None
    participation_source: str
    estimated_servings: Optional[int] = None
    veg_servings: Optional[int] = None
    non_veg_servings: Optional[int] = None
    unit_cost: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    cost_source: str
    waste_servings: Optional[Decimal] = None
    waste_kg: Optional[Decimal] = None


class FoodCostSummary(BaseModel):
    """Consolidated financial summary for food planning."""
    estimated_total_cost: Optional[Decimal] = None
    cost_status: str  # ESTIMATED, USER_PROVIDED, UNAVAILABLE
    pricing_approach: str  # USER_PROVIDED_TOTAL, USER_PROVIDED_UNIT, ASSUMPTION_BASED, UNAVAILABLE
    cost_per_attendee: Optional[Decimal] = None
    breakdown_by_meal: Dict[str, Optional[Decimal]] = Field(default_factory=dict)
    food_budget: Optional[Decimal] = None
    remaining_budget: Optional[Decimal] = None
    is_over_budget: Optional[bool] = None
    variance_amount: Optional[Decimal] = None


class FoodWasteSummary(BaseModel):
    """Consolidated food waste estimation."""
    waste_status: WasteEstimationStatus
    estimated_waste_servings: Optional[Decimal] = None
    estimated_waste_kg: Optional[Decimal] = None
    waste_percentage_used: Optional[Decimal] = None
    serving_weight_kg_used: Optional[Decimal] = None
    waste_percentage_source: Optional[str] = None
    serving_weight_source: Optional[str] = None


class FoodConstraintEvaluation(BaseModel):
    """Evaluation result for an institutional or organizer rule."""
    constraint_id: Optional[int] = None
    category: str
    constraint_type: str
    description: str
    status: ConstraintEvaluationStatus
    message: str


class FoodRecommendation(BaseModel):
    """Actionable, explainable eco and cost recommendation."""
    code: str
    title: str
    description: str
    reason: str
    impact: str


class FoodPlanResponse(BaseModel):
    """Standardized output model for Food Planning Module."""
    event_id: int
    event_name: str
    event_type: str
    expected_attendees: int
    status: CalculationStatus
    meal_plans: List[MealPlanResult]
    total_estimated_servings: Optional[int] = None
    total_veg_servings: Optional[int] = None
    total_non_veg_servings: Optional[int] = None
    cost_summary: FoodCostSummary
    waste_summary: FoodWasteSummary
    constraints_evaluation: List[FoodConstraintEvaluation]
    recommendations: List[FoodRecommendation]
    assumptions_used: List[ResolvedAssumption]
    missing_assumptions: List[str]
    warnings: List[str]

    model_config = ConfigDict(from_attributes=True)
