from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.budget import BudgetCreate, BudgetResponse


class EventType(str, Enum):
    """Initial supported event types (extensible)."""
    TECH_FEST = "TECH_FEST"
    CULTURAL_FEST = "CULTURAL_FEST"
    HACKATHON = "HACKATHON"
    WORKSHOP = "WORKSHOP"
    CONFERENCE = "CONFERENCE"
    SPORTS_EVENT = "SPORTS_EVENT"
    FAREWELL = "FAREWELL"
    DEPARTMENT_EVENT = "DEPARTMENT_EVENT"
    OTHER = "OTHER"


class EventBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the event")
    event_type: str = Field(..., min_length=1, max_length=50, description="Type or category of the event")
    expected_attendees: int = Field(..., gt=0, description="Expected number of attendees (must be > 0)")
    duration_days: int = Field(..., gt=0, description="Duration in days (must be > 0)")
    location: Optional[str] = Field(default=None, max_length=255, description="Event venue or location name")


class EventCreate(EventBase):
    budget: Optional[BudgetCreate] = Field(default=None, description="Optional initial budget specification")


class EventResponse(EventBase):
    id: int
    budget: Optional[BudgetResponse] = None

    model_config = ConfigDict(from_attributes=True)
