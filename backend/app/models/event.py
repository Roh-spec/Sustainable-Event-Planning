from typing import List, Optional
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Event(Base):
    """
    Event entity representing an organizer's planned event.
    Central entity in the planning orchestrator hierarchy.
    """
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    expected_attendees: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    budget: Mapped[Optional["Budget"]] = relationship(
        "Budget",
        back_populates="event",
        uselist=False,
        cascade="all, delete-orphan",
    )
    cost_items: Mapped[List["CostItem"]] = relationship(
        "CostItem",
        back_populates="event",
        cascade="all, delete-orphan",
    )
    constraints: Mapped[List["Constraint"]] = relationship(
        "Constraint",
        back_populates="event",
        cascade="all, delete-orphan",
    )
    assumptions: Mapped[List["Assumption"]] = relationship(
        "Assumption",
        back_populates="event",
        cascade="all, delete-orphan",
    )
    plans: Mapped[List["Plan"]] = relationship(
        "Plan",
        back_populates="event",
        cascade="all, delete-orphan",
    )
