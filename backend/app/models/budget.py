from decimal import Decimal
from typing import Optional
from sqlalchemy import Integer, Numeric, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Budget(Base):
    """
    Budget entity representing the organizer's financial limit for an event.
    Initially serves as a hard planning constraint.
    """
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    total_budget: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="INR")
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="budget")
