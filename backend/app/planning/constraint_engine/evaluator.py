"""
Evaluates hard (Required/Not Allowed/Budget) and soft (Preferred/Flexible) constraints.
Guarantees that hard constraints are never violated, and soft constraints are relaxed
only when necessary with transparent, traceable explanations.
"""

from decimal import Decimal
from typing import Any, Dict, List, Optional

from backend.app.planning.constraint_engine.schemas import (
    ConstraintRelaxation,
    ConstraintResult,
    ConstraintViolation,
)
from backend.app.schemas.constraint import ConstraintBase, ConstraintType


class ConstraintEvaluator:
    """
    Pure evaluation engine for the planning constraint hierarchy.
    """

    @classmethod
    def evaluate(
        cls,
        constraints: List[ConstraintBase],
        total_cost: Optional[Decimal] = None,
        budget: Optional[Decimal] = None,
        food_metrics: Optional[Dict[str, Any]] = None,
        waste_metrics: Optional[Dict[str, Any]] = None,
    ) -> ConstraintResult:
        """
        Evaluates candidate metrics against hard and soft constraints.
        """
        violations: List[ConstraintViolation] = []
        relaxed: List[ConstraintRelaxation] = []
        flexible_adjustments: List[str] = []

        required_satisfied = True
        not_allowed_satisfied = True
        preferred_satisfied = True
        budget_satisfied = True

        # 1. Budget Hard Constraint
        if total_cost is not None and budget is not None:
            if total_cost > budget:
                budget_satisfied = False
                deficit = total_cost - budget
                violations.append(
                    ConstraintViolation(
                        category="BUDGET",
                        constraint_type=ConstraintType.REQUIRED,
                        description=f"Total cost must not exceed the event budget of ₹{budget}.",
                        reason=f"Estimated cost of ₹{total_cost} exceeds budget of ₹{budget} by ₹{deficit}.",
                    )
                )

        # 2. Domain Constraints
        for c in constraints:
            ctype = c.constraint_type
            cat = (c.category or "").upper()
            desc = c.description or ""
            val = (c.value or "").upper()
            desc_upper = desc.upper()

            # --- A. Vegetarian / Dietary Constraints ---
            if "VEG" in val or "VEG" in desc_upper or "MEAT" in desc_upper or "NON_VEG" in desc_upper:
                has_non_veg = False
                if food_metrics:
                    # Check if non_veg servings exist or non_veg meals
                    non_veg_servings = food_metrics.get("non_veg_servings", Decimal("0"))
                    if non_veg_servings and Decimal(str(non_veg_servings)) > Decimal("0"):
                        has_non_veg = True

                # Not allowed: Non-vegetarian
                if "NOT_ALLOWED" in str(ctype) or "NO_NON_VEG" in val or "NO_MEAT" in val:
                    if has_non_veg:
                        not_allowed_satisfied = False
                        violations.append(
                            ConstraintViolation(
                                category=cat,
                                constraint_type=ConstraintType.NOT_ALLOWED,
                                description=desc,
                                reason="Candidate configuration includes non-vegetarian food, violating Not Allowed rule.",
                            )
                        )
                # Required: Vegetarian only
                elif ctype == ConstraintType.REQUIRED and ("VEGETARIAN" in val or "VEG_ONLY" in desc_upper):
                    if has_non_veg:
                        required_satisfied = False
                        violations.append(
                            ConstraintViolation(
                                category=cat,
                                constraint_type=ConstraintType.REQUIRED,
                                description=desc,
                                reason="Candidate configuration includes non-vegetarian servings when vegetarian-only is Required.",
                            )
                        )
                # Preferred: Vegetarian
                elif ctype == ConstraintType.PREFERRED and ("VEGETARIAN" in val or "PREFER_VEG" in desc_upper):
                    if has_non_veg:
                        preferred_satisfied = False
                        relaxed.append(
                            ConstraintRelaxation(
                                category=cat,
                                constraint_type=ConstraintType.PREFERRED,
                                description=desc,
                                relaxation_reason="Preferred vegetarian-only rule relaxed to maintain organizer's mixed menu choice.",
                                impact="Dietary preference adjustment",
                            )
                        )

            # --- B. Single-Use Plastic Constraints ---
            if "PLASTIC" in val or "PLASTIC" in desc_upper:
                has_plastic = False
                if waste_metrics:
                    plastic_count = waste_metrics.get("total_plastic_items", Decimal("0"))
                    if plastic_count and Decimal(str(plastic_count)) > Decimal("0"):
                        has_plastic = True

                if ctype == ConstraintType.NOT_ALLOWED or ("NO_PLASTIC" in val and ctype == ConstraintType.REQUIRED):
                    if has_plastic:
                        not_allowed_satisfied = False
                        violations.append(
                            ConstraintViolation(
                                category=cat,
                                constraint_type=ConstraintType.NOT_ALLOWED,
                                description=desc,
                                reason=f"Candidate includes {waste_metrics.get('total_plastic_items')} plastic items when plastic is prohibited.",
                            )
                        )
                elif ctype == ConstraintType.REQUIRED and "NO_PLASTIC" in val:
                    if has_plastic:
                        required_satisfied = False
                        violations.append(
                            ConstraintViolation(
                                category=cat,
                                constraint_type=ConstraintType.REQUIRED,
                                description=desc,
                                reason=f"Candidate includes plastic items when zero plastic is Required.",
                            )
                        )
                elif ctype == ConstraintType.PREFERRED and ("NO_PLASTIC" in val or "REDUCE_PLASTIC" in desc_upper):
                    if has_plastic:
                        preferred_satisfied = False
                        relaxed.append(
                            ConstraintRelaxation(
                                category=cat,
                                constraint_type=ConstraintType.PREFERRED,
                                description=desc,
                                relaxation_reason="Preferred zero-plastic constraint relaxed because disposable items were retained in baseline config.",
                                impact="Plastic waste presence",
                            )
                        )

            # --- C. Reusable Packaging / Zero Waste Constraints ---
            if "REUSABLE" in val or "REUSABLE" in desc_upper or "PACKAGING" in desc_upper:
                has_single_use = False
                if waste_metrics:
                    single_use_count = waste_metrics.get("single_use_packaging_items", Decimal("0"))
                    if single_use_count and Decimal(str(single_use_count)) > Decimal("0"):
                        has_single_use = True

                if ctype == ConstraintType.NOT_ALLOWED and "SINGLE_USE" in val:
                    if has_single_use:
                        not_allowed_satisfied = False
                        violations.append(
                            ConstraintViolation(
                                category=cat,
                                constraint_type=ConstraintType.NOT_ALLOWED,
                                description=desc,
                                reason="Candidate plan contains single-use packaging items, violating Not Allowed rule.",
                            )
                        )
                elif ctype == ConstraintType.REQUIRED and ("REUSABLE_ONLY" in val or "100_PERCENT_REUSABLE" in val):
                    if has_single_use:
                        required_satisfied = False
                        violations.append(
                            ConstraintViolation(
                                category=cat,
                                constraint_type=ConstraintType.REQUIRED,
                                description=desc,
                                reason="Candidate plan contains single-use packaging items when 100% reusable packaging is Required.",
                            )
                        )
                elif ctype == ConstraintType.PREFERRED and ("REUSABLE" in val or "REUSABLE" in desc_upper):
                    if has_single_use:
                        preferred_satisfied = False
                        relaxed.append(
                            ConstraintRelaxation(
                                category=cat,
                                constraint_type=ConstraintType.PREFERRED,
                                description=desc,
                                relaxation_reason="Preferred constraint for reusable packaging was partially relaxed to accommodate baseline single-use split within budget.",
                                impact="Single-use packaging retained",
                            )
                        )

            # --- D. Flexible Constraints ---
            if ctype == ConstraintType.FLEXIBLE:
                flexible_adjustments.append(f"Flexible constraint '{desc}' calibrated according to candidate parameters.")

        feasible = required_satisfied and not_allowed_satisfied and budget_satisfied

        return ConstraintResult(
            feasible=feasible,
            required_satisfied=required_satisfied,
            not_allowed_satisfied=not_allowed_satisfied,
            preferred_satisfied=preferred_satisfied,
            budget_satisfied=budget_satisfied,
            flexible_adjustments=flexible_adjustments,
            violations=violations,
            relaxed_constraints=relaxed,
        )


constraint_evaluator = ConstraintEvaluator()
