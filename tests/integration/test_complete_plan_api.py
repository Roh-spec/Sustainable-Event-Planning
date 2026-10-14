"""
Integration tests for the Complete Event Plan REST API (/api/v1/planning/complete-plan).
Tests:
- Valid complete-plan generation with selected plan reuse
- Non-existent event handling (404)
- Invalid time windows (422)
- Selected plan configuration handling (High reusability, plastic-free)
- Result reuse from food and waste modules
- Budget feasibility and deficit handling
- Hard constraint preservation
- Missing estimates handling (None vs 0)
- Multi-day event schedules
- Short window warnings
"""

from decimal import Decimal
import pytest


def _create_test_event(client, name="Campus Tech Summit", budget_amount="50000.00", duration_days=1):
    res = client.post(
        "/api/v1/events",
        json={
            "name": name,
            "event_type": "CONFERENCE",
            "expected_attendees": 100,
            "duration_days": duration_days,
            "location": "Main Auditorium",
            "budget": {
                "total_budget": budget_amount,
                "currency": "INR",
            },
        },
    )
    assert res.status_code == 201
    return res.json()["id"]


def test_generate_complete_plan_success(client):
    """
    Test successful generation of a complete event plan reusing
    selected plan metrics, timetable, checklist, resources, and budget.
    """
    event_id = _create_test_event(client, budget_amount="50000.00")

    payload = {
        "event_id": event_id,
        "event_date": "2026-11-20",
        "start_time": "09:00",
        "end_time": "17:00",
        "selected_meal_types": ["LUNCH", "SNACKS"],
        "selected_plan": {
            "plan_id": "plan_reusable_tier",
            "name": "High-Reusability Alternative",
            "planning_objective": "SUSTAINABILITY_FOCUSED",
            "candidate_id": "cand_max_reusable",
            "feasible": True,
            "estimated_cost": "42000.00",
            "food_metrics": {
                "estimated_servings": 100,
                "estimated_cost": "30000.00",
                "estimated_waste_servings": 10,
                "estimated_waste_kg": "3.50",
                "veg_servings": 30,
                "non_veg_servings": 70,
            },
            "waste_metrics": {
                "total_packaging_items": 200,
                "reusable_packaging_items": 200,
                "single_use_packaging_items": 0,
                "reusable_percentage": 100.0,
                "total_plastic_items": 0,
                "total_other_items": 0,
            },
            "sustainability_metrics": [
                {
                    "metric_name": "food_waste_kg",
                    "value": "3.50",
                    "unit": "kg",
                    "source_type": "ESTIMATED",
                    "module": "FOOD",
                }
            ],
            "constraint_result": {
                "feasible": True,
                "hard_constraints_satisfied": True,
                "soft_constraints_relaxed": [],
                "violations": [],
                "budget_satisfied": True,
            },
            "assumptions_used": [
                {
                    "parameter": "food_waste_percentage",
                    "value": "0.10",
                    "unit": "ratio",
                    "source_type": "ASSUMED",
                    "scope": "GLOBAL",
                    "is_resolved": True,
                    "explanation": "Campus benchmark",
                }
            ],
            "tradeoffs": [],
            "explanations": ["100% reusable tableware deployed."],
        },
    }

    res = client.post("/api/v1/planning/complete-plan", json=payload)
    assert res.status_code == 200
    data = res.json()

    # 1. Event Overview
    overview = data["event_overview"]
    assert overview["event_id"] == event_id
    assert overview["name"] == "Campus Tech Summit"
    assert overview["event_type"] == "CONFERENCE"
    assert overview["selected_plan_name"] == "High-Reusability Alternative"
    assert overview["is_feasible"] is True

    # 2. Daily Timetable
    timetable = data["daily_timetable"]
    assert len(timetable) == 1
    assert len(timetable[0]["slots"]) >= 4
    # Check that meals are in timetable
    slot_titles = [s["title"] for s in timetable[0]["slots"]]
    assert any("Lunch" in t for t in slot_titles)

    # 3. Checklist
    checklist = data["checklist"]
    assert len(checklist) >= 10
    phases = {item["phase"] for item in checklist}
    assert "BEFORE_EVENT" in phases
    assert "EVENT_DAY_MORNING" in phases
    assert "DURING_EVENT" in phases
    assert "AFTER_EVENT" in phases

    # 4. Resource Manifest
    resources = data["resource_manifest"]
    assert resources["food_and_catering"]["estimated_servings"] == 100
    assert resources["food_and_catering"]["veg_servings"] == 30
    assert resources["food_and_catering"]["non_veg_servings"] == 70
    assert float(resources["food_and_catering"]["estimated_food_waste_kg"]) == 3.50
    assert float(resources["tableware_and_serving"]["reusable_items"]) == 200.0
    assert float(resources["tableware_and_serving"]["reusable_percentage"]) == 100.0
    assert float(resources["plastic_items"]["estimated_plastic_items"]) == 0.0
    assert len(resources["suggested_equipment"]) >= 2

    # 5. Budget Summary
    budget = data["budget_summary"]
    assert float(budget["total_budget"]) == 50000.00
    assert float(budget["estimated_plan_cost"]) == 42000.00
    assert float(budget["food_cost"]) == 30000.00
    assert float(budget["remaining_contingency"]) == 8000.00
    assert budget["is_budget_feasible"] is True

    # 6. Sustainability Actions
    actions = data["sustainability_actions"]
    assert len(actions) >= 2
    action_types = {a["action_type"] for a in actions}
    assert "REUSABLE_PACKAGING" in action_types
    assert "PLASTIC_ELIMINATION" in action_types

    # 7. Assumptions & Confirmations
    confirmations = data["assumptions_and_confirmations"]["items_requiring_confirmation"]
    assert len(confirmations) >= 3


