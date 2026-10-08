from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ConstraintType(str, Enum):
    REQUIRED = "REQUIRED"
    PREFERRED = "PREFERRED"
    NOT_ALLOWED = "NOT_ALLOWED"
    FLEXIBLE = "FLEXIBLE"


class ConstraintBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=100, description="Domain category (e.g. FOOD, WASTE)")
    description: str = Field(..., min_length=1, description="Constraint statement or rule")
    constraint_type: ConstraintType = Field(..., description="Level of enforcement")
    value: Optional[str] = Field(default=None, max_length=255, description="Specific constraint parameter or threshold")


class ConstraintCreate(ConstraintBase):
    pass


class ConstraintResponse(ConstraintBase):
    id: int
    event_id: int

    model_config = ConfigDict(from_attributes=True)
