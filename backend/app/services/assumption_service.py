from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.models.assumption import Assumption
from backend.app.models.event import Event
from backend.app.planning.assumption_engine.manager import AssumptionResolver
from backend.app.schemas.assumption import (
    AssumptionCreate,
    AssumptionUpdate,
    ResolvedAssumption,
)


class AssumptionService:
    """
    Application service coordinating Assumption persistence, queries, and resolution.
    Encapsulates database operations away from API routes.
    """

    @staticmethod
    def create_assumption(db: Session, assumption_in: AssumptionCreate) -> Assumption:
        """
        Creates and persists a new Assumption entity.
        Validates that event_id exists if specified.
        """
        if assumption_in.event_id is not None:
            event = db.query(Event).filter(Event.id == assumption_in.event_id).first()
            if not event:
                raise ValueError(f"Event with id {assumption_in.event_id} does not exist.")

        assumption = Assumption(
            event_id=assumption_in.event_id,
            category=assumption_in.category.strip(),
            parameter=assumption_in.parameter.strip(),
            value=assumption_in.value.strip(),
            unit=assumption_in.unit.strip(),
            source_type=assumption_in.source_type.value,
            description=assumption_in.description,
            confidence=assumption_in.confidence,
            reference_notes=assumption_in.reference_notes,
        )

        db.add(assumption)
        db.commit()
        db.refresh(assumption)
        return assumption

    @staticmethod
    def get_assumption(db: Session, assumption_id: int) -> Optional[Assumption]:
        """Retrieves an assumption by ID."""
        return db.query(Assumption).filter(Assumption.id == assumption_id).first()

    @staticmethod
    def list_assumptions(
        db: Session,
        event_id: Optional[int] = None,
        category: Optional[str] = None,
        parameter: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Assumption]:
        """Lists assumptions matching optional search filters."""
        query = db.query(Assumption)
        if event_id is not None:
            query = query.filter(Assumption.event_id == event_id)
        if category:
            query = query.filter(Assumption.category == category.strip())
        if parameter:
            query = query.filter(Assumption.parameter == parameter.strip())

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_assumption(
        db: Session,
        assumption_id: int,
        update_data: AssumptionUpdate,
    ) -> Optional[Assumption]:
        """Updates fields of an existing assumption."""
        assumption = db.query(Assumption).filter(Assumption.id == assumption_id).first()
        if not assumption:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                if key == "source_type":
                    setattr(assumption, key, value.value if hasattr(value, "value") else str(value))
                else:
                    setattr(assumption, key, value.strip() if isinstance(value, str) else value)

        db.commit()
        db.refresh(assumption)
        return assumption

    @staticmethod
    def delete_assumption(db: Session, assumption_id: int) -> bool:
        """Deletes an assumption by ID. Returns True if deleted, False if not found."""
        assumption = db.query(Assumption).filter(Assumption.id == assumption_id).first()
        if not assumption:
            return False

        db.delete(assumption)
        db.commit()
        return True

    @staticmethod
    def resolve_assumption(
        db: Session,
        parameter: str,
        event_id: Optional[int] = None,
        category: Optional[str] = None,
    ) -> ResolvedAssumption:
        """Resolves an assumption using deterministic resolution priority."""
        return AssumptionResolver.resolve(
            db=db,
            parameter=parameter,
            event_id=event_id,
            category=category,
        )


assumption_service = AssumptionService()
