import math
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple

from backend.app.planning.modules.food.rules import food_rules_engine
from backend.app.planning.modules.food.schemas import (
    CalculationStatus,
    DietaryPreference,
    FoodCostSummary,
    FoodPlanRequest,
    FoodPlanResponse,
    FoodPricingUnit,
    FoodWasteSummary,
    MealInput,
    MealPlanResult,
    WasteEstimationStatus,
)
from backend.app.schemas.assumption import ResolvedAssumption


class FoodCalculator:
    """
    Pure calculation engine for Food Planning.
    Decoupled completely from database and FastAPI layers.
    Inputs and resolved assumptions are injected directly.
    """

    @classmethod
    def calculate(
        cls,
        request: FoodPlanRequest,
        event_name: str,
        event_type: str,
        expected_attendees: int,
        resolved_assumptions: Dict[str, ResolvedAssumption],
        constraints: List[dict],
    ) -> FoodPlanResponse:
        """
        Executes deterministic food quantity, cost, waste, and constraint evaluation.
        """
        missing_assumptions: List[str] = []
        warnings: List[str] = []
        assumptions_used: List[ResolvedAssumption] = []

        # -----------------------------------------------------------------
        # 1. Meal Servings Estimation
        # -----------------------------------------------------------------
        meal_results: List[MealPlanResult] = []
        all_servings_valid = True

        for idx, meal in enumerate(request.meals):
            meal_label = meal.name or f"Day {meal.day} {meal.meal_type.value.capitalize()}"
            attendees = meal.attendee_count or expected_attendees
            dietary = meal.dietary_preference or request.default_dietary_preference

            # Determine participation rate & servings
            servings, part_rate, part_source = cls._determine_servings(
                meal=meal,
                attendees=attendees,
                resolved_assumptions=resolved_assumptions,
                missing_assumptions=missing_assumptions,
                assumptions_used=assumptions_used,
            )

            if servings is None:
                all_servings_valid = False
                veg_servings = None
                non_veg_servings = None
            else:
                veg_servings, non_veg_servings = cls._calculate_dietary_split(
                    servings=servings,
                    dietary=dietary,
                    request_veg_ratio=request.vegetarian_ratio,
                    resolved_assumptions=resolved_assumptions,
                    assumptions_used=assumptions_used,
                )

            meal_results.append(
                MealPlanResult(
                    meal_type=meal.meal_type,
                    name=meal_label,
                    day=meal.day,
                    dietary_preference=dietary,
                    attendee_count=attendees,
                    participation_rate_used=part_rate,
                    participation_source=part_source,
                    estimated_servings=servings,
                    veg_servings=veg_servings,
                    non_veg_servings=non_veg_servings,
                    unit_cost=meal.user_unit_cost,
                    total_cost=meal.user_total_cost,
                    cost_source="USER_PROVIDED" if (meal.user_total_cost or meal.user_unit_cost) else "PENDING",
                    waste_servings=None,
                    waste_kg=None,
                )
            )

        total_servings = sum(m.estimated_servings for m in meal_results if m.estimated_servings is not None) if all_servings_valid else None
        total_veg = sum(m.veg_servings for m in meal_results if m.veg_servings is not None) if all_servings_valid else None
        total_non_veg = sum(m.non_veg_servings for m in meal_results if m.non_veg_servings is not None) if all_servings_valid else None

        # -----------------------------------------------------------------
        # 2. Food Cost Estimation (Approaches A, B, C)
        # -----------------------------------------------------------------
        cost_summary, meal_results = cls._calculate_costs(
            request=request,
            meal_results=meal_results,
            expected_attendees=expected_attendees,
            total_servings=total_servings,
            resolved_assumptions=resolved_assumptions,
            missing_assumptions=missing_assumptions,
            assumptions_used=assumptions_used,
        )

        # -----------------------------------------------------------------
        # 3. Food Waste Estimation
        # -----------------------------------------------------------------
        waste_summary, meal_results = cls._calculate_waste(
            meal_results=meal_results,
            total_servings=total_servings,
            resolved_assumptions=resolved_assumptions,
            missing_assumptions=missing_assumptions,
            assumptions_used=assumptions_used,
        )

        # -----------------------------------------------------------------
        # 4. Constraints & Recommendations
        # -----------------------------------------------------------------
        evaluations = food_rules_engine.evaluate_constraints(
            constraints=constraints,
            meal_plans=meal_results,
            estimated_total_cost=cost_summary.estimated_total_cost,
            food_budget=cost_summary.food_budget,
            default_dietary_preference=request.default_dietary_preference,
        )

        attrition_buffer_assump = resolved_assumptions.get("food_participation_attrition_buffer_rate")
        recommendations = food_rules_engine.generate_recommendations(
            meal_plans=meal_results,
            estimated_total_cost=cost_summary.estimated_total_cost,
            food_budget=cost_summary.food_budget,
            is_over_budget=cost_summary.is_over_budget or False,
            estimated_waste_servings=waste_summary.estimated_waste_servings,
            attrition_buffer_assumption=attrition_buffer_assump,
            assumptions_used=assumptions_used,
        )

        # -----------------------------------------------------------------
        # 5. Calculation Status Determination
        # -----------------------------------------------------------------
        if not all_servings_valid:
            status = CalculationStatus.BLOCKED
            warnings.append("Servings could not be estimated for one or more meals due to missing participation assumptions.")
        elif cost_summary.cost_status == "UNAVAILABLE" or waste_summary.waste_status == WasteEstimationStatus.SERVINGS_ONLY:
            status = CalculationStatus.PARTIAL
            if cost_summary.cost_status == "UNAVAILABLE":
                warnings.append("Food cost could not be calculated due to missing cost assumptions.")
            if waste_summary.waste_status == WasteEstimationStatus.SERVINGS_ONLY:
                warnings.append("Food waste was calculated in servings only because the serving weight assumption is missing.")
        else:
            status = CalculationStatus.COMPLETE

        if cost_summary.is_over_budget:
            warnings.append(
                f"Budget exceeded: Estimated cost of ₹{cost_summary.estimated_total_cost:,.2f} "
                f"exceeds allocated budget of ₹{cost_summary.food_budget:,.2f}."
            )

        # Deduplicate missing assumptions & warnings
        unique_missing = list(dict.fromkeys(missing_assumptions))
        unique_warnings = list(dict.fromkeys(warnings))

        return FoodPlanResponse(
            event_id=request.event_id,
            event_name=event_name,
            event_type=event_type,
            expected_attendees=expected_attendees,
            status=status,
            meal_plans=meal_results,
            total_estimated_servings=total_servings,
            total_veg_servings=total_veg,
            total_non_veg_servings=total_non_veg,
            cost_summary=cost_summary,
            waste_summary=waste_summary,
            constraints_evaluation=evaluations,
            recommendations=recommendations,
            assumptions_used=assumptions_used,
            missing_assumptions=unique_missing,
            warnings=unique_warnings,
        )

    # ---------------------------------------------------------------------
    # Helper: Determine Servings
    # ---------------------------------------------------------------------
    @classmethod
    def _determine_servings(
        cls,
        meal: MealInput,
        attendees: int,
        resolved_assumptions: Dict[str, ResolvedAssumption],
        missing_assumptions: List[str],
        assumptions_used: List[ResolvedAssumption],
    ) -> Tuple[Optional[int], Optional[Decimal], str]:
        """Calculates servings count and records participation source."""
        # 1. User provided explicit servings count
        if meal.user_servings is not None:
            return meal.user_servings, None, "USER_PROVIDED"

        # 2. User provided explicit participation rate
        if meal.user_participation_rate is not None:
            rate = meal.user_participation_rate
            servings = int(math.ceil(attendees * float(rate)))
            return max(0, servings), rate, "USER_PROVIDED"

        # 3. Resolve participation rate from Assumption Engine
        meal_key = f"meal_participation_rate_{meal.meal_type.value.lower()}"
        default_key = "meal_participation_rate_default"

        assumption = resolved_assumptions.get(meal_key)
        if not (assumption and assumption.is_resolved):
            assumption = resolved_assumptions.get(default_key)

        if assumption and assumption.is_resolved and assumption.value:
            try:
                rate_val = Decimal(assumption.value)
                if rate_val > 1:
                    rate_val = rate_val / Decimal("100")
                rate_val = max(Decimal("0.0"), min(Decimal("1.0"), rate_val))
                servings = int(math.ceil(attendees * float(rate_val)))
                assumptions_used.append(assumption)
                return max(0, servings), rate_val, f"ASSUMPTION ({assumption.source_type.value})"
            except Exception:
                missing_assumptions.append(meal_key)
                return None, None, "UNAVAILABLE"

        missing_assumptions.append(meal_key)
        return None, None, "UNAVAILABLE"

    # ---------------------------------------------------------------------
    # Helper: Dietary Split
    # ---------------------------------------------------------------------
    @classmethod
    def _calculate_dietary_split(
        cls,
        servings: int,
        dietary: DietaryPreference,
        request_veg_ratio: Optional[Decimal],
        resolved_assumptions: Dict[str, ResolvedAssumption],
        assumptions_used: List[ResolvedAssumption],
    ) -> Tuple[int, int]:
        """Calculates vegetarian vs non-vegetarian portion counts."""
        if dietary == DietaryPreference.VEGETARIAN:
            return servings, 0
        elif dietary == DietaryPreference.NON_VEGETARIAN:
            return 0, servings
        else:
            # Mixed
            if request_veg_ratio is not None:
                ratio = request_veg_ratio
            else:
                assump = resolved_assumptions.get("vegetarian_ratio")
                if assump and assump.is_resolved and assump.value:
                    try:
                        ratio = Decimal(assump.value)
                        if ratio > 1:
                            ratio = ratio / Decimal("100")
                        assumptions_used.append(assump)
                    except Exception:
                        ratio = Decimal("0.70")
                else:
                    ratio = Decimal("0.70")  # Standard default benchmark for campus catering

            veg_servings = int(round(servings * float(ratio)))
            non_veg = max(0, servings - veg_servings)
            return veg_servings, non_veg

    # ---------------------------------------------------------------------
    # Helper: Cost Estimation
    # ---------------------------------------------------------------------
    @classmethod
    def _calculate_costs(
        cls,
        request: FoodPlanRequest,
        meal_results: List[MealPlanResult],
        expected_attendees: int,
        total_servings: Optional[int],
        resolved_assumptions: Dict[str, ResolvedAssumption],
        missing_assumptions: List[str],
        assumptions_used: List[ResolvedAssumption],
    ) -> Tuple[FoodCostSummary, List[MealPlanResult]]:
        """Calculates food costs according to Approaches A, B, and C."""
        breakdown: Dict[str, Optional[Decimal]] = {}

        # Approach A: User-provided total cost
        if request.known_total_cost is not None:
            total_cost = request.known_total_cost
            cost_status = "USER_PROVIDED"
            pricing_approach = "USER_PROVIDED_TOTAL"

            # Allocate across meals proportionally by servings if possible
            if total_servings and total_servings > 0:
                for m in meal_results:
                    if m.estimated_servings:
                        ratio = Decimal(m.estimated_servings) / Decimal(total_servings)
                        meal_cost = (total_cost * ratio).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                        m.total_cost = meal_cost
                        m.unit_cost = (meal_cost / Decimal(m.estimated_servings)).quantize(Decimal("0.01"))
                        m.cost_source = "USER_PROVIDED_PROPORTIONAL"
                        breakdown[m.name] = meal_cost
            else:
                for m in meal_results:
                    breakdown[m.name] = None

        # Approach B: User-provided unit cost
        elif request.known_unit_cost is not None:
            pricing_unit = request.cost_pricing_unit or FoodPricingUnit.PER_SERVING
            cost_status = "USER_PROVIDED"
            pricing_approach = "USER_PROVIDED_UNIT"

            if pricing_unit == FoodPricingUnit.PER_PERSON:
                total_cost = (request.known_unit_cost * Decimal(expected_attendees)).quantize(Decimal("0.01"))
            elif pricing_unit == FoodPricingUnit.PER_SERVING:
                if total_servings is not None:
                    total_cost = (request.known_unit_cost * Decimal(total_servings)).quantize(Decimal("0.01"))
                else:
                    total_cost = None
            else:  # TOTAL
                total_cost = request.known_unit_cost

            for m in meal_results:
                if m.estimated_servings and request.known_unit_cost:
                    m.unit_cost = request.known_unit_cost
                    m.total_cost = (request.known_unit_cost * Decimal(m.estimated_servings)).quantize(Decimal("0.01"))
                    m.cost_source = "USER_PROVIDED_UNIT"
                    breakdown[m.name] = m.total_cost
                else:
                    breakdown[m.name] = None

        # Approach C: Assumption-based or meal-specific cost
        else:
            total_acc = Decimal("0.00")
            all_meals_have_cost = True

            for m in meal_results:
                if m.total_cost is not None:
                    breakdown[m.name] = m.total_cost
                    total_acc += m.total_cost
                elif m.unit_cost is not None and m.estimated_servings is not None:
                    c = (m.unit_cost * Decimal(m.estimated_servings)).quantize(Decimal("0.01"))
                    m.total_cost = c
                    breakdown[m.name] = c
                    total_acc += c
                else:
                    # Resolve cost per serving assumption
                    meal_param = f"meal_cost_per_serving_{m.meal_type.value.lower()}"
                    default_param = "meal_cost_per_serving_default"
                    assump = resolved_assumptions.get(meal_param)
                    if not (assump and assump.is_resolved):
                        assump = resolved_assumptions.get(default_param)

                    if assump and assump.is_resolved and assump.value:
                        try:
                            unit_cost = Decimal(assump.value)
                            assumptions_used.append(assump)
                            m.unit_cost = unit_cost
                            if m.estimated_servings is not None:
                                c = (unit_cost * Decimal(m.estimated_servings)).quantize(Decimal("0.01"))
                                m.total_cost = c
                                m.cost_source = f"ASSUMPTION ({assump.source_type.value})"
                                breakdown[m.name] = c
                                total_acc += c
                            else:
                                m.cost_source = "SERVINGS_MISSING"
                                breakdown[m.name] = None
                                all_meals_have_cost = False
                        except Exception:
                            missing_assumptions.append(meal_param)
                            breakdown[m.name] = None
                            all_meals_have_cost = False
                    else:
                        missing_assumptions.append(meal_param)
                        m.cost_source = "UNAVAILABLE"
                        breakdown[m.name] = None
                        all_meals_have_cost = False

            if all_meals_have_cost and len(meal_results) > 0:
                total_cost = total_acc
                cost_status = "ESTIMATED"
                pricing_approach = "ASSUMPTION_BASED"
            else:
                total_cost = None
                cost_status = "UNAVAILABLE"
                pricing_approach = "UNAVAILABLE"

        # Budget comparison
        food_budget = request.food_budget
        remaining = None
        is_over = None
        variance = None
        if food_budget is not None and total_cost is not None:
            remaining = food_budget - total_cost
            is_over = total_cost > food_budget
            variance = total_cost - food_budget

        # Cost per attendee
        cost_per_attendee = None
        if total_cost is not None and expected_attendees > 0:
            cost_per_attendee = (total_cost / Decimal(expected_attendees)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        summary = FoodCostSummary(
            estimated_total_cost=total_cost,
            cost_status=cost_status,
            pricing_approach=pricing_approach,
            cost_per_attendee=cost_per_attendee,
            breakdown_by_meal=breakdown,
            food_budget=food_budget,
            remaining_budget=remaining,
            is_over_budget=is_over,
            variance_amount=variance,
        )
        return summary, meal_results

    # ---------------------------------------------------------------------
    # Helper: Waste Estimation
    # ---------------------------------------------------------------------
    @classmethod
    def _calculate_waste(
        cls,
        meal_results: List[MealPlanResult],
        total_servings: Optional[int],
        resolved_assumptions: Dict[str, ResolvedAssumption],
        missing_assumptions: List[str],
        assumptions_used: List[ResolvedAssumption],
    ) -> Tuple[FoodWasteSummary, List[MealPlanResult]]:
        """Calculates potential food waste in servings and kilograms."""
        if total_servings is None or total_servings == 0:
            return FoodWasteSummary(waste_status=WasteEstimationStatus.UNAVAILABLE), meal_results

        # 1. Resolve waste percentage
        waste_param = "food_waste_percentage"
        waste_assump = resolved_assumptions.get(waste_param)

        waste_rate: Optional[Decimal] = None
        waste_rate_source: Optional[str] = None

        if waste_assump and waste_assump.is_resolved and waste_assump.value:
            try:
                rate_val = Decimal(waste_assump.value)
                if rate_val > 1:
                    rate_val = rate_val / Decimal("100")
                waste_rate = max(Decimal("0.0"), min(Decimal("1.0"), rate_val))
                waste_rate_source = f"ASSUMPTION ({waste_assump.source_type.value})"
                assumptions_used.append(waste_assump)
            except Exception:
                missing_assumptions.append(waste_param)
        else:
            missing_assumptions.append(waste_param)

        # 2. Resolve serving weight (kg)
        weight_param = "food_serving_weight_kg_default"
        weight_assump = resolved_assumptions.get(weight_param)

        serving_weight_kg: Optional[Decimal] = None
        serving_weight_source: Optional[str] = None

        if weight_assump and weight_assump.is_resolved and weight_assump.value:
            try:
                serving_weight_kg = Decimal(weight_assump.value)
                serving_weight_source = f"ASSUMPTION ({weight_assump.source_type.value})"
                assumptions_used.append(weight_assump)
            except Exception:
                missing_assumptions.append(weight_param)
        else:
            missing_assumptions.append(weight_param)

        # Compute waste servings
        if waste_rate is not None:
            waste_servings = (Decimal(total_servings) * waste_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            for m in meal_results:
                if m.estimated_servings:
                    m.waste_servings = (Decimal(m.estimated_servings) * waste_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            waste_servings = None

        # Compute waste kg
        if waste_servings is not None and serving_weight_kg is not None:
            waste_kg = (waste_servings * serving_weight_kg).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            for m in meal_results:
                if m.waste_servings:
                    m.waste_kg = (m.waste_servings * serving_weight_kg).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            waste_status = WasteEstimationStatus.COMPLETE
        elif waste_servings is not None:
            waste_kg = None
            waste_status = WasteEstimationStatus.SERVINGS_ONLY
        else:
            waste_kg = None
            waste_status = WasteEstimationStatus.UNAVAILABLE

        summary = FoodWasteSummary(
            waste_status=waste_status,
            estimated_waste_servings=waste_servings,
            estimated_waste_kg=waste_kg,
            waste_percentage_used=waste_rate,
            serving_weight_kg_used=serving_weight_kg,
            waste_percentage_source=waste_rate_source,
            serving_weight_source=serving_weight_source,
        )
        return summary, meal_results


food_calculator = FoodCalculator()
