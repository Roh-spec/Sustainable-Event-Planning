from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.event import EventCreate, EventResponse
from backend.app.services.event_service import event_service

router = APIRouter(prefix="/events", tags=["Events"])


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new event",
)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
) -> EventResponse:
    """
    Validates and stores a new event record.
    Delegates persistence to EventService.
    Does not trigger any automated planning or calculations.
    """
    event = event_service.create_event(db=db, event_data=event_in)
    return event


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="Retrieve an event by ID",
)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
) -> EventResponse:
    """
    Retrieves an event by its primary identifier.
    Returns 404 if the event does not exist.
    """
    event = event_service.get_event(db=db, event_id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found",
        )
    return event


@router.get(
    "",
    response_model=List[EventResponse],
    summary="List all events",
)
def list_events(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> List[EventResponse]:
    """Retrieves paginated events."""
    return event_service.list_events(db=db, skip=skip, limit=limit)
