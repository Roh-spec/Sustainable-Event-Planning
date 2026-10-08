"""
Integration tests for Waste Planning Module API (/api/v1/planning/waste).
"""

from decimal import Decimal


def test_api_waste_planning_full_flow(client):
    """
    Test complete end-to-end waste planning calculation via REST API
    using database-persisted assumptions.
    """
    # 1. Create an event
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "State Environment Conference",
            "event_type": "CONFERENCE",
            "expected_attendees": 200,
            "duration_days": 1,
        },
    )
    assert event_res.status_code == 201
    event_id = event_res.json()["id"]

    # 2. Add global assumptions for waste
    assumptions = [
        {"category": "WASTE", "parameter": "packaging_plate_per_person", "value": "1", "unit": "items/person"},
        {"category": "WASTE", "parameter": "reusable_ratio_plate", "value": "0.75", "unit": "ratio"},
        {"category": "WASTE", "parameter": "plastic_water_bottle_per_person", "value": "1", "unit": "items/person"},
    ]
    for a in assumptions:
        client.post("/api/v1/assumptions", json=a)

    # 3. Call Waste Planning API
    request_payload = {
        "event_id": event_id,
        "food_waste": {
            "estimated_food_waste_servings": "50.00",
            "estimated_food_waste_kg": "20.00",
            "user_override_servings": "40.00",
        },
        "packaging_items": [
            {
                "item_type": "PLATE",
                "calculation_basis": "PER_PERSON",
            }
        ],
        "plastic_items": [
            {
                "item_type": "WATER_BOTTLE",
                "calculation_basis": "PER_PERSON",
            }
        ],
        "other_waste_items": [
            {
                "name": "Direction Signs",
                "category": "DECORATIONS",
                "calculation_basis": "CUSTOM",
                "quantity": "10",
                "unit": "boards",
            }
        ],
    }

    res = client.post("/api/v1/planning/waste", json=request_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["event_id"] == event_id
    assert data["status"] == "COMPLETE"

    # Food waste verification
    fw = data["food_waste"]
    assert float(fw["estimated_servings"]) == 50.00
    assert float(fw["planning_servings"]) == 40.00
    assert fw["planning_source"] == "USER_PROVIDED"

    # Packaging verification: 200 * 1 = 200 plates, 75% reusable = 150, 50 single-use
    assert len(data["packaging_waste"]["items"]) == 1
    plate = data["packaging_waste"]["items"][0]
    assert float(plate["total_quantity"]) == 200.00
    assert float(plate["reusable_quantity"]) == 150.00
    assert float(plate["single_use_quantity"]) == 50.00
    assert plate["is_split_resolved"] is True

    # Plastic verification: 200 * 1 = 200 bottles
    assert len(data["plastic_waste"]["items"]) == 1
    bottle = data["plastic_waste"]["items"][0]
    assert float(bottle["planning_quantity"]) == 200.00

    # Other waste verification
    assert len(data["other_waste"]["items"]) == 1
    sign = data["other_waste"]["items"][0]
    assert float(sign["quantity"]) == 10.00

    # Provenance
    used_params = [a["parameter"] for a in data["assumptions_used"]]
    assert "packaging_plate_per_person" in used_params
    assert "reusable_ratio_plate" in used_params
    assert "plastic_water_bottle_per_person" in used_params


def test_api_waste_planning_with_food_module_integration(client):
    """
    Test that the Waste Module automatically triggers the Food Module
    when food_plan_request is embedded, consuming food waste without recalculating.
    """
    # 1. Create event
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Food Waste Integration Fest",
            "event_type": "FEST",
            "expected_attendees": 100,
            "duration_days": 1,
        },
    )
    event_id = event_res.json()["id"]

    # 2. Add food assumptions
    food_assumptions = [
        {"category": "FOOD", "parameter": "meal_participation_rate_lunch", "value": "1.0", "unit": "ratio"},
        {"category": "FOOD", "parameter": "meal_cost_per_serving_lunch", "value": "100.00", "unit": "INR"},
        {"category": "FOOD", "parameter": "food_waste_percentage", "value": "0.15", "unit": "ratio"},
        {"category": "FOOD", "parameter": "food_serving_weight_kg_default", "value": "0.40", "unit": "kg"},
    ]
    for a in food_assumptions:
        client.post("/api/v1/assumptions", json=a)

    # 3. Call Waste planning with embedded FoodPlanRequest
    waste_res = client.post(
        "/api/v1/planning/waste",
        json={
            "event_id": event_id,
            "food_waste": {
                "food_plan_request": {
                    "event_id": event_id,
                    "meals": [{"meal_type": "LUNCH", "day": 1}],
                }
            },
        },
    )
    assert waste_res.status_code == 200
    data = waste_res.json()

    # 100 attendees * 1.0 participation = 100 servings; 15% waste = 15 servings
    fw = data["food_waste"]
    assert float(fw["estimated_servings"]) == 15.00
    assert float(fw["estimated_kg"]) == 6.00  # 15 * 0.40 = 6.00 kg
    assert float(fw["planning_servings"]) == 15.00
    assert fw["planning_source"] == "ESTIMATED"


