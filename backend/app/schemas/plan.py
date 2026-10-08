from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PlanningMode(str, Enum):
    BALANCED = "BALANCED"
    BUDGET_FOCUSED = "BUDGET_FOCUSED"
    SUSTAINABILITY_FOCUSED = "SUSTAINABILITY_FOCUSED"
    CUSTOM = "CUSTOM"


class PlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Plan title or variation name")
    planning_mode: PlanningMode = Field(..., description="Target optimization orientation")
    status: str = Field(default="GENERATED", max_length=50, description="Plan lifecycle state")
    total_estimated_cost: Optional[Decimal] = Field(default=None, ge=0, description="Computed total cost")
    sustainability_score: Optional[Decimal] = Field(default=None, ge=0, description="Calculated green score placeholder")
    explanation: Optional[str] = Field(default=None, description="Trade-off summary and rationale")
    is_selected: bool = Field(default=False, description="Whether this plan is chosen by the organizer")


class PlanResponse(PlanBase):
    id: int
    event_id: int

    model_config = ConfigDict(from_attributes=True)
