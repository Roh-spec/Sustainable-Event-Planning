from typing import Optional
from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Constraint(Base):
    """
    Constraint entity capturing user and institutional rules for event planning.
    Constraint types: REQUIRED, PREFERRED, NOT_ALLOWED, FLEXIBLE.
    """
    __tablename__ = "constraints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    constraint_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )  # REQUIRED, PREFERRED, NOT_ALLOWED, FLEXIBLE
    value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="constraints")
