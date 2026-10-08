from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AssumptionSourceType(str, Enum):
    """Provenance origin of an assumption or data parameter."""
    USER_PROVIDED = "USER_PROVIDED"
    REFERENCE = "REFERENCE"
    ASSUMED = "ASSUMED"
    ACTUAL = "ACTUAL"
    ML_PREDICTED = "ML_PREDICTED"


class AssumptionScope(str, Enum):
    """Scope of application for an assumption."""
    GLOBAL = "GLOBAL"
    EVENT = "EVENT"


class AssumptionBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=100, description="Planning domain category (e.g. WATER, FOOD)")
    parameter: str = Field(..., min_length=1, max_length=100, description="Assumption parameter key (e.g. water_per_person_per_day)")
    value: str = Field(..., min_length=1, max_length=100, description="Assumed numeric or categorical value")
    unit: str = Field(..., min_length=1, max_length=50, description="Measurement unit (e.g. litres/person/day)")
    source_type: AssumptionSourceType = Field(
        default=AssumptionSourceType.ASSUMED,
        description="Source provenance of the assumption",
    )
    description: Optional[str] = Field(default=None, description="Explanation or context of the assumption")
    confidence: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=1,
        description="Optional confidence rating between 0.00 and 1.00",
    )
    reference_notes: Optional[str] = Field(default=None, description="External citation or empirical basis")


class AssumptionCreate(AssumptionBase):
    event_id: Optional[int] = Field(default=None, description="Event ID if scoped to a specific event, or null for global")


class AssumptionUpdate(BaseModel):
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    parameter: Optional[str] = Field(default=None, min_length=1, max_length=100)
    value: Optional[str] = Field(default=None, min_length=1, max_length=100)
    unit: Optional[str] = Field(default=None, min_length=1, max_length=50)
    source_type: Optional[AssumptionSourceType] = None
    description: Optional[str] = None
    confidence: Optional[Decimal] = Field(default=None, ge=0, le=1)
    reference_notes: Optional[str] = None


class AssumptionResponse(AssumptionBase):
    id: int
    event_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class ResolvedAssumption(BaseModel):
    parameter: str = Field(..., description="The queried parameter key")
    value: Optional[str] = Field(default=None, description="Resolved value (None if missing)")
    unit: Optional[str] = Field(default=None, description="Measurement unit")
    source_type: Optional[AssumptionSourceType] = Field(default=None, description="Provenance source of resolved value")
    category: Optional[str] = Field(default=None, description="Domain category")
    confidence: Optional[Decimal] = Field(default=None, description="Confidence score")
    reference_notes: Optional[str] = Field(default=None, description="Notes or citations")
    scope: Optional[AssumptionScope] = Field(default=None, description="Scope of resolved assumption: GLOBAL or EVENT")
    is_resolved: bool = Field(default=True, description="True if a value was resolved, False if missing")
    explanation: Optional[str] = Field(default=None, description="Human-readable explanation of how the value was determined")

    model_config = ConfigDict(from_attributes=True)
