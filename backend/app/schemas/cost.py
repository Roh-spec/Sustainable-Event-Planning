from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PricingUnit(str, Enum):
    PER_PERSON = "PER_PERSON"
    TOTAL = "TOTAL"


class CostSourceType(str, Enum):
    USER_PROVIDED = "USER_PROVIDED"
    ESTIMATED = "ESTIMATED"
    REFERENCE = "REFERENCE"
    ACTUAL = "ACTUAL"
    ML_PREDICTED = "ML_PREDICTED"


class CostItemBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=100, description="Cost category (e.g. FOOD, VENUE)")
    name: str = Field(..., min_length=1, max_length=255, description="Item or service name")
    description: Optional[str] = Field(default=None, description="Detailed item description")
    amount: Decimal = Field(..., ge=0, description="Cost per unit or total cost (must be >= 0)")
    pricing_unit: PricingUnit = Field(..., description="Pricing mode: PER_PERSON or TOTAL")
    quantity: Decimal = Field(default=Decimal("1.00"), gt=0, description="Quantity of units")
    source_type: CostSourceType = Field(
        default=CostSourceType.USER_PROVIDED,
        description="Origin of cost information",
    )
    source_reference: Optional[str] = Field(default=None, max_length=255, description="Citation or source notes")


class CostItemCreate(CostItemBase):
    pass


class CostItemResponse(CostItemBase):
    id: int
    event_id: int

    model_config = ConfigDict(from_attributes=True)
