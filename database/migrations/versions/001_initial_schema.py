"""create_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-04 17:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. events
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("expected_attendees", sa.Integer(), nullable=False),
        sa.Column("duration_days", sa.Integer(), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_events_id"), "events", ["id"], unique=False)
    op.create_index(op.f("ix_events_event_type"), "events", ["event_type"], unique=False)

    # 2. budgets
    op.create_table(
        "budgets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("total_budget", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_budgets_id"), "budgets", ["id"], unique=False)
    op.create_index(op.f("ix_budgets_event_id"), "budgets", ["event_id"], unique=True)

    # 3. cost_items
    op.create_table(
        "cost_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("pricing_unit", sa.String(length=50), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_reference", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cost_items_id"), "cost_items", ["id"], unique=False)
    op.create_index(op.f("ix_cost_items_event_id"), "cost_items", ["event_id"], unique=False)
    op.create_index(op.f("ix_cost_items_category"), "cost_items", ["category"], unique=False)
    op.create_index(op.f("ix_cost_items_source_type"), "cost_items", ["source_type"], unique=False)

    # 4. constraints
    op.create_table(
        "constraints",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("constraint_type", sa.String(length=50), nullable=False),
        sa.Column("value", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_constraints_id"), "constraints", ["id"], unique=False)
    op.create_index(op.f("ix_constraints_event_id"), "constraints", ["event_id"], unique=False)
    op.create_index(op.f("ix_constraints_category"), "constraints", ["category"], unique=False)
    op.create_index(op.f("ix_constraints_constraint_type"), "constraints", ["constraint_type"], unique=False)

    # 5. assumptions
    op.create_table(
        "assumptions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("parameter", sa.String(length=100), nullable=False),
        sa.Column("value", sa.String(length=100), nullable=False),
        sa.Column("unit", sa.String(length=50), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("reference_notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_assumptions_id"), "assumptions", ["id"], unique=False)
    op.create_index(op.f("ix_assumptions_event_id"), "assumptions", ["event_id"], unique=False)
    op.create_index(op.f("ix_assumptions_category"), "assumptions", ["category"], unique=False)
    op.create_index(op.f("ix_assumptions_parameter"), "assumptions", ["parameter"], unique=False)
    op.create_index(op.f("ix_assumptions_source_type"), "assumptions", ["source_type"], unique=False)

    # 6. plans
    op.create_table(
        "plans",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("planning_mode", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("total_estimated_cost", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("sustainability_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("is_selected", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_plans_id"), "plans", ["id"], unique=False)
    op.create_index(op.f("ix_plans_event_id"), "plans", ["event_id"], unique=False)
    op.create_index(op.f("ix_plans_planning_mode"), "plans", ["planning_mode"], unique=False)


def downgrade() -> None:
    op.drop_table("plans")
    op.drop_table("assumptions")
    op.drop_table("constraints")
    op.drop_table("cost_items")
    op.drop_table("budgets")
    op.drop_table("events")
