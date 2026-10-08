"""
Integration tests for Food Planning Module API (/api/v1/planning/food).
"""

from decimal import Decimal


def test_api_food_planning_e2e(client):
    """
    Test complete end-to-end food planning calculation via API.
    Uses assumptions stored in the database.
    """
    # 1. Create an event with a budget
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "State Hackathon 2026",
            "event_type": "HACKATHON",
            "expected_attendees": 150,
            "duration_days": 2,
            "budget": {
                "total_budget": "50000.00",
                "currency": "INR",
            },
        },
    )
    assert event_res.status_code == 201
    event_id = event_res.json()["id"]

    # 2. Add global assumptions for food
    assumptions_to_create = [
        {"category": "FOOD", "parameter": "meal_participation_rate_lunch", "value": "0.85", "unit": "ratio"},
        {"category": "FOOD", "parameter": "meal_participation_rate_dinner", "value": "0.75", "unit": "ratio"},
        {"category": "FOOD", "parameter": "meal_cost_per_serving_lunch", "value": "120.00", "unit": "INR/serving"},
        {"category": "FOOD", "parameter": "meal_cost_per_serving_dinner", "value": "150.00", "unit": "INR/serving"},
        {"category": "FOOD", "parameter": "food_waste_percentage", "value": "0.12", "unit": "ratio"},
        {"category": "FOOD", "parameter": "food_serving_weight_kg_default", "value": "0.40", "unit": "kg/serving"},
        {"category": "FOOD", "parameter": "food_participation_attrition_buffer_rate", "value": "0.15", "unit": "ratio"},
    ]
    for a in assumptions_to_create:
        client.post("/api/v1/assumptions", json=a)

    # 3. Call Food Planning API
    request_payload = {
        "event_id": event_id,
        "meals": [
            {"meal_type": "LUNCH", "day": 1},
            {"meal_type": "DINNER", "day": 1},
        ],
        "default_dietary_preference": "MIXED",
        "vegetarian_ratio": "0.70",
    }

    res = client.post("/api/v1/planning/food", json=request_payload)
    assert res.status_code == 200
    data = res.json()

    # Verify response structure
    assert data["event_id"] == event_id
    assert data["event_name"] == "State Hackathon 2026"
    assert data["status"] == "COMPLETE"
    assert len(data["meal_plans"]) == 2

    # Lunch: 150 * 0.85 = 127.5 -> 128 servings
    lunch = next(m for m in data["meal_plans"] if m["meal_type"] == "LUNCH")
    assert lunch["estimated_servings"] == 128
    # Dinner: 150 * 0.75 = 112.5 -> 113 servings
    dinner = next(m for m in data["meal_plans"] if m["meal_type"] == "DINNER")
    assert dinner["estimated_servings"] == 113

    # Cost summary
    # Lunch cost: 128 * 120 = 15360, Dinner cost: 113 * 150 = 16950 -> Total = 32310
    assert float(data["cost_summary"]["estimated_total_cost"]) == 32310.00
    assert data["cost_summary"]["cost_status"] == "ESTIMATED"
    assert data["cost_summary"]["pricing_approach"] == "ASSUMPTION_BASED"
    assert float(data["cost_summary"]["food_budget"]) == 50000.00
    assert data["cost_summary"]["is_over_budget"] is False

    # Waste summary
    assert data["waste_summary"]["waste_status"] == "COMPLETE"
    assert data["waste_summary"]["estimated_waste_servings"] is not None
    assert data["waste_summary"]["estimated_waste_kg"] is not None

    # Recommendations and Provenance
    # Buffer recommendation appears (Lunch participation 0.85 >= 1.0 - 0.15 = 0.85)
    assert len(data["recommendations"]) == 1
    rec = data["recommendations"][0]
    assert rec["code"] == "REC_FOOD_BUFFER_CALIBRATION"
    assert "College events typically observe" not in rec["description"]
    assert "prevents over-ordering" not in rec["description"]

    # Removed recommendations are absent
    rec_codes = [r["code"] for r in data["recommendations"]]
    assert "REC_FOOD_DONATION_PARTNER" not in rec_codes
    assert "REC_FOOD_REUSABLE_SERVICEWARE" not in rec_codes

    # Buffer assumption is included in assumptions_used
    used_params = [a["parameter"] for a in data["assumptions_used"]]
    assert "food_participation_attrition_buffer_rate" in used_params