def test_api_waste_event_specific_assumption_precedence(client):
    """
    Test that an event-specific waste assumption takes precedence
    over a global assumption.
    """
    # 1. Create event
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Precedence Workshop",
            "event_type": "WORKSHOP",
            "expected_attendees": 100,
            "duration_days": 1,
        },
    )
    event_id = event_res.json()["id"]

    # 2. Create Global Assumption: 1 bottle per person
    client.post(
        "/api/v1/assumptions",
        json={
            "category": "WASTE",
            "parameter": "plastic_water_bottle_per_person",
            "value": "1",
            "unit": "items/person",
        },
    )

    # 3. Create Event-Specific Assumption: 3 bottles per person
    client.post(
        "/api/v1/assumptions",
        json={
            "event_id": event_id,
            "category": "WASTE",
            "parameter": "plastic_water_bottle_per_person",
            "value": "3",
            "unit": "items/person",
            "source_type": "USER_PROVIDED",
        },
    )

    # 4. Plan waste
    res = client.post(
        "/api/v1/planning/waste",
        json={
            "event_id": event_id,
            "plastic_items": [
                {
                    "item_type": "WATER_BOTTLE",
                    "calculation_basis": "PER_PERSON",
                }
            ],
        },
    )
    assert res.status_code == 200
    data = res.json()

    bottle = data["plastic_waste"]["items"][0]
    # 100 attendees * 3 = 300 bottles (NOT 100 * 1 = 100)
    assert float(bottle["planning_quantity"]) == 300.00
    assert "3 per person" in bottle["explanation"]


def test_api_waste_missing_assumptions_handling(client):
    """
    Test that unconfigured assumptions result in PARTIAL status
    and explicit missing_assumptions reporting without fabricating values.
    """
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Missing Data Event",
            "event_type": "SEMINAR",
            "expected_attendees": 80,
            "duration_days": 1,
        },
    )
    event_id = event_res.json()["id"]

    # Request items with no assumptions configured
    res = client.post(
        "/api/v1/planning/waste",
        json={
            "event_id": event_id,
            "packaging_items": [
                {
                    "item_type": "FORK",
                    "calculation_basis": "PER_PERSON",
                }
            ],
        },
    )
    assert res.status_code == 200
    data = res.json()

    assert data["status"] in ["PARTIAL", "BLOCKED"]
    assert "packaging_fork_per_person" in data["missing_assumptions"]
    assert len(data["warnings"]) > 0

    # Missing assumption recommendation appears
    rec_codes = [r["code"] for r in data["recommendations"]]
    assert "REC_WASTE_MISSING_ASSUMPTIONS" in rec_codes


def test_api_waste_non_existent_event_returns_404(client):
    """Test planning waste for non-existent event returns 404."""
    res = client.post(
        "/api/v1/planning/waste",
        json={
            "event_id": 999999,
        },
    )
    assert res.status_code == 404
    assert "does not exist" in res.json()["detail"].lower()


def test_api_waste_invalid_input_returns_422(client):
    """Test validation errors for invalid waste planning inputs."""
    # Negative attendee count
    res = client.post(
        "/api/v1/planning/waste",
        json={
            "event_id": 1,
            "attendee_count": -50,
        },
    )
    assert res.status_code == 422

    # Invalid packaging item split: reusable + single_use > total
    res = client.post(
        "/api/v1/planning/waste",
        json={
            "event_id": 1,
            "packaging_items": [
                {
                    "item_type": "PLATE",
                    "calculation_basis": "CUSTOM",
                    "user_total_quantity": 100,
                    "user_reusable_quantity": 70,
                    "user_single_use_quantity": 40,  # 70 + 40 = 110 > 100
                }
            ],
        },
    )
    assert res.status_code == 422

