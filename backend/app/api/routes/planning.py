from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.planning.modules.food.schemas import (
    FoodPlanRequest,
    FoodPlanResponse,
)
from backend.app.planning.modules.waste.schemas import (
    WastePlanRequest,
    WastePlanResponse,
)
from backend.app.planning.orchestrator.schemas import (
    PlanningRequest,
    PlanningResponse,
)
from backend.app.planning.modules.scheduling.schemas import (
    CompletePlanRequest,
    CompletePlanResponse,
)
from backend.app.services.food_planning_service import food_planning_service
from backend.app.services.waste_planning_service import waste_planning_service
from backend.app.services.planning_service import planning_service
from backend.app.services.complete_plan_service import complete_plan_service

router = APIRouter(prefix="/planning", tags=["Planning"])


@router.post(
    "/generate",
    response_model=PlanningResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate multi-objective event plan alternatives (Budget, Balanced, Sustainability)",
)
def generate_plans(
    request: PlanningRequest,
    db: Session = Depends(get_db),
) -> PlanningResponse:
    """
    Executes the Planning Orchestrator.
    Generates candidate configurations, queries domain modules (Food, Waste),
    aggregates costs, validates constraints, and returns ranked alternatives
    for requested planning objectives without arbitrary scores or weights.
    """
    try:
        return planning_service.generate_plan(db=db, request=request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )



@router.post(
    "/food",
    response_model=FoodPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Estimate food quantities, costs, and waste",
)
def plan_food(
    request: FoodPlanRequest,
    db: Session = Depends(get_db),
) -> FoodPlanResponse:
    """
    Executes the Food Planning Module for an event.
    Estimates servings, costs, and potential food waste based on event attendees,
    meal schedules, user overrides, and resolved domain assumptions.
    """
    try:
        return food_planning_service.plan_food(db=db, request=request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/waste",
    response_model=WastePlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Estimate event waste across food, packaging, plastic, and other streams",
)
def plan_waste(
    request: WastePlanRequest,
    db: Session = Depends(get_db),
) -> WastePlanResponse:
    """
    Executes the Waste Planning Module for an event.
    Estimates waste quantities across food, packaging components, plastic items,
    and other miscellaneous streams based on event context and resolved domain assumptions.
    Paper Waste is explicitly waitlisted and not supported.
    """
    try:
        return waste_planning_service.plan_waste(db=db, request=request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/complete-plan",
    response_model=CompletePlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate complete, actionable event plan with timetable, checklist, resources, and budget",
)
def generate_complete_plan(
    request: CompletePlanRequest,
    db: Session = Depends(get_db),
) -> CompletePlanResponse:
    """
    Combines the Scheduling Engine with existing event information, the selected
    sustainable plan alternative, food and waste estimates, and budget data.
    Produces an actionable timetable, preparation checklist, resource manifest,
    and sustainability actions without recalculating existing domain models.
    """
    try:
        return complete_plan_service.generate_complete_plan(db=db, request=request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


