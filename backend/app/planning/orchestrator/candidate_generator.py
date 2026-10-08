"""
Deterministic candidate configuration generator for the Planning Engine.
Generates meaningful, configuration-driven planning alternatives based strictly on
legitimate domain variables (packaging reusability, plastic minimization, menu options).
Guarantees:
- Fixed attendees, event duration, event type, and location.
- No arbitrary food quantity cuts (servings per person are fixed).
- Every variation has an explicit, traceable basis.
- Duplicate candidates are automatically removed.
"""

from copy import deepcopy
from decimal import Decimal
from typing import List, Optional

from backend.app.planning.modules.food.schemas import DietaryPreference, FoodPlanRequest
from backend.app.planning.modules.waste.schemas import (
    CalculationBasis,
    PackagingItemInput,
    PlasticItemInput,
    WastePlanRequest,
)
from backend.app.planning.orchestrator.schemas import (
    CandidateConfiguration,
    PlanningRequest,
)
from backend.app.schemas.constraint import ConstraintBase, ConstraintType


class CandidateGenerator:
    """
    Generates deterministic candidate configurations for an event planning request.
    """

    @classmethod
    def generate_candidates(
        cls,
        request: PlanningRequest,
        expected_attendees: int,
        constraints: Optional[List[ConstraintBase]] = None,
    ) -> List[CandidateConfiguration]:
        """
        Generates distinct, valid candidate configurations.
        Attendees and event parameters remain strictly fixed across all candidates.
        """
        candidates: List[CandidateConfiguration] = []
        raw_constraints = constraints or request.constraints

        food_req = request.module_context.food if request.module_context else None
        waste_req = request.module_context.waste if request.module_context else None

        # -----------------------------------------------------------------
        # 1. Baseline Candidate: Organizer's direct inputs / default assumptions
        # -----------------------------------------------------------------
        cand_baseline = CandidateConfiguration(
            candidate_id="cand_baseline",
            name="Baseline Configuration",
            description="Direct planner inputs with standard domain assumption parameters.",
            food_config=deepcopy(food_req),
            waste_config=deepcopy(waste_req),
            basis_notes=["Organizer inputs and default reference assumptions."],
        )
        candidates.append(cand_baseline)

        # -----------------------------------------------------------------
        # 2. Maximum Reusable Packaging Candidate
        # -----------------------------------------------------------------
        if waste_req and waste_req.packaging_items:
            reusable_waste_req = deepcopy(waste_req)
            has_variation = False

            for pkg in reusable_waste_req.packaging_items:
                # If user hasn't explicitly locked single-use to total
                if pkg.user_single_use_quantity is None or pkg.user_single_use_quantity > 0:
                    # Configure 100% reusable split
                    if pkg.calculation_basis == CalculationBasis.PER_PERSON:
                        pkg.user_reusable_quantity = Decimal(expected_attendees) * (pkg.units_per_basis or Decimal("1"))
                        pkg.user_single_use_quantity = Decimal("0")
                        has_variation = True
                    elif pkg.calculation_basis == CalculationBasis.PER_EVENT:
                        pkg.user_reusable_quantity = pkg.units_per_basis or Decimal("1")
                        pkg.user_single_use_quantity = Decimal("0")
                        has_variation = True
                    elif pkg.calculation_basis == CalculationBasis.CUSTOM and pkg.user_total_quantity:
                        pkg.user_reusable_quantity = pkg.user_total_quantity
                        pkg.user_single_use_quantity = Decimal("0")
                        has_variation = True

            if has_variation:
                candidates.append(
                    CandidateConfiguration(
                        candidate_id="cand_max_reusable",
                        name="High-Reusability Packaging",
                        description="Maximizes washable, reusable plates, cups, and cutlery to eliminate single-use packaging.",
                        food_config=deepcopy(food_req),
                        waste_config=reusable_waste_req,
                        basis_notes=["100% reusable packaging configured across all catering items."],
                    )
                )

        # -----------------------------------------------------------------
        # 3. Plastic Minimization Candidate
        # -----------------------------------------------------------------
        if waste_req and waste_req.plastic_items:
            plastic_min_req = deepcopy(waste_req)
            has_variation = False

            for plastic in plastic_min_req.plastic_items:
                # Transition individual disposable items to bulk dispenser / refillable alternative (0 count)
                plastic.user_override_quantity = Decimal("0")
                plastic.participation_rate = Decimal("0.0")
                has_variation = True

            if has_variation:
                candidates.append(
                    CandidateConfiguration(
                        candidate_id="cand_plastic_min",
                        name="Plastic-Free Water & Service",
                        description="Replaces disposable plastic bottles and cups with refillable stations and bulk dispensers.",
                        food_config=deepcopy(food_req),
                        waste_config=plastic_min_req,
                        basis_notes=["Elimination of single-use plastic bottles via refillable bulk water stations."],
                    )
                )

        # -----------------------------------------------------------------
        # 4. Comprehensive Eco Candidate (Reusable + Plastic-Free)
        # -----------------------------------------------------------------
        if (
            waste_req
            and waste_req.packaging_items
            and waste_req.plastic_items
            and len(candidates) >= 3
        ):
            eco_waste_req = deepcopy(waste_req)
            for pkg in eco_waste_req.packaging_items:
                if pkg.calculation_basis == CalculationBasis.PER_PERSON:
                    pkg.user_reusable_quantity = Decimal(expected_attendees) * (pkg.units_per_basis or Decimal("1"))
                    pkg.user_single_use_quantity = Decimal("0")
                elif pkg.calculation_basis == CalculationBasis.PER_EVENT:
                    pkg.user_reusable_quantity = pkg.units_per_basis or Decimal("1")
                    pkg.user_single_use_quantity = Decimal("0")
                elif pkg.calculation_basis == CalculationBasis.CUSTOM and pkg.user_total_quantity:
                    pkg.user_reusable_quantity = pkg.user_total_quantity
                    pkg.user_single_use_quantity = Decimal("0")

            for plastic in eco_waste_req.plastic_items:
                plastic.user_override_quantity = Decimal("0")
                plastic.participation_rate = Decimal("0.0")

            candidates.append(
                CandidateConfiguration(
                    candidate_id="cand_comprehensive_eco",
                    name="Comprehensive Zero-Waste",
                    description="Combines 100% reusable serviceware with complete elimination of single-use plastic items.",
                    food_config=deepcopy(food_req),
                    waste_config=eco_waste_req,
                    basis_notes=[
                        "100% reusable packaging serviceware.",
                        "Complete substitution of disposable plastic items with bulk refillable alternatives.",
                    ],
                )
            )

        # -----------------------------------------------------------------
        # 5. Plant-Forward Menu Variation (if MIXED food preference is active)
        # -----------------------------------------------------------------
        if food_req and food_req.default_dietary_preference == DietaryPreference.MIXED:
            # Check if constraints prohibit vegetarian
            prohibits_veg = any(
                c.constraint_type == ConstraintType.NOT_ALLOWED and "VEG" in (c.value or "").upper()
                for c in raw_constraints
            )
            if not prohibits_veg:
                veg_food_req = deepcopy(food_req)
                veg_food_req.vegetarian_ratio = Decimal("1.00")  # 100% vegetarian menu
                for m in veg_food_req.meals:
                    m.dietary_preference = DietaryPreference.VEGETARIAN

                candidates.append(
                    CandidateConfiguration(
                        candidate_id="cand_plant_forward",
                        name="Plant-Forward Menu",
                        description="100% vegetarian catering menu reducing food cost and agricultural footprint.",
                        food_config=veg_food_req,
                        waste_config=deepcopy(waste_req),
                        basis_notes=["Vegetarian menu transition without reducing serving portions per person."],
                    )
                )

        # -----------------------------------------------------------------
        # Deduplication: Remove candidates with identical configurations
        # -----------------------------------------------------------------
        unique_candidates: List[CandidateConfiguration] = []
        seen_fingerprints = set()

        for cand in candidates:
            # Fingerprint based on serialized configs
            f_dump = cand.food_config.model_dump_json() if cand.food_config else ""
            w_dump = cand.waste_config.model_dump_json() if cand.waste_config else ""
            fp = (f_dump, w_dump)

            if fp not in seen_fingerprints:
                seen_fingerprints.add(fp)
                unique_candidates.append(cand)

        return unique_candidates


candidate_generator = CandidateGenerator()
