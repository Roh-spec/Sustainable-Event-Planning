"""
Unit tests for the Planning Engine Orchestrator, Candidate Generator,
Constraint Evaluator, Cost Engine, and Plan Ranker.
"""

from decimal import Decimal
import pytest

from backend.app.planning.constraint_engine.evaluator import ConstraintEvaluator
from backend.app.planning.cost_engine.calculator import CostCalculator
from backend.app.planning.modules.food.schemas import (
    DietaryPreference,
    FoodPlanRequest,
    MealInput,
    MealType,
)
from backend.app.planning.modules.waste.schemas import (
    CalculationBasis,
    PackagingItemInput,
    PackagingItemType,
    PlasticItemInput,
    PlasticItemType,
    WastePlanRequest,
    WasteSourceType,
)
from backend.app.planning.orchestrator.candidate_generator import CandidateGenerator
from backend.app.planning.orchestrator.pipeline import PlanningPipeline
from backend.app.planning.orchestrator.ranking import PlanRanker
from backend.app.planning.orchestrator.schemas import (
    CandidateConfiguration,
    CandidateEvaluation,
    FoodMetrics,
    PlanningModuleContext,
    PlanningObjective,
    PlanningRequest,
    SustainabilityMetric,
    WasteMetrics,
)
from backend.app.schemas.assumption import (
    AssumptionScope,
    AssumptionSourceType,
    ResolvedAssumption,
)
from backend.app.schemas.constraint import ConstraintBase, ConstraintType


def _make_mock_assumption(param: str, value: str, unit: str, source=AssumptionSourceType.ASSUMED):
    return ResolvedAssumption(
        parameter=param,
        value=value,
        unit=unit,
        source_type=source,
        scope=AssumptionScope.GLOBAL,
        is_resolved=True,
        explanation="Mock assumption",
    )


# -------------------------------------------------------------------------
# 1. PlanningRequest Validation
# -------------------------------------------------------------------------

def test_planning_request_validation():
    """Verify schema constraints on PlanningRequest."""
    req = PlanningRequest(
        event_id=1,
        budget=Decimal("50000.00"),
        planning_objectives=[
            PlanningObjective.BUDGET_FOCUSED,
            PlanningObjective.SUSTAINABILITY_FOCUSED,
        ],
    )
    assert req.event_id == 1
    assert req.budget == Decimal("50000.00")
    assert len(req.planning_objectives) == 2
    assert req.allow_budget_increase is False

    with pytest.raises(Exception):
        # Negative budget rejected
        PlanningRequest(event_id=1, budget=Decimal("-100"))


# -------------------------------------------------------------------------
# 2. Candidate Generation
# -------------------------------------------------------------------------

def test_candidate_generator_deterministic_and_deduplicated():
    """Verify distinct candidates are generated and duplicates are eliminated."""
    req = PlanningRequest(
        event_id=10,
        module_context=PlanningModuleContext(
            waste=WastePlanRequest(
                event_id=10,
                packaging_items=[
                    PackagingItemInput(
                        item_type=PackagingItemType.PLATE,
                        calculation_basis=CalculationBasis.PER_PERSON,
                    )
                ],
                plastic_items=[
                    PlasticItemInput(
                        item_type=PlasticItemType.WATER_BOTTLE,
                        calculation_basis=CalculationBasis.PER_PERSON,
                    )
                ],
            )
        ),
    )

    candidates = CandidateGenerator.generate_candidates(
        request=req,
        expected_attendees=200,
    )

    # Should generate baseline, max_reusable, plastic_min, and comprehensive eco
    assert len(candidates) >= 3
    cand_ids = [c.candidate_id for c in candidates]
    assert "cand_baseline" in cand_ids
    assert "cand_max_reusable" in cand_ids
    assert "cand_plastic_min" in cand_ids

    # Verify no duplicates
    assert len(cand_ids) == len(set(cand_ids))

    # Reusable candidate has 100% reusable packaging configured
    max_reusable = next(c for c in candidates if c.candidate_id == "cand_max_reusable")
    plate_reusable = max_reusable.waste_config.packaging_items[0]
    assert plate_reusable.user_reusable_quantity == Decimal("200")
    assert plate_reusable.user_single_use_quantity == Decimal("0")

    # Plastic min candidate has 0 disposable bottles
    plastic_min = next(c for c in candidates if c.candidate_id == "cand_plastic_min")
    bottle = plastic_min.waste_config.plastic_items[0]
    assert bottle.user_override_quantity == Decimal("0")