def test_generate_complete_plan_not_found(client):
    """Test 404 response for non-existent event ID."""
    res = client.post(
        "/api/v1/planning/complete-plan",
        json={
            "event_id": 99999,
            "event_date": "2026-11-20",
            "start_time": "09:00",
            "end_time": "17:00",
        },
    )
    assert res.status_code == 404
    assert "does not exist" in res.json()["detail"]


def test_generate_complete_plan_invalid_time_window(client):
    """Test 422 Unprocessable Entity when end_time <= start_time."""
    event_id = _create_test_event(client)
    res = client.post(
        "/api/v1/planning/complete-plan",
        json={
            "event_id": event_id,
            "event_date": "2026-11-20",
            "start_time": "17:00",
            "end_time": "09:00",  # Invalid
        },
    )
    assert res.status_code == 422


def test_generate_complete_plan_budget_deficit(client):
    """Test handling of budget deficit: marks feasible as False and alerts organizer."""
    event_id = _create_test_event(client, budget_amount="30000.00")

    payload = {
        "event_id": event_id,
        "event_date": "2026-11-20",
        "start_time": "09:00",
        "end_time": "17:00",
        "selected_plan": {
            "plan_id": "plan_expensive",
            "name": "Premium Alternative",
            "planning_objective": "SUSTAINABILITY_FOCUSED",
            "candidate_id": "cand_prem",
            "feasible": True,
            "estimated_cost": "45000.00",  # Exceeds 30000 by 15000
            "constraint_result": {
                "feasible": True,
                "hard_constraints_satisfied": True,
                "soft_constraints_relaxed": [],
                "violations": [],
                "budget_satisfied": False,
            },
        },
    }

    res = client.post("/api/v1/planning/complete-plan", json=payload)
    assert res.status_code == 200
    data = res.json()

    budget = data["budget_summary"]
    assert budget["is_budget_feasible"] is False
    assert float(budget["budget_deficit"]) == 15000.00
    assert data["event_overview"]["is_feasible"] is False

    confirmations = data["assumptions_and_confirmations"]["items_requiring_confirmation"]
    assert any("BUDGET NOTICE" in c for c in confirmations)


