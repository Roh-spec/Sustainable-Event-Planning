from decimal import Decimal
from typing import Optional
from sqlalchemy import Boolean, Integer, Numeric, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Plan(Base):
    """
    Plan entity representing a generated or tailored event plan alternative.
    Planning modes: BALANCED, BUDGET_FOCUSED, SUSTAINABILITY_FOCUSED, CUSTOM.
    """
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    planning_mode: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )  # BALANCED, BUDGET_FOCUSED, SUSTAINABILITY_FOCUSED, CUSTOM
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="GENERATED")
    total_estimated_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    sustainability_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_selected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="plans")