def test_api_event_specific_assumption_precedence(client):
    """
    Test that an event-specific food assumption takes precedence
    over a global assumption when planning food.
    """
    # 1. Create Event
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Department Farewell",
            "event_type": "FAREWELL",
            "expected_attendees": 100,
            "duration_days": 1,
        },
    )
    event_id = event_res.json()["id"]

    # 2. Create Global Lunch Cost = 100
    client.post(
        "/api/v1/assumptions",
        json={
            "category": "FOOD",
            "parameter": "meal_cost_per_serving_lunch",
            "value": "100.00",
            "unit": "INR",
        },
    )
    # Global Participation = 1.0
    client.post(
        "/api/v1/assumptions",
        json={
            "category": "FOOD",
            "parameter": "meal_participation_rate_lunch",
            "value": "1.0",
            "unit": "ratio",
        },
    )

    # 3. Create Event-Specific Lunch Cost Override = 250
    client.post(
        "/api/v1/assumptions",
        json={
            "event_id": event_id,
            "category": "FOOD",
            "parameter": "meal_cost_per_serving_lunch",
            "value": "250.00",
            "unit": "INR",
            "source_type": "USER_PROVIDED",
        },
    )

    # 4. Plan food for this event
    res = client.post(
        "/api/v1/planning/food",
        json={
            "event_id": event_id,
            "meals": [{"meal_type": "LUNCH"}],
        },
    )
    assert res.status_code == 200
    data = res.json()

    # 100 servings * 250 = 25,000 (NOT 100 * 100 = 10,000)
    assert float(data["cost_summary"]["estimated_total_cost"]) == 25000.00
    meal = data["meal_plans"][0]
    assert float(meal["unit_cost"]) == 250.00


def test_api_non_existent_event_returns_404(client):
    """Test planning food for a non-existent event returns 404."""
    res = client.post(
        "/api/v1/planning/food",
        json={
            "event_id": 999999,
            "meals": [{"meal_type": "LUNCH"}],
        },
    )
    assert res.status_code == 404
    assert "does not exist" in res.json()["detail"].lower()


def test_api_invalid_meal_input_returns_422(client):
    """Test validation errors for invalid food planning inputs."""
    # Negative food budget
    res = client.post(
        "/api/v1/planning/food",
        json={
            "event_id": 1,
            "food_budget": -500,
            "meals": [{"meal_type": "LUNCH"}],
        },
    )
    assert res.status_code == 422

    # Invalid day (day <= 0)
    res = client.post(
        "/api/v1/planning/food",
        json={
            "event_id": 1,
            "meals": [{"meal_type": "LUNCH", "day": 0}],
        },
    )
    assert res.status_code == 422


def test_api_food_budget_deficit_recommendation(client):
    """
    Test that REC_FOOD_BUDGET_DEFICIT appears when food cost exceeds budget,
    and contains accurate, traceable amounts without unsupported claims.
    """
    # 1. Create an event with a tight budget
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Tight Budget Seminar",
            "event_type": "SEMINAR",
            "expected_attendees": 100,
            "duration_days": 1,
            "budget": {
                "total_budget": "10000.00",
                "currency": "INR",
            },
        },
    )
    assert event_res.status_code == 201
    event_id = event_res.json()["id"]

    # 2. Plan food with a known cost of 25,000 (exceeds budget by 15,000)
    res = client.post(
        "/api/v1/planning/food",
        json={
            "event_id": event_id,
            "meals": [{"meal_type": "LUNCH"}],
            "known_total_cost": "25000.00",
        },
    )
    assert res.status_code == 200
    data = res.json()

    # Budget deficit recommendation must appear
    rec_codes = [r["code"] for r in data["recommendations"]]
    assert "REC_FOOD_BUDGET_DEFICIT" in rec_codes

    deficit_rec = next(r for r in data["recommendations"] if r["code"] == "REC_FOOD_BUDGET_DEFICIT")
    assert "25,000.00" in deficit_rec["description"]
    assert "10,000.00" in deficit_rec["description"]
    assert "15,000.00" in deficit_rec["description"]
    assert deficit_rec["impact"] == "Cost Optimization"


def test_api_buffer_recommendation_missing_when_assumption_absent(client):
    """
    Test that REC_FOOD_BUFFER_CALIBRATION does NOT appear when the
    food_participation_attrition_buffer_rate assumption is missing.
    """
    # Create event within budget
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Generous Budget Fest",
            "event_type": "FEST",
            "expected_attendees": 50,
            "duration_days": 1,
            "budget": {
                "total_budget": "100000.00",
                "currency": "INR",
            },
        },
    )
    event_id = event_res.json()["id"]

    res = client.post(
        "/api/v1/planning/food",
        json={
            "event_id": event_id,
            "meals": [{"meal_type": "LUNCH", "user_participation_rate": "1.0", "user_unit_cost": "100.00"}],
        },
    )
    assert res.status_code == 200
    data = res.json()

    # No buffer assumption exists, so recommendations should be empty
    rec_codes = [r["code"] for r in data["recommendations"]]
    assert "REC_FOOD_BUFFER_CALIBRATION" not in rec_codes
    assert "REC_FOOD_BUDGET_DEFICIT" not in rec_codes
    assert len(data["recommendations"]) == 0

