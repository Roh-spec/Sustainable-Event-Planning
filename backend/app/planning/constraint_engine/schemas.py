"""
Schemas for constraint definitions, violations, relaxations, and evaluation reports.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.constraint import ConstraintType


class ConstraintViolation(BaseModel):
    """Details of a hard constraint violation that invalidates candidate feasibility."""
    constraint_id: Optional[int] = None
    category: str
    constraint_type: ConstraintType
    description: str
    reason: str


class ConstraintRelaxation(BaseModel):
    """Details of an explicitly relaxed soft constraint (Preferred or Flexible)."""
    constraint_id: Optional[int] = None
    category: str
    constraint_type: ConstraintType
    description: str
    relaxation_reason: str
    impact: str = "Plan feasibility adjustment"


class ConstraintResult(BaseModel):
    """Comprehensive constraint evaluation result across the constraint hierarchy."""
    feasible: bool = True
    required_satisfied: bool = True
    not_allowed_satisfied: bool = True
    preferred_satisfied: bool = True
    budget_satisfied: bool = True
    flexible_adjustments: List[str] = Field(default_factory=list)
    violations: List[ConstraintViolation] = Field(default_factory=list)
    relaxed_constraints: List[ConstraintRelaxation] = Field(default_factory=list)
