"""
Deterministic multi-objective ranking and alternative selection.
Selects up to three distinct, meaningful plans:
1. BUDGET_FOCUSED
2. BALANCED
3. SUSTAINABILITY_FOCUSED
Never uses arbitrary weights or invented scores.
Explains real measurable trade-offs with concrete units.
Deduplicates plans so identical candidates are never presented under multiple slots.
"""

from decimal import Decimal
from typing import Dict, List, Optional, Tuple

from backend.app.planning.orchestrator.schemas import (
    CandidateEvaluation,
    PlanAlternative,
    PlanningObjective,
)


class PlanRanker:
    """
    Ranks evaluated candidates and selects distinct plan alternatives
    based on measurable cost and sustainability metrics.
    """

    @classmethod
    def select_plans(
        cls,
        evaluations: List[CandidateEvaluation],
        requested_objectives: Optional[List[PlanningObjective]] = None,
    ) -> List[PlanAlternative]:
        """
        Selects up to 3 distinct feasible plan alternatives matching requested objectives.
        Returns fewer than 3 if insufficient distinct feasible alternatives exist.
        """
        feasible = [c for c in evaluations if c.feasible]
        if not feasible:
            return []

        objectives = requested_objectives or [
            PlanningObjective.BUDGET_FOCUSED,
            PlanningObjective.BALANCED,
            PlanningObjective.SUSTAINABILITY_FOCUSED,
        ]

        # -----------------------------------------------------------------
        # 1. Select Budget-Focused Candidate
        # Primary: Lowest cost. Tie-breaker: Fewer waste items.
        # -----------------------------------------------------------------
        budget_cand = min(
            feasible,
            key=lambda c: (
                c.total_cost if c.total_cost is not None else Decimal("Infinity"),
                cls._extract_waste_burden(c),
            ),
        )

        # -----------------------------------------------------------------
        # 2. Select Sustainability-Focused Candidate
        # Primary: Minimal waste burden (lowest single-use packaging, plastic, food waste).
        # Tie-breaker: Lower cost.
        # -----------------------------------------------------------------
        sustainability_cand = min(
            feasible,
            key=lambda c: (
                cls._extract_waste_burden(c),
                c.total_cost if c.total_cost is not None else Decimal("Infinity"),
            ),
        )

        # -----------------------------------------------------------------
        # 3. Select Balanced Candidate
        # A genuine trade-off sitting intermediate in cost and waste burden.
        # -----------------------------------------------------------------
        balanced_cand: Optional[CandidateEvaluation] = None

        if budget_cand.candidate_id != sustainability_cand.candidate_id:
            # Candidates strictly between budget and sustainability in cost
            b_cost = budget_cand.total_cost or Decimal("0")
            s_cost = sustainability_cand.total_cost or Decimal("0")
            min_cost, max_cost = min(b_cost, s_cost), max(b_cost, s_cost)

            intermediate = [
                c
                for c in feasible
                if c.candidate_id not in (budget_cand.candidate_id, sustainability_cand.candidate_id)
                and c.total_cost is not None
                and min_cost <= c.total_cost <= max_cost
            ]

            if intermediate:
                # Pick the intermediate with the best waste burden
                balanced_cand = min(intermediate, key=lambda c: cls._extract_waste_burden(c))

        # -----------------------------------------------------------------
        # 4. Build Plan Alternatives with Quantitative Trade-Offs
        # -----------------------------------------------------------------
        plans: List[PlanAlternative] = []
        used_candidate_ids = set()

        # Helper to avoid duplicate candidate slots
        def add_plan(cand: CandidateEvaluation, obj: PlanningObjective, name: str):
            if cand.candidate_id in used_candidate_ids:
                return
            used_candidate_ids.add(cand.candidate_id)

            tradeoffs, explanations = cls._generate_tradeoffs_and_explanations(
                candidate=cand,
                objective=obj,
                budget_cand=budget_cand,
                sustainability_cand=sustainability_cand,
            )

            plans.append(
                PlanAlternative(
                    plan_id=f"plan_{obj.value.lower()}_{cand.candidate_id}",
                    name=name,
                    planning_objective=obj,
                    candidate_id=cand.candidate_id,
                    feasible=cand.feasible,
                    estimated_cost=cand.total_cost,
                    food_metrics=cand.food_metrics,
                    waste_metrics=cand.waste_metrics,
                    sustainability_metrics=cand.sustainability_metrics,
                    constraint_result=cand.constraint_result,
                    assumptions_used=cand.assumptions_used,
                    tradeoffs=tradeoffs,
                    explanations=explanations,
                )
            )

        if PlanningObjective.BUDGET_FOCUSED in objectives:
            add_plan(budget_cand, PlanningObjective.BUDGET_FOCUSED, f"Budget-Optimized: {budget_cand.name}")

        if PlanningObjective.SUSTAINABILITY_FOCUSED in objectives:
            add_plan(
                sustainability_cand,
                PlanningObjective.SUSTAINABILITY_FOCUSED,
                f"Sustainability-Optimized: {sustainability_cand.name}",
            )

        if PlanningObjective.BALANCED in objectives and balanced_cand:
            add_plan(balanced_cand, PlanningObjective.BALANCED, f"Balanced: {balanced_cand.name}")

        return plans

    @classmethod
    def _extract_waste_burden(cls, c: CandidateEvaluation) -> Decimal:
        """
        Computes total measurable waste burden (single-use packaging + plastic items + food waste servings).
        Used strictly as an internal sorting criterion for multi-objective comparison.
        """
        burden = Decimal("0")
        if c.waste_metrics:
            if c.waste_metrics.single_use_packaging_items:
                burden += c.waste_metrics.single_use_packaging_items
            if c.waste_metrics.total_plastic_items:
                burden += c.waste_metrics.total_plastic_items
        if c.food_metrics and c.food_metrics.estimated_waste_servings:
            burden += c.food_metrics.estimated_waste_servings
        return burden

    @classmethod
    def _generate_tradeoffs_and_explanations(
        cls,
        candidate: CandidateEvaluation,
        objective: PlanningObjective,
        budget_cand: CandidateEvaluation,
        sustainability_cand: CandidateEvaluation,
    ) -> Tuple[List[str], List[str]]:
        """
        Generates concrete, traceable explanations and measurable trade-offs.
        """
        tradeoffs: List[str] = []
        explanations: List[str] = [candidate.configuration.description]

        cost = candidate.total_cost or Decimal("0")
        b_cost = budget_cand.total_cost or Decimal("0")
        s_cost = sustainability_cand.total_cost or Decimal("0")

        # Waste metrics extraction
        def get_waste_numbers(c: CandidateEvaluation) -> Dict[str, Decimal]:
            single_use = Decimal("0")
            plastic = Decimal("0")
            reusable = Decimal("0")
            food_waste = Decimal("0")
            if c.waste_metrics:
                single_use = c.waste_metrics.single_use_packaging_items or Decimal("0")
                plastic = c.waste_metrics.total_plastic_items or Decimal("0")
                reusable = c.waste_metrics.reusable_packaging_items or Decimal("0")
            if c.food_metrics:
                food_waste = c.food_metrics.estimated_waste_servings or Decimal("0")
            return {
                "single_use": single_use,
                "plastic": plastic,
                "reusable": reusable,
                "food_waste": food_waste,
            }

        cand_w = get_waste_numbers(candidate)
        b_w = get_waste_numbers(budget_cand)
        s_w = get_waste_numbers(sustainability_cand)

        if objective == PlanningObjective.BUDGET_FOCUSED:
            explanations.append(f"Selected for lowest overall estimated cost of ₹{cost:.2f}.")
            if candidate.candidate_id != sustainability_cand.candidate_id and s_cost > cost:
                cost_saving = s_cost - cost
                extra_single_use = cand_w["single_use"] - s_w["single_use"]
                extra_plastic = cand_w["plastic"] - s_w["plastic"]
                tradeoffs.append(
                    f"Saves ₹{cost_saving:.2f} compared to the Sustainability-Focused plan, "
                    f"at the cost of retaining {int(extra_single_use)} single-use packaging items and {int(extra_plastic)} plastic items."
                )

        elif objective == PlanningObjective.SUSTAINABILITY_FOCUSED:
            explanations.append("Selected for best measurable sustainability indicators across packaging, plastic, and food waste.")
            if candidate.candidate_id != budget_cand.candidate_id and cost > b_cost:
                cost_diff = cost - b_cost
                saved_single_use = b_w["single_use"] - cand_w["single_use"]
                saved_plastic = b_w["plastic"] - cand_w["plastic"]
                tradeoffs.append(
                    f"Requires ₹{cost_diff:.2f} more than the Budget-Focused plan, but eliminates "
                    f"{int(saved_single_use)} single-use packaging items and {int(saved_plastic)} disposable plastic items."
                )

        elif objective == PlanningObjective.BALANCED:
            explanations.append("Selected as a balanced compromise between financial expenditure and solid waste reduction.")
            if cost > b_cost:
                cost_diff = cost - b_cost
                saved_single_use = b_w["single_use"] - cand_w["single_use"]
                saved_plastic = b_w["plastic"] - cand_w["plastic"]
                tradeoffs.append(
                    f"Costs ₹{cost_diff:.2f} more than the lowest-cost plan while eliminating "
                    f"{int(saved_single_use)} single-use packaging items and {int(saved_plastic)} plastic items."
                )

        # Include basis notes from candidate configuration
        for note in candidate.configuration.basis_notes:
            explanations.append(f"Planning basis: {note}")

        # Include soft constraint relaxations if any
        for r in candidate.constraint_result.relaxed_constraints:
            explanations.append(f"Constraint relaxation: {r.description} ({r.relaxation_reason})")

        return tradeoffs, explanations


plan_ranker = PlanRanker()
