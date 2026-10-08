def test_create_event_without_budget(client):
    """Test successful event creation without a budget."""
    payload = {
        "name": "Tech Symposium",
        "event_type": "CONFERENCE",
        "expected_attendees": 120,
        "duration_days": 1,
        "location": "Seminar Hall A",
    }
    response = client.post("/api/v1/events", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == "Tech Symposium"
    assert data["event_type"] == "CONFERENCE"
    assert data["expected_attendees"] == 120
    assert data["duration_days"] == 1
    assert data["location"] == "Seminar Hall A"
    assert data["budget"] is None


def test_create_event_with_budget(client):
    """Test successful event creation with an associated budget."""
    payload = {
        "name": "Cultural Fest 2026",
        "event_type": "CULTURAL_FEST",
        "expected_attendees": 500,
        "duration_days": 3,
        "location": "Open Air Amphitheatre",
        "budget": {
            "total_budget": "300000.00",
            "currency": "INR",
            "status": "APPROVED",
        },
    }
    response = client.post("/api/v1/events", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == "Cultural Fest 2026"
    assert data["budget"] is not None
    assert float(data["budget"]["total_budget"]) == 300000.00
    assert data["budget"]["currency"] == "INR"


def test_create_event_invalid_payload_fails(client):
    """Test that invalid payload returns 422 Unprocessable Entity."""
    # expected_attendees <= 0
    payload = {
        "name": "Invalid Attendees Event",
        "event_type": "WORKSHOP",
        "expected_attendees": 0,
        "duration_days": 1,
    }
    response = client.post("/api/v1/events", json=payload)
    assert response.status_code == 422


def test_get_existing_event(client):
    """Test retrieving an existing event by ID."""
    # Create event first
    create_payload = {
        "name": "Robotics Workshop",
        "event_type": "WORKSHOP",
        "expected_attendees": 40,
        "duration_days": 1,
        "location": "Lab 3",
    }
    create_res = client.post("/api/v1/events", json=create_payload)
    assert create_res.status_code == 201
    event_id = create_res.json()["id"]

    # Fetch event
    get_res = client.get(f"/api/v1/events/{event_id}")
    assert get_res.status_code == 200
    event_data = get_res.json()
    assert event_data["id"] == event_id
    assert event_data["name"] == "Robotics Workshop"


def test_get_missing_event_returns_404(client):
    """Test retrieving a non-existent event returns 404."""
    response = client.get("/api/v1/events/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_events(client):
    """Test listing events returns an array."""
    # Create an event
    payload = {
        "name": "Department Seminar",
        "event_type": "DEPARTMENT_EVENT",
        "expected_attendees": 60,
        "duration_days": 1,
    }
    client.post("/api/v1/events", json=payload)

    response = client.get("/api/v1/events")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1
