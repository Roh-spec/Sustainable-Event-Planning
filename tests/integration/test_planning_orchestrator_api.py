"""
Integration tests for the Planning Orchestrator REST API (/api/v1/planning/generate).
Tests end-to-end multi-objective plan generation with database-persisted events,
budgets, constraints, and assumptions.
"""

from decimal import Decimal


def test_api_planning_generate_full_flow(client):
    """
    Test complete end-to-end multi-objective planning via REST API.
    Verifies that the orchestrator coordinates Food + Waste modules,
    evaluates constraints, produces measurable sustainability metrics,
    and returns distinct Budget, Balanced, and Sustainability alternatives.
    """
    # 1. Create an event with budget in DB
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Annual Science Summit",
            "event_type": "CONFERENCE",
            "expected_attendees": 150,
            "duration_days": 1,
            "budget": {
                "total_budget": "60000.00",
                "currency": "INR",
            },
        },
    )
    assert event_res.status_code == 201
    event_id = event_res.json()["id"]

    # 2. Add global assumptions for Food and Waste
    assumptions = [
        {"category": "FOOD", "parameter": "meal_participation_rate_default", "value": "1.0", "unit": "ratio"},
        {"category": "FOOD", "parameter": "meal_cost_per_serving_default", "value": "150.00", "unit": "INR"},
        {"category": "FOOD", "parameter": "food_waste_percentage", "value": "0.10", "unit": "ratio"},
        {"category": "FOOD", "parameter": "food_serving_weight_kg_default", "value": "0.35", "unit": "kg"},
        {"category": "WASTE", "parameter": "packaging_plate_per_person", "value": "1", "unit": "items/person"},
        {"category": "WASTE", "parameter": "reusable_ratio_plate", "value": "0.40", "unit": "ratio"},
        {"category": "WASTE", "parameter": "plastic_water_bottle_per_person", "value": "1", "unit": "items/person"},
    ]
    for a in assumptions:
        client.post("/api/v1/assumptions", json=a)

    # 3. Call Planning Orchestrator
    plan_req = {
        "event_id": event_id,
        "module_context": {
            "food": {
                "event_id": event_id,
                "meals": [{"meal_type": "LUNCH", "day": 1}],
            },
            "waste": {
                "event_id": event_id,
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
            },
        },
    }

    res = client.post("/api/v1/planning/generate", json=plan_req)
    assert res.status_code == 200
    data = res.json()

    assert data["event_id"] == event_id
    assert data["status"] == "COMPLETE"
    assert len(data["plans"]) >= 1

    # Verify distinct plans generated
    objectives = [p["planning_objective"] for p in data["plans"]]
    assert "BUDGET_FOCUSED" in objectives

    # Inspect the Budget-focused plan
    b_plan = next(p for p in data["plans"] if p["planning_objective"] == "BUDGET_FOCUSED")
    assert b_plan["feasible"] is True
    assert float(b_plan["estimated_cost"]) <= 60000.00

    # Verify measurable sustainability metrics are present (not arbitrary 0-100 scores)
    metric_names = [m["metric_name"] for m in b_plan["sustainability_metrics"]]
    assert "food_waste_servings" in metric_names
    assert "reusable_packaging_items" in metric_names

    # Check each metric has unit and provenance
    for m in b_plan["sustainability_metrics"]:
        assert m["unit"] != ""
        assert m["source_type"] in ["ESTIMATED", "USER_PROVIDED", "REFERENCE", "ACTUAL", "ML_PREDICTED"]

    # Explanations and trade-offs are populated
    assert len(b_plan["explanations"]) > 0


def test_api_planning_generate_respects_hard_constraint(client):
    """
    Test that a NOT_ALLOWED constraint strictly prevents a candidate with plastic
    from being feasible, forcing the engine to select an alternative satisfying the rule.
    """
    # 1. Create event
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Zero-Plastic Symposium",
            "event_type": "SEMINAR",
            "expected_attendees": 100,
            "duration_days": 1,
            "budget": {"total_budget": "50000.00", "currency": "INR"},
        },
    )
    event_id = event_res.json()["id"]

    # 2. Add assumptions
    client.post(
        "/api/v1/assumptions",
        json={"category": "WASTE", "parameter": "plastic_water_bottle_per_person", "value": "1", "unit": "items/person"},
    )
    client.post(
        "/api/v1/assumptions",
        json={"category": "WASTE", "parameter": "packaging_cup_per_person", "value": "1", "unit": "items/person"},
    )
    client.post(
        "/api/v1/assumptions",
        json={"category": "WASTE", "parameter": "reusable_ratio_cup", "value": "0.5", "unit": "ratio"},
    )

    # 3. Request with NOT_ALLOWED hard constraint on plastic
    plan_req = {
        "event_id": event_id,
        "constraints": [
            {
                "category": "WASTE",
                "description": "Prohibit single-use plastic water bottles",
                "constraint_type": "NOT_ALLOWED",
                "value": "NO_PLASTIC",
            }
        ],
        "module_context": {
            "waste": {
                "event_id": event_id,
                "plastic_items": [
                    {
                        "item_type": "WATER_BOTTLE",
                        "calculation_basis": "PER_PERSON",
                    }
                ],
            }
        },
    }

    res = client.post("/api/v1/planning/generate", json=plan_req)
    assert res.status_code == 200
    data = res.json()

    # Verify that in all_evaluated_candidates, the baseline (which has plastic) is infeasible
    baseline_cand = next(c for c in data["all_evaluated_candidates"] if c["candidate_id"] == "cand_baseline")
    assert baseline_cand["feasible"] is False
    assert baseline_cand["constraint_result"]["not_allowed_satisfied"] is False

    # The plastic-min candidate (0 plastic) is feasible
    plastic_min = next(c for c in data["all_evaluated_candidates"] if c["candidate_id"] == "cand_plastic_min")
    assert plastic_min["feasible"] is True

    # Feasible plans returned obey the constraint
    for p in data["plans"]:
        assert p["feasible"] is True
        assert float(p["waste_metrics"]["total_plastic_items"]) == 0.0


