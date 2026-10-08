"""
Schemas for cost estimation, line-item breakdowns, and budget variance.
"""

from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class CostBreakdownItem(BaseModel):
    """Line-item cost entry for a specific domain module or service."""
    category: str
    description: str
    amount: Decimal = Field(..., ge=0)
    source_type: str = "ESTIMATED"


class CostSummaryResult(BaseModel):
    """Consolidated financial summary across all planning domain modules."""
    total_estimated_cost: Decimal = Field(..., ge=0)
    budget: Optional[Decimal] = Field(default=None, ge=0)
    variance_amount: Optional[Decimal] = None  # Positive = surplus, Negative = deficit
    is_over_budget: bool = False
    items: List[CostBreakdownItem] = Field(default_factory=list)
