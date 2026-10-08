"""
Master orchestrator generating alternative plans (Budget-Focused, Balanced, Sustainability-Focused).
"""

from decimal import Decimal
from typing import Any, List, Optional

from backend.app.planning.orchestrator.pipeline import planning_pipeline
from backend.app.planning.orchestrator.schemas import PlanningRequest, PlanningResponse
from backend.app.schemas.constraint import ConstraintBase


class PlanningOrchestrator:
    """
    Master Planning Orchestrator entrypoint.
    Orchestrates candidate generation, module evaluations, constraint satisfaction,
    and multi-objective alternative ranking.
    """

    @classmethod
    def plan(
        cls,
        request: PlanningRequest,
        event_name: str,
        event_type: str,
        expected_attendees: int,
        budget: Optional[Decimal] = None,
        constraints: Optional[List[ConstraintBase]] = None,
        db: Any = None,
        resolved_assumptions: Any = None,
    ) -> PlanningResponse:
        """
        Executes the planning engine workflow.
        """
        return planning_pipeline.run(
            request=request,
            event_name=event_name,
            event_type=event_type,
            expected_attendees=expected_attendees,
            budget=budget,
            constraints=constraints,
            db=db,
            resolved_assumptions=resolved_assumptions,
        )


planning_orchestrator = PlanningOrchestrator()
