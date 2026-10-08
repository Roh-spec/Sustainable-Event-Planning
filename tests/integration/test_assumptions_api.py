"""
Integration tests for the Assumptions API endpoints (/api/v1/assumptions).
"""


def test_create_and_get_global_assumption(client):
    """Test creating and retrieving a global assumption."""
    payload = {
        "category": "WATER",
        "parameter": "baseline_water_allowance",
        "value": "6",
        "unit": "litres/day",
        "source_type": "ASSUMED",
        "confidence": "0.80",
    }
    post_res = client.post("/api/v1/assumptions", json=payload)
    assert post_res.status_code == 201
    created = post_res.json()
    assert created["id"] is not None
    assert created["event_id"] is None
    assert created["parameter"] == "baseline_water_allowance"
    assert created["value"] == "6"

    # Retrieve by ID
    get_res = client.get(f"/api/v1/assumptions/{created['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == created["id"]
    assert get_res.json()["parameter"] == "baseline_water_allowance"


def test_create_event_specific_assumption(client):
    """Test creating an assumption scoped to a specific event."""
    # Create event first
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Robotics Fest",
            "event_type": "TECH_FEST",
            "expected_attendees": 300,
            "duration_days": 2,
        },
    )
    assert event_res.status_code == 201
    event_id = event_res.json()["id"]

    # Create event-specific assumption
    payload = {
        "event_id": event_id,
        "category": "FOOD",
        "parameter": "lunch_budget_per_head",
        "value": "150",
        "unit": "INR/person",
        "source_type": "USER_PROVIDED",
    }
    post_res = client.post("/api/v1/assumptions", json=payload)
    assert post_res.status_code == 201
    created = post_res.json()
    assert created["event_id"] == event_id
    assert created["value"] == "150"


def test_create_assumption_with_invalid_event_id_fails(client):
    """Test creating an assumption with non-existent event_id fails with 404."""
    payload = {
        "event_id": 999999,
        "category": "WASTE",
        "parameter": "waste_per_person",
        "value": "0.5",
        "unit": "kg/day",
        "source_type": "ASSUMED",
    }
    post_res = client.post("/api/v1/assumptions", json=payload)
    assert post_res.status_code == 404
    assert "not exist" in post_res.json()["detail"].lower()


def test_api_resolve_assumption_precedence(client):
    """
    Test resolving an assumption via the API endpoint.
    Verifies that event-specific overrides global.
    """
    # 1. Create an event
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Cultural Night",
            "event_type": "CULTURAL_FEST",
            "expected_attendees": 400,
            "duration_days": 1,
        },
    )
    event_id = event_res.json()["id"]

    # 2. Create Global assumption: water = 5
    client.post(
        "/api/v1/assumptions",
        json={
            "category": "WATER",
            "parameter": "api_test_water_param",
            "value": "5",
            "unit": "L/person",
            "source_type": "REFERENCE",
        },
    )

    # 3. Create Event-specific assumption: water = 3
    client.post(
        "/api/v1/assumptions",
        json={
            "event_id": event_id,
            "category": "WATER",
            "parameter": "api_test_water_param",
            "value": "3",
            "unit": "L/person",
            "source_type": "USER_PROVIDED",
        },
    )

    # 4. Resolve without event_id -> should return global (value 5)
    global_res = client.get("/api/v1/assumptions/resolve?parameter=api_test_water_param")
    assert global_res.status_code == 200
    assert global_res.json()["value"] == "5"
    assert global_res.json()["scope"] == "GLOBAL"
    assert global_res.json()["source_type"] == "REFERENCE"

    # 5. Resolve with event_id -> should return event-specific override (value 3)
    event_resolve_res = client.get(
        f"/api/v1/assumptions/resolve?parameter=api_test_water_param&event_id={event_id}"
    )
    assert event_resolve_res.status_code == 200
    assert event_resolve_res.json()["value"] == "3"
    assert event_resolve_res.json()["scope"] == "EVENT"
    assert event_resolve_res.json()["source_type"] == "USER_PROVIDED"


def test_api_resolve_missing_assumption(client):
    """Test resolving a non-existent parameter returns 404 by default."""
    res = client.get("/api/v1/assumptions/resolve?parameter=non_existent_parameter_xyz")
    assert res.status_code == 404
    assert "missing assumption" in res.json()["detail"].lower()

    # With allow_missing=true -> returns 200 with is_resolved=False
    res_allow = client.get(
        "/api/v1/assumptions/resolve?parameter=non_existent_parameter_xyz&allow_missing=true"
    )
    assert res_allow.status_code == 200
    data = res_allow.json()
    assert data["is_resolved"] is False
    assert data["value"] is None
    assert data["scope"] is None


def test_update_and_delete_assumption(client):
    """Test updating and deleting an assumption."""
    # Create assumption
    create_res = client.post(
        "/api/v1/assumptions",
        json={
            "category": "ENERGY",
            "parameter": "temp_generator_fuel_rate",
            "value": "10",
            "unit": "L/hr",
            "source_type": "ASSUMED",
        },
    )
    assump_id = create_res.json()["id"]

    # Update value
    patch_res = client.patch(
        f"/api/v1/assumptions/{assump_id}",
        json={"value": "12", "confidence": "0.95"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["value"] == "12"
    assert float(patch_res.json()["confidence"]) == 0.95

    # Delete
    del_res = client.delete(f"/api/v1/assumptions/{assump_id}")
    assert del_res.status_code == 204

    # Confirm not found
    get_res = client.get(f"/api/v1/assumptions/{assump_id}")
    assert get_res.status_code == 404
