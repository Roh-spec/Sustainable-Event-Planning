"""
Pure calculation engine for the Waste Planning Module.
Decoupled completely from database and FastAPI layers.
Inputs, food estimates, and resolved assumptions are injected directly.
"""

from decimal import Decimal
from typing import Dict, List, Optional, Tuple

from backend.app.planning.modules.waste.rules import waste_rules_engine
from backend.app.planning.modules.waste.schemas import (
    CalculationBasis,
    FoodWasteInput,
    FoodWasteResult,
    OtherWasteItemResult,
    OtherWasteSummary,
    PackagingItemResult,
    PackagingWasteSummary,
    PlasticItemResult,
    PlasticWasteSummary,
    WasteCalculationStatus,
    WastePlanRequest,
    WastePlanResponse,
    WasteSourceType,
)
from backend.app.schemas.assumption import AssumptionSourceType, ResolvedAssumption


class WasteCalculator:
    """
    Pure calculation engine for Waste Planning.
    Executes deterministic quantity calculations across Food, Packaging,
    Plastic, and Other waste categories without side effects.
    """

    @staticmethod
    def _map_assumption_source_type(assump: ResolvedAssumption) -> WasteSourceType:
        """
        Maps an assumption's source provenance to the standardized WasteSourceType enum.
        Preserves REFERENCE, ACTUAL, ML_PREDICTED, USER_PROVIDED, and ESTIMATED.
        """
        if assump.source_type == AssumptionSourceType.REFERENCE:
            return WasteSourceType.REFERENCE
        if assump.source_type == AssumptionSourceType.ACTUAL:
            return WasteSourceType.ACTUAL
        if assump.source_type == AssumptionSourceType.ML_PREDICTED:
            return WasteSourceType.ML_PREDICTED
        if assump.source_type == AssumptionSourceType.USER_PROVIDED:
            return WasteSourceType.USER_PROVIDED
        return WasteSourceType.ESTIMATED

    @classmethod
    def calculate(
        cls,
        request: WastePlanRequest,
        event_name: str,
        event_type: str,
        expected_attendees: int,
        resolved_assumptions: Dict[str, ResolvedAssumption],
        precomputed_food_waste: Optional[Tuple[Optional[Decimal], Optional[Decimal]]] = None,
    ) -> WastePlanResponse:
        """
        Calculates waste estimates across all requested categories.
        """
        missing_assumptions: List[str] = []
        warnings: List[str] = []
        assumptions_used: List[ResolvedAssumption] = []

        attendees = request.attendee_count or expected_attendees
        default_meals = request.meals_count or 1

        all_packaging_valid = True
        all_plastic_valid = True
        all_other_valid = True

        # -----------------------------------------------------------------
        # 1. Food Waste Processing
        # -----------------------------------------------------------------
        food_waste_result: Optional[FoodWasteResult] = None

        if request.food_waste is not None:
            est_servings: Optional[Decimal] = None
            est_kg: Optional[Decimal] = None

            if request.food_waste.estimated_food_waste_servings is not None:
                est_servings = request.food_waste.estimated_food_waste_servings
                est_kg = request.food_waste.estimated_food_waste_kg
            elif precomputed_food_waste is not None:
                est_servings, est_kg = precomputed_food_waste

            user_override = request.food_waste.user_override_servings

            if user_override is not None:
                planning_servings = user_override
                planning_source = WasteSourceType.USER_PROVIDED
                if est_servings is not None:
                    explanation = (
                        f"Food waste estimate of {est_servings} servings overridden by user to {planning_servings} servings."
                    )
                else:
                    explanation = f"User-provided food waste quantity: {planning_servings} servings."
            elif est_servings is not None:
                planning_servings = est_servings
                planning_source = WasteSourceType.ESTIMATED
                explanation = f"{planning_servings} servings of food waste estimated by the Food Module."
            else:
                planning_servings = None
                planning_source = None
                explanation = "No food waste estimate provided or available."

            food_waste_result = FoodWasteResult(
                estimated_servings=est_servings,
                estimated_kg=est_kg,
                user_override_servings=user_override,
                planning_servings=planning_servings,
                planning_source=planning_source,
                explanation=explanation,
            )

        # -----------------------------------------------------------------
        # 2. Packaging Waste Estimation
        # -----------------------------------------------------------------
        packaging_results: List[PackagingItemResult] = []

        for item in request.packaging_items:
            item_key = item.item_type.value.lower()
            item_display = item.custom_name or item.item_type.value.capitalize()
            meals = item.meals_count or default_meals

            total_qty: Optional[Decimal] = None
            source_type: Optional[WasteSourceType] = None
            explanation: str = ""

            # A. Derive Total Quantity
            if item.calculation_basis == CalculationBasis.PER_PERSON:
                if item.units_per_basis is not None:
                    rate = item.units_per_basis
                    total_qty = Decimal(attendees) * rate
                    source_type = WasteSourceType.USER_PROVIDED
                    explanation = f"{attendees} attendees × {rate} per person = {int(total_qty)} {item_display}s"
                else:
                    param = f"packaging_{item_key}_per_person"
                    assump = resolved_assumptions.get(param)
                    if assump and assump.is_resolved and assump.value:
                        try:
                            rate = Decimal(assump.value)
                            total_qty = Decimal(attendees) * rate
                            source_type = cls._map_assumption_source_type(assump)
                            assumptions_used.append(assump)
                            explanation = f"{attendees} attendees × {rate} per person = {int(total_qty)} {item_display}s"
                        except Exception:
                            missing_assumptions.append(param)
                            source_type = None
                            explanation = f"Invalid value in assumption {param}."
                    else:
                        missing_assumptions.append(param)
                        source_type = None
                        explanation = f"Unable to estimate because no {param} assumption is configured."

            elif item.calculation_basis == CalculationBasis.PER_MEAL:
                if item.units_per_basis is not None:
                    rate = item.units_per_basis
                    total_qty = Decimal(attendees) * Decimal(meals) * rate
                    source_type = WasteSourceType.USER_PROVIDED
                    explanation = f"{attendees} attendees × {meals} meals × {rate} per meal = {int(total_qty)} {item_display}s"
                else:
                    param = f"packaging_{item_key}_per_meal"
                    assump = resolved_assumptions.get(param)
                    if assump and assump.is_resolved and assump.value:
                        try:
                            rate = Decimal(assump.value)
                            total_qty = Decimal(attendees) * Decimal(meals) * rate
                            source_type = cls._map_assumption_source_type(assump)
                            assumptions_used.append(assump)
                            explanation = f"{attendees} attendees × {meals} meals × {rate} per meal = {int(total_qty)} {item_display}s"
                        except Exception:
                            missing_assumptions.append(param)
                            source_type = None
                            explanation = f"Invalid value in assumption {param}."
                    else:
                        missing_assumptions.append(param)
                        source_type = None
                        explanation = f"Unable to estimate because no {param} assumption is configured."

            elif item.calculation_basis == CalculationBasis.PER_EVENT:
                if item.units_per_basis is not None:
                    rate = item.units_per_basis
                    total_qty = rate
                    source_type = WasteSourceType.USER_PROVIDED
                    explanation = f"1 event × {rate} configured quantity = {int(total_qty)} {item_display}s"
                else:
                    param = f"packaging_{item_key}_per_event"
                    assump = resolved_assumptions.get(param)
                    if assump and assump.is_resolved and assump.value:
                        try:
                            rate = Decimal(assump.value)
                            total_qty = rate
                            source_type = cls._map_assumption_source_type(assump)
                            assumptions_used.append(assump)
                            explanation = f"1 event × {rate} configured quantity = {int(total_qty)} {item_display}s"
                        except Exception:
                            missing_assumptions.append(param)
                            source_type = None
                            explanation = f"Invalid value in assumption {param}."
                    else:
                        missing_assumptions.append(param)
                        source_type = None
                        explanation = f"Unable to estimate because no {param} assumption is configured."

            elif item.calculation_basis == CalculationBasis.CUSTOM:
                if item.user_total_quantity is not None:
                    total_qty = item.user_total_quantity
                    source_type = WasteSourceType.USER_PROVIDED
                    explanation = f"User-provided custom quantity = {int(total_qty)} {item_display}s"
                else:
                    total_qty = None
                    source_type = None
                    explanation = f"Custom quantity for {item_display} was not provided."

            # B. Derive Reusable vs Single-Use Split
            reusable_qty: Optional[Decimal] = None
            single_use_qty: Optional[Decimal] = None
            is_split_resolved: bool = True

            if total_qty is not None:
                # 1. User specified both explicitly
                if item.user_reusable_quantity is not None and item.user_single_use_quantity is not None:
                    if item.user_reusable_quantity + item.user_single_use_quantity > total_qty:
                        raise ValueError(
                            f"Sum of reusable ({item.user_reusable_quantity}) and single-use ({item.user_single_use_quantity}) "
                            f"quantities exceeds total ({total_qty}) for {item_display}."
                        )
                    reusable_qty = item.user_reusable_quantity
                    single_use_qty = item.user_single_use_quantity
                    is_split_resolved = True
                # 2. User specified reusable only
                elif item.user_reusable_quantity is not None:
                    if item.user_reusable_quantity > total_qty:
                        raise ValueError(
                            f"Reusable quantity ({item.user_reusable_quantity}) exceeds total ({total_qty}) for {item_display}."
                        )
                    reusable_qty = item.user_reusable_quantity
                    single_use_qty = total_qty - reusable_qty
                    is_split_resolved = True
                # 3. User specified single-use only
                elif item.user_single_use_quantity is not None:
                    if item.user_single_use_quantity > total_qty:
                        raise ValueError(
                            f"Single-use quantity ({item.user_single_use_quantity}) exceeds total ({total_qty}) for {item_display}."
                        )
                    single_use_qty = item.user_single_use_quantity
                    reusable_qty = total_qty - single_use_qty
                    is_split_resolved = True
                # 4. Resolve split from Assumption Engine
                else:
                    reusable_param = f"reusable_ratio_{item_key}"
                    single_use_param = f"single_use_ratio_{item_key}"
                    reusable_assump = resolved_assumptions.get(reusable_param)
                    single_use_assump = resolved_assumptions.get(single_use_param)

                    if reusable_assump and reusable_assump.is_resolved and reusable_assump.value:
                        try:
                            ratio = Decimal(reusable_assump.value)
                            if ratio > 1:
                                ratio = ratio / Decimal("100")
                            ratio = max(Decimal("0.0"), min(Decimal("1.0"), ratio))
                            reusable_qty = Decimal(round(float(total_qty * ratio)))
                            single_use_qty = total_qty - reusable_qty
                            is_split_resolved = True
                            assumptions_used.append(reusable_assump)
                            explanation += f" (Split via {reusable_param}: {ratio * 100:.0f}% reusable)"
                        except Exception:
                            is_split_resolved = False
                            missing_assumptions.append(reusable_param)
                    elif single_use_assump and single_use_assump.is_resolved and single_use_assump.value:
                        try:
                            ratio = Decimal(single_use_assump.value)
                            if ratio > 1:
                                ratio = ratio / Decimal("100")
                            ratio = max(Decimal("0.0"), min(Decimal("1.0"), ratio))
                            single_use_qty = Decimal(round(float(total_qty * ratio)))
                            reusable_qty = total_qty - single_use_qty
                            is_split_resolved = True
                            assumptions_used.append(single_use_assump)
                            explanation += f" (Split via {single_use_param}: {ratio * 100:.0f}% single-use)"
                        except Exception:
                            is_split_resolved = False
                            missing_assumptions.append(single_use_param)
                    else:
                        reusable_qty = None
                        single_use_qty = None
                        is_split_resolved = False
                        missing_assumptions.append(reusable_param)
                        explanation += f" (Reusable/single-use split unresolved: no {reusable_param} or {single_use_param} configured)"
            else:
                is_split_resolved = False

            if total_qty is None or not is_split_resolved:
                all_packaging_valid = False

            packaging_results.append(
                PackagingItemResult(
                    item_name=item_display,
                    item_type=item.item_type,
                    calculation_basis=item.calculation_basis,
                    total_quantity=total_qty,
                    reusable_quantity=reusable_qty,
                    single_use_quantity=single_use_qty,
                    is_split_resolved=is_split_resolved,
                    source_type=source_type,
                    explanation=explanation,
                )
            )

        # Consolidate packaging summary
        valid_totals = [p.total_quantity for p in packaging_results if p.total_quantity is not None]
        valid_reusable = [p.reusable_quantity for p in packaging_results if p.reusable_quantity is not None]
        valid_single_use = [p.single_use_quantity for p in packaging_results if p.single_use_quantity is not None]

        total_packaging_items = sum(valid_totals) if valid_totals else None
        total_reusable_items = sum(valid_reusable) if valid_reusable else None
        total_single_use_items = sum(valid_single_use) if valid_single_use else None

        reusable_pct = None
        if total_packaging_items and total_packaging_items > Decimal("0") and total_reusable_items is not None:
            reusable_pct = Decimal(round(float((total_reusable_items / total_packaging_items) * Decimal("100")), 1))

        packaging_summary = PackagingWasteSummary(
            total_items=total_packaging_items,
            total_reusable_items=total_reusable_items,
            total_single_use_items=total_single_use_items,
            reusable_percentage=reusable_pct,
            items=packaging_results,
        )

        # -----------------------------------------------------------------
        # 3. Plastic Waste Estimation
        # -----------------------------------------------------------------
        plastic_results: List[PlasticItemResult] = []

        for item in request.plastic_items:
            item_key = item.item_type.value.lower()
            item_display = item.custom_name or item.item_type.value.replace("_", " ").title()
            meals = item.meals_count or default_meals

            est_qty: Optional[Decimal] = None
            planning_qty: Optional[Decimal] = None
            user_override: Optional[Decimal] = None
            source_type: Optional[WasteSourceType] = None
            explanation: str = ""

            # Estimate quantity
            if item.calculation_basis == CalculationBasis.PER_PERSON:
                if item.units_per_basis is not None:
                    rate = item.units_per_basis
                    est_qty = Decimal(attendees) * rate
                    source_type = WasteSourceType.USER_PROVIDED
                    explanation = f"{attendees} attendees × {rate} per person = {int(est_qty)} {item_display}s"
                else:
                    param = f"plastic_{item_key}_per_person"
                    assump = resolved_assumptions.get(param)
                    if assump and assump.is_resolved and assump.value:
                        try:
                            rate = Decimal(assump.value)
                            est_qty = Decimal(attendees) * rate
                            source_type = cls._map_assumption_source_type(assump)
                            assumptions_used.append(assump)
                            explanation = f"{attendees} attendees × {rate} per person = {int(est_qty)} {item_display}s"
                        except Exception:
                            missing_assumptions.append(param)
                            source_type = None
                            explanation = f"Invalid value in assumption {param}."
                    else:
                        missing_assumptions.append(param)
                        source_type = None
                        explanation = f"Unable to estimate because no {param} assumption is configured."

            elif item.calculation_basis == CalculationBasis.PER_MEAL:
                if item.units_per_basis is not None:
                    rate = item.units_per_basis
                    est_qty = Decimal(attendees) * Decimal(meals) * rate
                    source_type = WasteSourceType.USER_PROVIDED
                    explanation = f"{attendees} attendees × {meals} meals × {rate} per meal = {int(est_qty)} {item_display}s"
                else:
                    param = f"plastic_{item_key}_per_meal"
                    assump = resolved_assumptions.get(param)
                    if assump and assump.is_resolved and assump.value:
                        try:
                            rate = Decimal(assump.value)
                            est_qty = Decimal(attendees) * Decimal(meals) * rate
                            source_type = cls._map_assumption_source_type(assump)
                            assumptions_used.append(assump)
                            explanation = f"{attendees} attendees × {meals} meals × {rate} per meal = {int(est_qty)} {item_display}s"
                        except Exception:
                            missing_assumptions.append(param)
                            source_type = None
                            explanation = f"Invalid value in assumption {param}."
                    else:
                        missing_assumptions.append(param)
                        source_type = None
                        explanation = f"Unable to estimate because no {param} assumption is configured."

            elif item.calculation_basis == CalculationBasis.PER_EVENT:
                if item.units_per_basis is not None:
                    rate = item.units_per_basis
                    est_qty = rate
                    source_type = WasteSourceType.USER_PROVIDED
                    explanation = f"1 event × {rate} configured quantity = {int(est_qty)} {item_display}s"
                else:
                    param = f"plastic_{item_key}_per_event"
                    assump = resolved_assumptions.get(param)
                    if assump and assump.is_resolved and assump.value:
                        try:
                            rate = Decimal(assump.value)
                            est_qty = rate
                            source_type = cls._map_assumption_source_type(assump)
                            assumptions_used.append(assump)
                            explanation = f"1 event × {rate} configured quantity = {int(est_qty)} {item_display}s"
                        except Exception:
                            missing_assumptions.append(param)
                            source_type = None
                            explanation = f"Invalid value in assumption {param}."
                    else:
                        missing_assumptions.append(param)
                        source_type = None
                        explanation = f"Unable to estimate because no {param} assumption is configured."

            elif item.calculation_basis == CalculationBasis.CUSTOM:
                if item.user_override_quantity is not None:
                    est_qty = item.user_override_quantity
                    source_type = WasteSourceType.USER_PROVIDED
                    explanation = f"User-provided custom quantity = {int(est_qty)} {item_display}s"
                else:
                    est_qty = None
                    source_type = None
                    explanation = f"Custom quantity for {item_display} was not provided."

            # Determine user override or participation adjustment
            if item.user_override_quantity is not None:
                planning_qty = item.user_override_quantity
                user_override = planning_qty
                source_type = WasteSourceType.USER_PROVIDED
                explanation += f" (Planning quantity overridden by user: {int(planning_qty)})"
            elif item.participation_rate is not None and est_qty is not None:
                planning_qty = Decimal(round(float(est_qty * item.participation_rate)))
                user_override = planning_qty
                source_type = WasteSourceType.USER_PROVIDED
                explanation += f" (Adjusted by user-provided participation rate {item.participation_rate * 100:.0f}%: {int(planning_qty)})"
            else:
                planning_qty = est_qty

            if planning_qty is None:
                all_plastic_valid = False

            plastic_results.append(
                PlasticItemResult(
                    item_name=item_display,
                    item_type=item.item_type,
                    calculation_basis=item.calculation_basis,
                    estimated_quantity=est_qty,
                    user_override_quantity=user_override,
                    planning_quantity=planning_qty,
                    source_type=source_type,
                    explanation=explanation,
                )
            )

        valid_plastic = [p.planning_quantity for p in plastic_results if p.planning_quantity is not None]
        total_plastic_items = sum(valid_plastic) if valid_plastic else None

        plastic_summary = PlasticWasteSummary(
            total_planning_items=total_plastic_items,
            items=plastic_results,
        )

        # -----------------------------------------------------------------
        # 4. Other Waste Estimation
        # -----------------------------------------------------------------
        other_results: List[OtherWasteItemResult] = []

        for item in request.other_waste_items:
            item_key = item.name.lower().replace(" ", "_")
            qty: Optional[Decimal] = None
            source_type: Optional[WasteSourceType] = None
            explanation = ""

            if item.calculation_basis == CalculationBasis.CUSTOM or item.quantity is not None:
                qty = item.quantity
                source_type = WasteSourceType.USER_PROVIDED if qty is not None else None
                explanation = f"User-provided quantity: {qty} {item.unit}" if qty is not None else "Quantity not provided."
            elif item.calculation_basis == CalculationBasis.PER_PERSON:
                if item.units_per_basis is not None:
                    rate = item.units_per_basis
                    qty = Decimal(attendees) * rate
                    source_type = WasteSourceType.USER_PROVIDED
                    explanation = f"{attendees} attendees × {rate} per person = {qty} {item.unit}"
                else:
                    param = f"other_{item_key}_per_person"
                    assump = resolved_assumptions.get(param)
                    if assump and assump.is_resolved and assump.value:
                        try:
                            rate = Decimal(assump.value)
                            qty = Decimal(attendees) * rate
                            source_type = cls._map_assumption_source_type(assump)
                            assumptions_used.append(assump)
                            explanation = f"{attendees} attendees × {rate} per person = {qty} {item.unit}"
                        except Exception:
                            missing_assumptions.append(param)
                            source_type = None
                            explanation = f"Invalid value in assumption {param}."
                    else:
                        missing_assumptions.append(param)
                        source_type = None
                        explanation = f"Unable to estimate because no {param} assumption is configured."
            elif item.calculation_basis == CalculationBasis.PER_EVENT:
                if item.units_per_basis is not None:
                    rate = item.units_per_basis
                    qty = rate
                    source_type = WasteSourceType.USER_PROVIDED
                    explanation = f"1 event × {rate} configured quantity = {qty} {item.unit}"
                else:
                    param = f"other_{item_key}_per_event"
                    assump = resolved_assumptions.get(param)
                    if assump and assump.is_resolved and assump.value:
                        try:
                            rate = Decimal(assump.value)
                            qty = rate
                            source_type = cls._map_assumption_source_type(assump)
                            assumptions_used.append(assump)
                            explanation = f"1 event × {rate} configured quantity = {qty} {item.unit}"
                        except Exception:
                            missing_assumptions.append(param)
                            source_type = None
                            explanation = f"Invalid value in assumption {param}."
                    else:
                        missing_assumptions.append(param)
                        source_type = None
                        explanation = f"Unable to estimate because no {param} assumption is configured."

            if qty is None:
                all_other_valid = False

            other_results.append(
                OtherWasteItemResult(
                    name=item.name,
                    category=item.category,
                    calculation_basis=item.calculation_basis,
                    quantity=qty,
                    unit=item.unit,
                    source_type=source_type,
                    explanation=explanation,
                )
            )

        valid_other = [o.quantity for o in other_results if o.quantity is not None]
        total_other_items = sum(valid_other) if valid_other else None

        other_summary = OtherWasteSummary(
            total_items=total_other_items,
            items=other_results,
        )

        # -----------------------------------------------------------------
        # 5. Calculation Status Determination
        # -----------------------------------------------------------------
        has_items = bool(request.packaging_items or request.plastic_items or request.other_waste_items or request.food_waste)

        if not has_items:
            status = WasteCalculationStatus.COMPLETE
        elif not all_packaging_valid or not all_plastic_valid or not all_other_valid:
            if total_packaging_items is None and total_plastic_items is None and total_other_items is None and (food_waste_result is None or food_waste_result.planning_servings is None):
                status = WasteCalculationStatus.BLOCKED
                warnings.append("Waste calculations blocked due to unresolvable assumptions across all items.")
            else:
                status = WasteCalculationStatus.PARTIAL
                warnings.append("Some waste quantities or splits could not be estimated due to missing assumptions.")
        else:
            status = WasteCalculationStatus.COMPLETE

        # -----------------------------------------------------------------
        # 6. Recommendations Generation
        # -----------------------------------------------------------------
        unique_missing = list(dict.fromkeys(missing_assumptions))

        recommendations = waste_rules_engine.generate_recommendations(
            food_waste=food_waste_result,
            packaging_summary=packaging_summary,
            plastic_summary=plastic_summary,
            other_summary=other_summary,
            missing_assumptions=unique_missing,
        )

        unique_warnings = list(dict.fromkeys(warnings))

        return WastePlanResponse(
            event_id=request.event_id,
            event_name=event_name,
            event_type=event_type,
            expected_attendees=expected_attendees,
            status=status,
            food_waste=food_waste_result,
            packaging_waste=packaging_summary,
            plastic_waste=plastic_summary,
            other_waste=other_summary,
            recommendations=recommendations,
            assumptions_used=assumptions_used,
            missing_assumptions=unique_missing,
            warnings=unique_warnings,
        )


waste_calculator = WasteCalculator()
