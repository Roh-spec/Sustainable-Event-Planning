from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    total_budget: Decimal = Field(..., ge=0, description="Total budget limit for the event")
    currency: str = Field(default="INR", max_length=10, description="Currency code (e.g. INR)")
    status: Optional[str] = Field(default=None, max_length=50, description="Optional budget status")


class BudgetCreate(BudgetBase):
    pass


class BudgetResponse(BudgetBase):
    id: int
    event_id: int

    model_config = ConfigDict(from_attributes=True)
