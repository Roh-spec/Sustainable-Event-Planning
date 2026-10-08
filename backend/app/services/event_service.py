from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.models.event import Event
from backend.app.models.budget import Budget
from backend.app.schemas.event import EventCreate


class EventService:
    """
    Application service coordinating Event persistence and queries.
    Keeps API controllers decoupled from database ORM operations.
    """

    @staticmethod
    def create_event(db: Session, event_data: EventCreate) -> Event:
        """Creates and persists an Event entity and its initial budget if provided."""
        event = Event(
            name=event_data.name,
            event_type=event_data.event_type,
            expected_attendees=event_data.expected_attendees,
            duration_days=event_data.duration_days,
            location=event_data.location,
        )

        if event_data.budget:
            budget = Budget(
                total_budget=event_data.budget.total_budget,
                currency=event_data.budget.currency,
                status=event_data.budget.status,
            )
            event.budget = budget

        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def get_event(db: Session, event_id: int) -> Optional[Event]:
        """Retrieves a single Event by ID or returns None."""
        return db.query(Event).filter(Event.id == event_id).first()

    @staticmethod
    def list_events(db: Session, skip: int = 0, limit: int = 100) -> List[Event]:
        """Lists events with pagination offsets."""
        return db.query(Event).offset(skip).limit(limit).all()


event_service = EventService()
