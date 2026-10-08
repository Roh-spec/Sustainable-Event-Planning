"""
Orchestration service for the Planning Engine.
Retrieves Event context, Budget ceilings, and active Constraints from PostgreSQL,
then delegates candidate generation, module evaluations, constraint satisfaction,
and multi-objective alternative ranking to the decoupled PlanningOrchestrator.
"""

from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session

from backend.app.models.event import Event
from backend.app.models.constraint import Constraint
from backend.app.planning.orchestrator.planner import planning_orchestrator
from backend.app.planning.orchestrator.schemas import (
    PlanningRequest,
    PlanningResponse,
)
from backend.app.schemas.constraint import ConstraintBase, ConstraintType


class PlanningService:
    """
    Application service coordinating event domain context with the Planning Orchestrator.
    """

    @classmethod
    def generate_plan(
        cls,
        db: Session,
        request: PlanningRequest,
    ) -> PlanningResponse:
        """
        Gathers context from Event, Budget, and Constraints tables,
        and generates ranked plan alternatives.
        """
        # 1. Fetch Event
        event = db.query(Event).filter(Event.id == request.event_id).first()
        if not event:
            raise ValueError(f"Event with id {request.event_id} does not exist.")

        # 2. Derive budget if omitted in request
        budget: Optional[Decimal] = request.budget
        if budget is None and event.budget is not None:
            budget = event.budget.total_budget

        # 3. Retrieve stored event constraints
        db_constraints = db.query(Constraint).filter(Constraint.event_id == event.id).all()
        stored_constraints: List[ConstraintBase] = [
            ConstraintBase(
                category=c.category,
                description=c.description,
                constraint_type=ConstraintType(c.constraint_type),
                value=c.value,
            )
            for c in db_constraints
        ]

        # 4. Synchronize module contexts with target event_id if provided
        if request.module_context:
            if request.module_context.food and request.module_context.food.event_id != event.id:
                request.module_context.food.event_id = event.id
            if request.module_context.waste and request.module_context.waste.event_id != event.id:
                request.module_context.waste.event_id = event.id

        # 5. Delegate execution to Planning Orchestrator
        response = planning_orchestrator.plan(
            request=request,
            event_name=event.name,
            event_type=event.event_type,
            expected_attendees=event.expected_attendees,
            budget=budget,
            constraints=stored_constraints,
            db=db,
        )

        return response


planning_service = PlanningService()