def test_candidate_generator_preserves_fixed_attendees():
    """Verify candidate generation never modifies expected attendees or invents cuts."""
    req = PlanningRequest(
        event_id=5,
        module_context=PlanningModuleContext(
            food=FoodPlanRequest(
                event_id=5,
                meals=[MealInput(meal_type=MealType.LUNCH, day=1)],
            )
        ),
    )

    candidates = CandidateGenerator.generate_candidates(
        request=req,
        expected_attendees=350,
    )

    for c in candidates:
        if c.food_config:
            # Attendees are fixed and not altered
            assert c.food_config.event_id == 5
            # Servings are not artificially reduced
            for m in c.food_config.meals:
                assert m.attendee_count is None


# -------------------------------------------------------------------------
# 3. Constraint Evaluator: Hard vs Soft Constraints
# -------------------------------------------------------------------------

def test_constraint_evaluator_hard_required_cannot_be_violated():
    """Verify that a REQUIRED constraint violation causes feasible=False."""
    constraints = [
        ConstraintBase(
            category="FOOD",
            description="All meals must be strictly vegetarian",
            constraint_type=ConstraintType.REQUIRED,
            value="VEGETARIAN",
        )
    ]

    # Candidate with non-vegetarian servings
    food_metrics = {"non_veg_servings": Decimal("50"), "veg_servings": Decimal("50")}

    res = ConstraintEvaluator.evaluate(
        constraints=constraints,
        food_metrics=food_metrics,
    )

    assert res.feasible is False
    assert res.required_satisfied is False
    assert len(res.violations) == 1
    assert "vegetarian" in res.violations[0].reason.lower()


def test_constraint_evaluator_hard_not_allowed_cannot_be_violated():
    """Verify that a NOT_ALLOWED constraint violation causes feasible=False."""
    constraints = [
        ConstraintBase(
            category="WASTE",
            description="Single-use plastic bottles prohibited",
            constraint_type=ConstraintType.NOT_ALLOWED,
            value="NO_PLASTIC",
        )
    ]

    waste_metrics = {"total_plastic_items": Decimal("100")}

    res = ConstraintEvaluator.evaluate(
        constraints=constraints,
        waste_metrics=waste_metrics,
    )

    assert res.feasible is False
    assert res.not_allowed_satisfied is False
    assert len(res.violations) == 1
    assert "plastic" in res.violations[0].reason.lower()


def test_constraint_evaluator_soft_preferred_relaxed_with_explanation():
    """Verify that PREFERRED constraints may be relaxed while maintaining feasibility."""
    constraints = [
        ConstraintBase(
            category="WASTE",
            description="Prefer 100% reusable catering packaging",
            constraint_type=ConstraintType.PREFERRED,
            value="REUSABLE",
        )
    ]

    # Plan contains single-use items
    waste_metrics = {
        "single_use_packaging_items": Decimal("40"),
        "reusable_packaging_items": Decimal("60"),
    }

    res = ConstraintEvaluator.evaluate(
        constraints=constraints,
        waste_metrics=waste_metrics,
    )

    # Feasible because preferred is soft
    assert res.feasible is True
    assert res.preferred_satisfied is False
    assert len(res.violations) == 0
    assert len(res.relaxed_constraints) == 1
    relaxation = res.relaxed_constraints[0]
    assert relaxation.constraint_type == ConstraintType.PREFERRED
    assert "relaxed" in relaxation.relaxation_reason.lower()


def test_constraint_evaluator_soft_flexible_adjusted():
    """Verify FLEXIBLE constraints are noted without blocking feasibility."""
    constraints = [
        ConstraintBase(
            category="FOOD",
            description="Participation buffer flexible up to 10%",
            constraint_type=ConstraintType.FLEXIBLE,
            value="0.10",
        )
    ]

    res = ConstraintEvaluator.evaluate(constraints=constraints)
    assert res.feasible is True
    assert len(res.flexible_adjustments) == 1
    assert "Participation buffer" in res.flexible_adjustments[0]


