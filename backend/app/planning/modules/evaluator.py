"""
Clean, extensible module evaluation interface.
Defines the contract for domain modules (Food, Waste, future Energy, Carbon, etc.)
to evaluate candidate configurations without coupling the Planning Engine to domain calculations.
"""

from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from backend.app.planning.orchestrator.schemas import SustainabilityMetric
from backend.app.schemas.assumption import ResolvedAssumption


class ModuleEvaluationResult(BaseModel):
    """Standardized output from a domain module evaluation."""
    module_name: str
    success: bool = True
    estimated_cost: Optional[Decimal] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    sustainability_indicators: List[SustainabilityMetric] = Field(default_factory=list)
    assumptions_used: List[ResolvedAssumption] = Field(default_factory=list)
    missing_assumptions: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    raw_response: Optional[Any] = None


class ModuleEvaluator(ABC):
    """
    Abstract evaluation adapter for a domain planning module.
    Future modules (Energy, Materials, Transport, Venue, Carbon) will implement this contract.
    """

    @property
    @abstractmethod
    def module_name(self) -> str:
        """Domain module identifier (e.g. 'FOOD', 'WASTE')."""
        pass

    @abstractmethod
    def evaluate(self, candidate_config: Any, context: Any) -> ModuleEvaluationResult:
        """
        Executes domain calculations on the candidate configuration
        and translates output into a standardized ModuleEvaluationResult.
        """
        pass