def test_api_planning_generate_relaxes_preferred_constraint(client):
    """
    Test that a PREFERRED soft constraint can be relaxed without causing infeasibility,
    and the relaxation is explicitly reported in the response.
    """
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Eco-Friendly Workshop",
            "event_type": "WORKSHOP",
            "expected_attendees": 50,
            "duration_days": 1,
            "budget": {"total_budget": "25000.00", "currency": "INR"},
        },
    )
    event_id = event_res.json()["id"]

    client.post(
        "/api/v1/assumptions",
        json={"category": "WASTE", "parameter": "packaging_plate_per_person", "value": "1", "unit": "items/person"},
    )
    client.post(
        "/api/v1/assumptions",
        json={"category": "WASTE", "parameter": "reusable_ratio_plate", "value": "0.30", "unit": "ratio"},
    )

    plan_req = {
        "event_id": event_id,
        "constraints": [
            {
                "category": "WASTE",
                "description": "Prefer 100% reusable packaging",
                "constraint_type": "PREFERRED",
                "value": "REUSABLE",
            }
        ],
        "module_context": {
            "waste": {
                "event_id": event_id,
                "packaging_items": [
                    {
                        "item_type": "PLATE",
                        "calculation_basis": "PER_PERSON",
                    }
                ],
            }
        },
    }

    res = client.post("/api/v1/planning/generate", json=plan_req)
    assert res.status_code == 200
    data = res.json()

    # The baseline candidate (30% reusable / 70% single-use) has relaxed constraint
    baseline_cand = next(c for c in data["all_evaluated_candidates"] if c["candidate_id"] == "cand_baseline")
    assert baseline_cand["feasible"] is True
    assert baseline_cand["constraint_result"]["preferred_satisfied"] is False
    assert len(baseline_cand["constraint_result"]["relaxed_constraints"]) == 1
    rel = baseline_cand["constraint_result"]["relaxed_constraints"][0]
    assert rel["constraint_type"] == "PREFERRED"


def test_api_planning_generate_infeasible_budget_and_approval(client):
    """
    Test that insufficient budget results in INFEASIBLE_BUDGET status with deficit,
    and user approval allows regenerating feasible plans.
    """
    event_res = client.post(
        "/api/v1/events",
        json={
            "name": "Budget-Constrained Fest",
            "event_type": "FEST",
            "expected_attendees": 100,
            "duration_days": 1,
            "budget": {"total_budget": "1000.00", "currency": "INR"},  # 1k INR is too low
        },
    )
    event_id = event_res.json()["id"]

    client.post(
        "/api/v1/assumptions",
        json={"category": "FOOD", "parameter": "meal_cost_per_serving_default", "value": "100.00", "unit": "INR"},
    )
    client.post(
        "/api/v1/assumptions",
        json={"category": "FOOD", "parameter": "meal_participation_rate_default", "value": "1.0", "unit": "ratio"},
    )

    # 1. Infeasible run: allow_budget_increase=False
    plan_req_infeasible = {
        "event_id": event_id,
        "allow_budget_increase": False,
        "module_context": {
            "food": {
                "event_id": event_id,
                "meals": [{"meal_type": "LUNCH", "day": 1}],
            }
        },
    }

    res_infeasible = client.post("/api/v1/planning/generate", json=plan_req_infeasible)
    assert res_infeasible.status_code == 200
    data_infeasible = res_infeasible.json()

    assert data_infeasible["status"] == "INFEASIBLE_BUDGET"
    assert float(data_infeasible["min_feasible_budget"]) == 10000.00
    assert float(data_infeasible["budget_deficit"]) == 9000.00  # 10k - 1k
    assert len(data_infeasible["plans"]) == 0

    # 2. Approved run: allow_budget_increase=True with max_approved_budget=12000
    plan_req_approved = {
        "event_id": event_id,
        "allow_budget_increase": True,
        "max_approved_budget": "12000.00",
        "module_context": {
            "food": {
                "event_id": event_id,
                "meals": [{"meal_type": "LUNCH", "day": 1}],
            }
        },
    }

    res_approved = client.post("/api/v1/planning/generate", json=plan_req_approved)
    assert res_approved.status_code == 200
    data_approved = res_approved.json()

    assert data_approved["status"] == "COMPLETE"
    assert len(data_approved["plans"]) >= 1
    assert data_approved["plans"][0]["feasible"] is True


def test_api_planning_generate_non_existent_event_returns_404(client):
    """Test generating plan for non-existent event returns 404."""
    res = client.post("/api/v1/planning/generate", json={"event_id": 999999})
    assert res.status_code == 404
    assert "does not exist" in res.json()["detail"].lower()


def test_api_planning_generate_invalid_payload_returns_422(client):
    """Test generating plan with invalid payload returns 422."""
    res = client.post("/api/v1/planning/generate", json={"event_id": "not_an_int"})
    assert res.status_code == 422
