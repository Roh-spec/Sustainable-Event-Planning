from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.assumption import (
    AssumptionCreate,
    AssumptionUpdate,
    AssumptionResponse,
    ResolvedAssumption,
)
from backend.app.services.assumption_service import assumption_service

router = APIRouter(prefix="/assumptions", tags=["Assumptions"])


@router.get(
    "/resolve",
    response_model=ResolvedAssumption,
    summary="Resolve an assumption parameter",
)
def resolve_assumption(
    parameter: str = Query(..., min_length=1, description="The parameter key to resolve"),
    event_id: Optional[int] = Query(default=None, description="Optional target event context"),
    category: Optional[str] = Query(default=None, description="Optional domain category filter"),
    allow_missing: bool = Query(
        default=False,
        description="If True, return 200 with is_resolved=False when missing, instead of 404",
    ),
    db: Session = Depends(get_db),
) -> ResolvedAssumption:
    """
    Resolves an assumption parameter with priority:
    1. Event-specific assumption
    2. Global reference assumption
    3. Missing
    """
    resolved = assumption_service.resolve_assumption(
        db=db,
        parameter=parameter,
        event_id=event_id,
        category=category,
    )
    if not resolved.is_resolved and not allow_missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=resolved.explanation,
        )
    return resolved


@router.post(
    "",
    response_model=AssumptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new assumption",
)
def create_assumption(
    assumption_in: AssumptionCreate,
    db: Session = Depends(get_db),
) -> AssumptionResponse:
    """
    Creates an assumption (global when event_id is null, or event-specific).
    Validates that event_id exists if specified.
    """
    try:
        assumption = assumption_service.create_assumption(db=db, assumption_in=assumption_in)
        return assumption
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "",
    response_model=List[AssumptionResponse],
    summary="List assumptions",
)
def list_assumptions(
    event_id: Optional[int] = Query(default=None, description="Filter by event_id"),
    category: Optional[str] = Query(default=None, description="Filter by domain category"),
    parameter: Optional[str] = Query(default=None, description="Filter by parameter key"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> List[AssumptionResponse]:
    """Retrieves paginated assumptions matching optional query filters."""
    return assumption_service.list_assumptions(
        db=db,
        event_id=event_id,
        category=category,
        parameter=parameter,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{assumption_id}",
    response_model=AssumptionResponse,
    summary="Retrieve an assumption by ID",
)
def get_assumption(
    assumption_id: int,
    db: Session = Depends(get_db),
) -> AssumptionResponse:
    """Retrieves a single assumption by its primary key ID."""
    assumption = assumption_service.get_assumption(db=db, assumption_id=assumption_id)
    if not assumption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assumption with id {assumption_id} not found",
        )
    return assumption


@router.put(
    "/{assumption_id}",
    response_model=AssumptionResponse,
    summary="Update an existing assumption",
)
@router.patch(
    "/{assumption_id}",
    response_model=AssumptionResponse,
    summary="Patch an existing assumption",
)
def update_assumption(
    assumption_id: int,
    update_data: AssumptionUpdate,
    db: Session = Depends(get_db),
) -> AssumptionResponse:
    """Updates fields of an existing assumption record."""
    assumption = assumption_service.update_assumption(
        db=db,
        assumption_id=assumption_id,
        update_data=update_data,
    )
    if not assumption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assumption with id {assumption_id} not found",
        )
    return assumption


@router.delete(
    "/{assumption_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an assumption",
)
def delete_assumption(
    assumption_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Deletes an assumption record."""
    deleted = assumption_service.delete_assumption(db=db, assumption_id=assumption_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assumption with id {assumption_id} not found",
        )
