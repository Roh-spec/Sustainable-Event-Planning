from decimal import Decimal
from typing import Optional
from sqlalchemy import Integer, Numeric, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Assumption(Base):
    """
    Assumption entity recording baseline parameters and heuristics.
    Enables transparent, explainable planning and provenance tracking.
    Source types: USER_PROVIDED, REFERENCE, ASSUMED, ACTUAL, ML_PREDICTED.
    """
    __tablename__ = "assumptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    parameter: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    value: Mapped[str] = mapped_column(String(100), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    source_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )  # USER_PROVIDED, REFERENCE, ASSUMED, ACTUAL, ML_PREDICTED
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    reference_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    event: Mapped[Optional["Event"]] = relationship("Event", back_populates="assumptions")
