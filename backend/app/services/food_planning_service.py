from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from backend.app.models.event import Event
from backend.app.models.constraint import Constraint
from backend.app.planning.assumption_engine.manager import AssumptionResolver
from backend.app.planning.modules.food.calculator import FoodCalculator
from backend.app.planning.modules.food.schemas import (
    FoodPlanRequest,
    FoodPlanResponse,
)
from backend.app.schemas.assumption import ResolvedAssumption


class FoodPlanningService:
    """
    Orchestration service for the Food Planning Module.
    Coordinates Event data retrieval, Assumption resolution, and Constraint fetching,
    then delegates deterministic calculations to the decoupled FoodCalculator.
    """

    @classmethod
    def plan_food(
        cls,
        db: Session,
        request: FoodPlanRequest,
    ) -> FoodPlanResponse:
        """
        Gathers context from Event, resolves required assumptions,
        and computes estimated food quantities, costs, and waste.
        """
        # 1. Fetch Event
        event = db.query(Event).filter(Event.id == request.event_id).first()
        if not event:
            raise ValueError(f"Event with id {request.event_id} does not exist.")

        # 2. Derive budget if not explicitly provided
        food_budget = request.food_budget
        if food_budget is None and event.budget:
            # Note: Event total budget is available as upper reference
            food_budget = event.budget.total_budget

        effective_request = request.model_copy(update={"food_budget": food_budget})

        # 3. Retrieve event constraints
        db_constraints = db.query(Constraint).filter(Constraint.event_id == event.id).all()
        constraints_data: List[dict] = [
            {
                "id": c.id,
                "category": c.category,
                "description": c.description,
                "constraint_type": c.constraint_type,
                "value": c.value,
            }
            for c in db_constraints
        ]

        # 4. Resolve assumptions for all relevant parameters
        params_to_resolve = {
            "meal_participation_rate_default",
            "meal_cost_per_serving_default",
            "vegetarian_ratio",
            "food_waste_percentage",
            "food_serving_weight_kg_default",
            "food_participation_attrition_buffer_rate",
        }

        for m in request.meals:
            meal_key = m.meal_type.value.lower()
            params_to_resolve.add(f"meal_participation_rate_{meal_key}")
            params_to_resolve.add(f"meal_cost_per_serving_{meal_key}")
            params_to_resolve.add(f"food_serving_weight_kg_{meal_key}")

        resolved_assumptions: Dict[str, ResolvedAssumption] = {}
        for param in params_to_resolve:
            resolved = AssumptionResolver.resolve(
                db=db,
                parameter=param,
                event_id=event.id,
                category="FOOD",
            )
            if resolved.is_resolved:
                resolved_assumptions[param] = resolved

        # 5. Delegate pure calculation to FoodCalculator
        response = FoodCalculator.calculate(
            request=effective_request,
            event_name=event.name,
            event_type=event.event_type,
            expected_attendees=event.expected_attendees,
            resolved_assumptions=resolved_assumptions,
            constraints=constraints_data,
        )

        return response


food_planning_service = FoodPlanningService()