# -------------------------------------------------------------------------
# 4. Budget Constraint Handling
# -------------------------------------------------------------------------

def test_budget_constraint_hard_violation_when_exceeded():
    """Verify exceeding budget violates hard constraint."""
    res = ConstraintEvaluator.evaluate(
        constraints=[],
        total_cost=Decimal("60000.00"),
        budget=Decimal("50000.00"),
    )
    assert res.feasible is False
    assert res.budget_satisfied is False
    assert len(res.violations) == 1
    assert "exceeds budget" in res.violations[0].reason.lower()


def test_cost_calculator_aggregation_and_variance():
    """Verify pure cost aggregation and budget surplus/deficit calculation."""
    cost_res = CostCalculator.aggregate_costs(
        food_cost=Decimal("25000.00"),
        waste_cost=Decimal("3000.00"),
        budget=Decimal("30000.00"),
    )
    assert cost_res.total_estimated_cost == Decimal("28000.00")
    assert cost_res.budget == Decimal("30000.00")
    assert cost_res.variance_amount == Decimal("2000.00")  # Surplus
    assert cost_res.is_over_budget is False


# -------------------------------------------------------------------------
# 5. Plan Ranker: Objectives and Deduplication
# -------------------------------------------------------------------------

def test_plan_ranker_budget_and_sustainability_selection():
    """Verify Budget-focused picks lowest cost, Sustainability-focused picks lowest waste."""
    # Candidate A: Low cost, high waste
    eval_a = CandidateEvaluation(
        candidate_id="cand_a",
        name="Cheap Disposable",
        configuration=CandidateConfiguration(
            candidate_id="cand_a", name="Cheap", description="Cheap disposable plan"
        ),
        feasible=True,
        total_cost=Decimal("15000.00"),
        food_metrics=FoodMetrics(estimated_waste_servings=Decimal("30")),
        waste_metrics=WasteMetrics(
            single_use_packaging_items=Decimal("200"),
            total_plastic_items=Decimal("100"),
            reusable_packaging_items=Decimal("0"),
        ),
        constraint_result=ConstraintEvaluator.evaluate([]),
    )

    # Candidate B: Moderate cost, moderate waste
    eval_b = CandidateEvaluation(
        candidate_id="cand_b",
        name="Moderate Balanced",
        configuration=CandidateConfiguration(
            candidate_id="cand_b", name="Balanced", description="Balanced plan"
        ),
        feasible=True,
        total_cost=Decimal("18000.00"),
        food_metrics=FoodMetrics(estimated_waste_servings=Decimal("15")),
        waste_metrics=WasteMetrics(
            single_use_packaging_items=Decimal("50"),
            total_plastic_items=Decimal("0"),
            reusable_packaging_items=Decimal("150"),
        ),
        constraint_result=ConstraintEvaluator.evaluate([]),
    )

    # Candidate C: High cost, zero waste
    eval_c = CandidateEvaluation(
        candidate_id="cand_c",
        name="Eco Reusable",
        configuration=CandidateConfiguration(
            candidate_id="cand_c", name="Eco", description="Eco reusable plan"
        ),
        feasible=True,
        total_cost=Decimal("22000.00"),
        food_metrics=FoodMetrics(estimated_waste_servings=Decimal("5")),
        waste_metrics=WasteMetrics(
            single_use_packaging_items=Decimal("0"),
            total_plastic_items=Decimal("0"),
            reusable_packaging_items=Decimal("200"),
        ),
        constraint_result=ConstraintEvaluator.evaluate([]),
    )

    plans = PlanRanker.select_plans([eval_a, eval_b, eval_c])

    assert len(plans) == 3

    # Check Budget-focused
    b_plan = next(p for p in plans if p.planning_objective == PlanningObjective.BUDGET_FOCUSED)
    assert b_plan.candidate_id == "cand_a"
    assert b_plan.estimated_cost == Decimal("15000.00")

    # Check Sustainability-focused
    s_plan = next(p for p in plans if p.planning_objective == PlanningObjective.SUSTAINABILITY_FOCUSED)
    assert s_plan.candidate_id == "cand_c"
    assert s_plan.estimated_cost == Decimal("22000.00")

    # Check Balanced
    bal_plan = next(p for p in plans if p.planning_objective == PlanningObjective.BALANCED)
    assert bal_plan.candidate_id == "cand_b"
    assert bal_plan.estimated_cost == Decimal("18000.00")
    # Verify trade-off text exists
    assert any("costs ₹" in t.lower() for t in bal_plan.tradeoffs)


