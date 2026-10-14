"""seed_baseline_assumptions

Revision ID: 002_seed_baseline_assumptions
Revises: 001_initial_schema
Create Date: 2026-10-14 18:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "002_seed_baseline_assumptions"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

BASELINE_ASSUMPTIONS = [
    # Food Participation Rates
    {"category": "FOOD", "parameter": "meal_participation_rate_breakfast", "value": "0.85", "unit": "ratio", "description": "Expected breakfast attendance ratio"},
    {"category": "FOOD", "parameter": "meal_participation_rate_lunch", "value": "0.90", "unit": "ratio", "description": "Expected lunch attendance ratio"},
    {"category": "FOOD", "parameter": "meal_participation_rate_dinner", "value": "0.80", "unit": "ratio", "description": "Expected dinner attendance ratio"},
    {"category": "FOOD", "parameter": "meal_participation_rate_snacks", "value": "0.75", "unit": "ratio", "description": "Expected snacks and tea attendance ratio"},
    {"category": "FOOD", "parameter": "meal_participation_rate_high_tea", "value": "0.75", "unit": "ratio", "description": "Expected high tea attendance ratio"},
    {"category": "FOOD", "parameter": "meal_participation_rate_refreshments", "value": "0.80", "unit": "ratio", "description": "Expected refreshments attendance ratio"},
    {"category": "FOOD", "parameter": "meal_participation_rate_default", "value": "0.85", "unit": "ratio", "description": "Fallback meal participation rate"},

    # Food Unit Costs (INR)
    {"category": "FOOD", "parameter": "meal_cost_per_serving_breakfast", "value": "80.00", "unit": "INR/serving", "description": "Standard breakfast cost per portion"},
    {"category": "FOOD", "parameter": "meal_cost_per_serving_lunch", "value": "140.00", "unit": "INR/serving", "description": "Standard lunch cost per portion"},
    {"category": "FOOD", "parameter": "meal_cost_per_serving_dinner", "value": "160.00", "unit": "INR/serving", "description": "Standard dinner cost per portion"},
    {"category": "FOOD", "parameter": "meal_cost_per_serving_snacks", "value": "50.00", "unit": "INR/serving", "description": "Standard snacks cost per portion"},
    {"category": "FOOD", "parameter": "meal_cost_per_serving_high_tea", "value": "60.00", "unit": "INR/serving", "description": "Standard high tea cost per portion"},
    {"category": "FOOD", "parameter": "meal_cost_per_serving_refreshments", "value": "40.00", "unit": "INR/serving", "description": "Standard refreshment cost per portion"},
    {"category": "FOOD", "parameter": "meal_cost_per_serving_default", "value": "120.00", "unit": "INR/serving", "description": "Fallback meal cost per portion"},

    # Food Waste & Portion Parameters
    {"category": "FOOD", "parameter": "vegetarian_ratio", "value": "0.70", "unit": "ratio", "description": "Default vegetarian portion ratio for mixed dietary preference"},
    {"category": "FOOD", "parameter": "food_waste_percentage", "value": "0.12", "unit": "ratio", "description": "Anticipated surplus buffer waste percentage (12%)"},
    {"category": "FOOD", "parameter": "food_serving_weight_kg_default", "value": "0.35", "unit": "kg/serving", "description": "Average meal portion weight in kilograms"},
    {"category": "FOOD", "parameter": "food_participation_attrition_buffer_rate", "value": "0.10", "unit": "ratio", "description": "Attendance safety margin for catering preparation"},

    # Waste Packaging: Per Person / Per Meal
    {"category": "WASTE", "parameter": "packaging_plate_per_person", "value": "1.0", "unit": "items/person", "description": "Plates required per attendee"},
    {"category": "WASTE", "parameter": "packaging_plate_per_meal", "value": "1.0", "unit": "items/meal", "description": "Plates required per meal per attendee"},
    {"category": "WASTE", "parameter": "packaging_cup_per_person", "value": "2.0", "unit": "items/person", "description": "Cups required per attendee"},
    {"category": "WASTE", "parameter": "packaging_cup_per_meal", "value": "1.0", "unit": "items/meal", "description": "Cups required per meal per attendee"},
    {"category": "WASTE", "parameter": "packaging_spoon_per_person", "value": "1.0", "unit": "items/person", "description": "Spoons required per attendee"},
    {"category": "WASTE", "parameter": "packaging_spoon_per_meal", "value": "1.0", "unit": "items/meal", "description": "Spoons required per meal per attendee"},
    {"category": "WASTE", "parameter": "packaging_fork_per_person", "value": "1.0", "unit": "items/person", "description": "Forks required per attendee"},
    {"category": "WASTE", "parameter": "packaging_fork_per_meal", "value": "1.0", "unit": "items/meal", "description": "Forks required per meal per attendee"},
    {"category": "WASTE", "parameter": "packaging_glass_per_person", "value": "1.0", "unit": "items/person", "description": "Glasses required per attendee"},
    {"category": "WASTE", "parameter": "packaging_glass_per_meal", "value": "1.0", "unit": "items/meal", "description": "Glasses required per meal per attendee"},

    # Waste Packaging: Reusable vs Single-Use Split Ratios
    {"category": "WASTE", "parameter": "reusable_ratio_plate", "value": "0.50", "unit": "ratio", "description": "Baseline reusable plate ratio"},
    {"category": "WASTE", "parameter": "single_use_ratio_plate", "value": "0.50", "unit": "ratio", "description": "Baseline single-use plate ratio"},
    {"category": "WASTE", "parameter": "reusable_ratio_cup", "value": "0.40", "unit": "ratio", "description": "Baseline reusable cup ratio"},
    {"category": "WASTE", "parameter": "single_use_ratio_cup", "value": "0.60", "unit": "ratio", "description": "Baseline single-use cup ratio"},
    {"category": "WASTE", "parameter": "reusable_ratio_spoon", "value": "0.50", "unit": "ratio", "description": "Baseline reusable spoon ratio"},
    {"category": "WASTE", "parameter": "single_use_ratio_spoon", "value": "0.50", "unit": "ratio", "description": "Baseline single-use spoon ratio"},
    {"category": "WASTE", "parameter": "reusable_ratio_fork", "value": "0.50", "unit": "ratio", "description": "Baseline reusable fork ratio"},
    {"category": "WASTE", "parameter": "single_use_ratio_fork", "value": "0.50", "unit": "ratio", "description": "Baseline single-use fork ratio"},
    {"category": "WASTE", "parameter": "reusable_ratio_glass", "value": "0.60", "unit": "ratio", "description": "Baseline reusable glass ratio"},
    {"category": "WASTE", "parameter": "single_use_ratio_glass", "value": "0.40", "unit": "ratio", "description": "Baseline single-use glass ratio"},

    # Plastic Items
    {"category": "WASTE", "parameter": "plastic_water_bottle_per_person", "value": "1.0", "unit": "items/person", "description": "Single-use plastic water bottles per person"},
    {"category": "WASTE", "parameter": "plastic_bag_per_person", "value": "0.20", "unit": "items/person", "description": "Plastic registration bags per attendee"},
    {"category": "WASTE", "parameter": "plastic_cup_per_person", "value": "1.0", "unit": "items/person", "description": "Plastic beverage cups per attendee"},
    {"category": "WASTE", "parameter": "plastic_wrapper_per_meal", "value": "1.0", "unit": "items/meal", "description": "Packaged food wrappers per meal"},

    # Other Waste Items (Decorations, Containers)
    {"category": "WASTE", "parameter": "other_decorations_per_event", "value": "15.0", "unit": "items/event", "description": "Default banners, signage, and display decoration items"},
    {"category": "WASTE", "parameter": "decorations_per_event", "value": "15.0", "unit": "items/event", "description": "Default banners, signage, and display decoration items"},
    {"category": "WASTE", "parameter": "other_containers_per_event", "value": "20.0", "unit": "items/event", "description": "Default food containers and storage boxes per event"},
    {"category": "WASTE", "parameter": "containers_per_event", "value": "20.0", "unit": "items/event", "description": "Default food containers and storage boxes per event"},
]


def upgrade() -> None:
    assumptions_table = sa.table(
        "assumptions",
        sa.column("event_id", sa.Integer),
        sa.column("category", sa.String),
        sa.column("parameter", sa.String),
        sa.column("value", sa.String),
        sa.column("unit", sa.String),
        sa.column("source_type", sa.String),
        sa.column("description", sa.Text),
        sa.column("reference_notes", sa.Text),
    )

    rows = []
    for item in BASELINE_ASSUMPTIONS:
        rows.append({
            "event_id": None,
            "category": item["category"],
            "parameter": item["parameter"],
            "value": item["value"],
            "unit": item["unit"],
            "source_type": "REFERENCE",
            "description": item["description"],
            "reference_notes": "Standard campus reference benchmark",
        })

    op.bulk_insert(assumptions_table, rows)


def downgrade() -> None:
    op.execute("DELETE FROM assumptions WHERE event_id IS NULL AND source_type = 'REFERENCE'")
