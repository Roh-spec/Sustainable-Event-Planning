"""
Standalone script to seed baseline reference assumptions into the PostgreSQL database.
Can be executed locally or inside Docker container:
    python scripts/database/seed_assumptions.py
"""

import sys
import os

# Add root directory to sys.path so backend modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal, engine
from backend.app.models.assumption import Assumption

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


def seed_assumptions():
    db: Session = SessionLocal()
    inserted = 0
    skipped = 0

    try:
        for item in BASELINE_ASSUMPTIONS:
            existing = (
                db.query(Assumption)
                .filter(
                    Assumption.event_id.is_(None),
                    Assumption.parameter == item["parameter"],
                )
                .first()
            )

            if existing is None:
                new_assumption = Assumption(
                    event_id=None,
                    category=item["category"],
                    parameter=item["parameter"],
                    value=item["value"],
                    unit=item["unit"],
                    source_type="REFERENCE",
                    description=item["description"],
                    reference_notes="Standard campus reference benchmark",
                )
                db.add(new_assumption)
                inserted += 1
            else:
                skipped += 1

        db.commit()
        print(f"Successfully seeded {inserted} baseline assumptions ({skipped} already existed).")
    except Exception as e:
        db.rollback()
        print(f"Error seeding assumptions: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_assumptions()