def test_plan_ranker_deduplicates_when_same_candidate_optimal():
    """Verify that if one candidate is both lowest cost and highest sustainability, no duplicate is manufactured."""
    eval_solo = CandidateEvaluation(
        candidate_id="cand_only",
        name="Only Option",
        configuration=CandidateConfiguration(
            candidate_id="cand_only", name="Only", description="Single plan"
        ),
        feasible=True,
        total_cost=Decimal("10000.00"),
        waste_metrics=WasteMetrics(
            single_use_packaging_items=Decimal("0"),
            total_plastic_items=Decimal("0"),
        ),
        constraint_result=ConstraintEvaluator.evaluate([]),
    )

    plans = PlanRanker.select_plans([eval_solo])
    # Exactly 1 plan returned because candidate_id is unique
    assert len(plans) == 1
    assert plans[0].candidate_id == "cand_only"


# -------------------------------------------------------------------------
# 6. Planning Pipeline End-to-End
# -------------------------------------------------------------------------

def test_planning_pipeline_infeasible_budget_reports_deficit():
    """Verify pipeline returns INFEASIBLE_BUDGET status without silently increasing budget."""
    request = PlanningRequest(
        event_id=1,
        budget=Decimal("500.00"),  # Insufficient budget
        allow_budget_increase=False,
        module_context=PlanningModuleContext(
            food=FoodPlanRequest(
                event_id=1,
                meals=[MealInput(meal_type=MealType.LUNCH, day=1)],
            )
        ),
    )

    assumptions = {
        "meal_participation_rate_default": _make_mock_assumption("meal_participation_rate_default", "1.0", "ratio"),
        "meal_cost_per_serving_default": _make_mock_assumption("meal_cost_per_serving_default", "100.00", "INR"),
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
    }

    # 100 attendees * 100 INR = 10,000 INR > 500 INR budget
    response = PlanningPipeline.run(
        request=request,
        event_name="Budget Squeeze Event",
        event_type="WORKSHOP",
        expected_attendees=100,
        budget=Decimal("500.00"),
        resolved_assumptions=assumptions,
    )

    assert response.status == "INFEASIBLE_BUDGET"
    assert response.budget_deficit is not None
    assert response.budget_deficit > Decimal("0")
    assert response.min_feasible_budget == Decimal("10000.00")
    assert len(response.plans) == 0
    assert any("deficit" in w.lower() for w in response.warnings)


def test_planning_pipeline_budget_increase_with_explicit_approval():
    """Verify pipeline regenerates feasible plans when budget increase is explicitly approved."""
    request = PlanningRequest(
        event_id=1,
        budget=Decimal("500.00"),
        allow_budget_increase=True,
        max_approved_budget=Decimal("15000.00"),  # Approved up to 15k
        module_context=PlanningModuleContext(
            food=FoodPlanRequest(
                event_id=1,
                meals=[MealInput(meal_type=MealType.LUNCH, day=1)],
            )
        ),
    )

    assumptions = {
        "meal_participation_rate_default": _make_mock_assumption("meal_participation_rate_default", "1.0", "ratio"),
        "meal_cost_per_serving_default": _make_mock_assumption("meal_cost_per_serving_default", "100.00", "INR"),
        "food_waste_percentage": _make_mock_assumption("food_waste_percentage", "0.10", "ratio"),
    }

    response = PlanningPipeline.run(
        request=request,
        event_name="Approved Budget Event",
        event_type="WORKSHOP",
        expected_attendees=100,
        budget=Decimal("500.00"),
        resolved_assumptions=assumptions,
    )

    assert response.status == "COMPLETE"
    assert len(response.plans) >= 1
    assert response.plans[0].feasible is True
