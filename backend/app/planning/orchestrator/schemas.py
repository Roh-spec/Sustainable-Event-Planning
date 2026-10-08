"""
Domain schemas for the Planning Engine Orchestrator.
Defines requests, candidate configurations, candidate evaluations,
sustainability metrics, and final plan alternatives.
"""

from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from backend.app.planning.constraint_engine.schemas import ConstraintResult
from backend.app.planning.modules.food.schemas import FoodPlanRequest
from backend.app.planning.modules.waste.schemas import WastePlanRequest, WasteSourceType
from backend.app.schemas.assumption import ResolvedAssumption
from backend.app.schemas.constraint import ConstraintBase


class PlanningObjective(str, Enum):
    """Supported multi-objective planning targets without arbitrary weights."""
    BUDGET_FOCUSED = "BUDGET_FOCUSED"
    BALANCED = "BALANCED"
    SUSTAINABILITY_FOCUSED = "SUSTAINABILITY_FOCUSED"


class PlanningModuleContext(BaseModel):
    """
    Extensible module context input for the Planning Engine.
    Enables future modules (Energy, Materials, Carbon, etc.) to be attached
    without modifying core orchestration schemas.
    """
    food: Optional[FoodPlanRequest] = Field(default=None, description="Food planning request context")
    waste: Optional[WastePlanRequest] = Field(default=None, description="Waste planning request context")

    model_config = ConfigDict(extra="allow")


class PlanningRequest(BaseModel):
    """
    Master planning request payload.
    """
    event_id: int = Field(..., description="Target Event ID")
    budget: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Budget ceiling override; defaults to Event budget if omitted",
    )
    constraints: List[ConstraintBase] = Field(
        default_factory=list,
        description="Explicit event constraints; combined with stored DB constraints",
    )
    planning_objectives: List[PlanningObjective] = Field(
        default_factory=lambda: [
            PlanningObjective.BUDGET_FOCUSED,
            PlanningObjective.BALANCED,
            PlanningObjective.SUSTAINABILITY_FOCUSED,
        ],
        description="Requested plan alternatives to generate",
    )
    module_context: Optional[PlanningModuleContext] = Field(
        default=None,
        description="Domain module contexts (Food, Waste, etc.)",
    )
    allow_budget_increase: bool = Field(
        default=False,
        description="Whether user explicitly approves increasing budget if current budget is infeasible",
    )
    max_approved_budget: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Maximum user-approved budget limit if budget increase is permitted",
    )


class CandidateConfiguration(BaseModel):
    """
    Represents WHAT the planner proposes.
    Must NOT contain calculated cost or calculated waste figures.
    Only contains valid, legitimate configuration variables.
    """
    candidate_id: str = Field(..., description="Unique deterministic candidate identifier")
    name: str = Field(..., description="Human-readable candidate label")
    description: str = Field(..., description="Description of the proposed planning strategy")
    food_config: Optional[FoodPlanRequest] = Field(default=None, description="Food module configuration")
    waste_config: Optional[WastePlanRequest] = Field(default=None, description="Waste module configuration")
    constraint_adjustments: List[str] = Field(default_factory=list, description="Explicit soft constraint adjustments")
    basis_notes: List[str] = Field(default_factory=list, description="Traceable basis for candidate variables")


class SustainabilityMetric(BaseModel):
    """
    Measurable sustainability indicator produced by domain modules.
    Never an arbitrary or invented score.
    """
    metric_name: str = Field(..., description="Indicator identifier (e.g. food_waste_kg, single_use_items)")
    value: Decimal = Field(..., description="Calculated measurable quantity")
    unit: str = Field(..., description="Physical or count unit (e.g. kg, servings, items)")
    source_type: WasteSourceType = Field(default=WasteSourceType.ESTIMATED, description="Data provenance")
    module: str = Field(..., description="Originating domain module (e.g. FOOD, WASTE)")
    description: Optional[str] = Field(default=None, description="Human-readable context of the metric")


class FoodMetrics(BaseModel):
    """Structured food indicators extracted from Food Module evaluation."""
    estimated_servings: Optional[int] = None
    estimated_cost: Optional[Decimal] = None
    estimated_waste_servings: Optional[Decimal] = None
    estimated_waste_kg: Optional[Decimal] = None
    veg_servings: Optional[int] = None
    non_veg_servings: Optional[int] = None


class WasteMetrics(BaseModel):
    """Structured waste indicators extracted from Waste Module evaluation."""
    total_packaging_items: Optional[Decimal] = None
    reusable_packaging_items: Optional[Decimal] = None
    single_use_packaging_items: Optional[Decimal] = None
    reusable_percentage: Optional[Decimal] = None
    total_plastic_items: Optional[Decimal] = None
    total_other_items: Optional[Decimal] = None


class CandidateEvaluation(BaseModel):
    """
    Complete evaluation of a candidate configuration after modules, cost,
    and constraints have executed.
    """
    candidate_id: str
    name: str
    configuration: CandidateConfiguration
    feasible: bool = True
    total_cost: Optional[Decimal] = None
    food_metrics: Optional[FoodMetrics] = None
    waste_metrics: Optional[WasteMetrics] = None
    sustainability_metrics: List[SustainabilityMetric] = Field(default_factory=list)
    constraint_result: ConstraintResult
    assumptions_used: List[ResolvedAssumption] = Field(default_factory=list)
    missing_assumptions: List[str] = Field(default_factory=list)
    explanations: List[str] = Field(default_factory=list)


class PlanAlternative(BaseModel):
    """
    A selected, meaningful final plan alternative presented to the organizer.
    Compatible with existing database Plan entity.
    """
    plan_id: str
    name: str
    planning_objective: PlanningObjective
    candidate_id: str
    feasible: bool
    estimated_cost: Optional[Decimal] = None
    food_metrics: Optional[FoodMetrics] = None
    waste_metrics: Optional[WasteMetrics] = None
    sustainability_metrics: List[SustainabilityMetric] = Field(default_factory=list)
    constraint_result: ConstraintResult
    assumptions_used: List[ResolvedAssumption] = Field(default_factory=list)
    tradeoffs: List[str] = Field(default_factory=list)
    explanations: List[str] = Field(default_factory=list)


class PlanningResponse(BaseModel):
    """
    Standardized response payload for POST /api/v1/planning/generate.
    """
    event_id: int
    event_name: str
    expected_attendees: int
    budget: Optional[Decimal] = None
    status: str = "COMPLETE"  # COMPLETE, PARTIAL, INFEASIBLE_BUDGET
    min_feasible_budget: Optional[Decimal] = None
    budget_deficit: Optional[Decimal] = None
    plans: List[PlanAlternative] = Field(default_factory=list)
    all_evaluated_candidates: List[CandidateEvaluation] = Field(default_factory=list)
    assumptions_used: List[ResolvedAssumption] = Field(default_factory=list)
    missing_assumptions: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
