from decimal import Decimal
from typing import Optional
from sqlalchemy import Integer, Numeric, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class CostItem(Base):
    """
    CostItem entity representing a granular cost entry or estimation.
    Preserves data provenance (source_type) and pricing modes (PER_PERSON, TOTAL).
    """
    __tablename__ = "cost_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    pricing_unit: Mapped[str] = mapped_column(String(50), nullable=False)  # PER_PERSON, TOTAL
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("1.00"))
    source_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )  # USER_PROVIDED, ESTIMATED, REFERENCE, ACTUAL, ML_PREDICTED
    source_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="cost_items")