def test_generate_complete_plan_hard_constraint_infeasible(client):
    """Test that a plan alternative marked infeasible preserves infeasible state."""
    event_id = _create_test_event(client, budget_amount="60000.00")

    payload = {
        "event_id": event_id,
        "event_date": "2026-11-20",
        "start_time": "09:00",
        "end_time": "17:00",
        "selected_plan": {
            "plan_id": "plan_infeasible",
            "name": "Infeasible Alternative",
            "planning_objective": "BALANCED",
            "candidate_id": "cand_infeasible",
            "feasible": False,  # Hard constraint violated
            "estimated_cost": "40000.00",
            "constraint_result": {
                "feasible": False,
                "hard_constraints_satisfied": False,
                "soft_constraints_relaxed": [],
                "violations": [
                    {
                        "category": "DIETARY",
                        "constraint_type": "REQUIRED",
                        "description": "Vegetarian meal required",
                        "reason": "Selected catering does not meet dietary requirement.",
                    }
                ],
                "budget_satisfied": True,
            },
        },
    }

    res = client.post("/api/v1/planning/complete-plan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["event_overview"]["is_feasible"] is False


def test_generate_complete_plan_missing_estimates(client):
    """
    Test that when food and waste metrics are missing from selected plan,
    missing values are NOT replaced by zero, and provenance is transparent.
    """
    event_id = _create_test_event(client, budget_amount="50000.00")

    payload = {
        "event_id": event_id,
        "event_date": "2026-11-20",
        "start_time": "09:00",
        "end_time": "17:00",
        "selected_plan": {
            "plan_id": "plan_minimal",
            "name": "Minimal Plan",
            "planning_objective": "BALANCED",
            "candidate_id": "cand_min",
            "feasible": True,
            "estimated_cost": "25000.00",
            "food_metrics": None,
            "waste_metrics": None,
            "constraint_result": {
                "feasible": True,
                "hard_constraints_satisfied": True,
                "soft_constraints_relaxed": [],
                "violations": [],
                "budget_satisfied": True,
            },
        },
    }

    res = client.post("/api/v1/planning/complete-plan", json=payload)
    assert res.status_code == 200
    data = res.json()

    food_res = data["resource_manifest"]["food_and_catering"]
    assert food_res["estimated_servings"] is None
    assert food_res["veg_servings"] is None
    assert food_res["estimated_food_waste_kg"] is None
    assert food_res["provenance"] == "Not estimated"

    tableware_res = data["resource_manifest"]["tableware_and_serving"]
    assert tableware_res["reusable_items"] is None
    assert tableware_res["single_use_items"] is None
    assert tableware_res["provenance"] == "Not estimated"


def test_generate_complete_plan_multiday(client):
    """Test multi-day event plan generation with overnight confirmation."""
    event_id = _create_test_event(client, duration_days=2)

    payload = {
        "event_id": event_id,
        "event_date": "2026-11-20",
        "start_time": "09:00",
        "end_time": "17:00",
        "duration_days": 2,
    }

    res = client.post("/api/v1/planning/complete-plan", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["event_overview"]["duration_days"] == 2
    assert len(data["daily_timetable"]) == 2
    assert data["daily_timetable"][0]["date"] == "2026-11-20"
    assert data["daily_timetable"][1]["date"] == "2026-11-21"

    confirmations = data["assumptions_and_confirmations"]["items_requiring_confirmation"]
    assert any("overnight security" in c.lower() for c in confirmations)


def test_generate_complete_plan_short_window_warning(client):
    """Test that a tight event window (75 mins) generates scheduling warnings."""
    event_id = _create_test_event(client)

    payload = {
        "event_id": event_id,
        "event_date": "2026-11-20",
        "start_time": "14:00",
        "end_time": "15:15",  # 75 mins
        "selected_meal_types": ["SNACKS"],
    }

    res = client.post("/api/v1/planning/complete-plan", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert len(data["scheduling_warnings"]) > 0
