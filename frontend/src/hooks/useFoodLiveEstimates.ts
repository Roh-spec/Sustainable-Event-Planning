import { useMemo } from "react";
import { EventResponse } from "../types/events";
import { FoodPlanResponse, MealInput, DietaryPreference } from "../types/food";

interface UseFoodLiveEstimatesProps {
  event: EventResponse | null;
  meals: MealInput[];
  dietaryPreference: DietaryPreference;
  vegetarianRatio: string;
  costApproach: "ESTIMATE" | "UNIT" | "TOTAL";
  knownUnitCost: string;
  knownTotalCost: string;
  budgetCeiling: string;
  foodPlanResponse: FoodPlanResponse | null;
}

export function useFoodLiveEstimates({
  event,
  meals,
  dietaryPreference,
  vegetarianRatio,
  costApproach,
  knownUnitCost,
  knownTotalCost,
  budgetCeiling,
  foodPlanResponse,
}: UseFoodLiveEstimatesProps) {
  return useMemo(() => {
    const attendees = event?.expected_attendees || 100;
    const ratio = parseFloat(vegetarianRatio) || 0.7;
    const ceiling = parseFloat(budgetCeiling) || 0;

    // Headcount splits
    const vegCount = Math.round(attendees * (dietaryPreference === "VEGETARIAN" ? 1 : dietaryPreference === "NON_VEGETARIAN" ? 0 : ratio));
    const nonVegCount = attendees - vegCount;

    // If backend response is present, use exact calculations from engine
    if (foodPlanResponse?.cost_summary && foodPlanResponse.waste_summary) {
      const totalCost = Number(foodPlanResponse.cost_summary.estimated_total_cost) || 0;
      const surplusKg = Number(foodPlanResponse.waste_summary.estimated_waste_kg) || 0;
      const surplusServings = Number(foodPlanResponse.waste_summary.estimated_waste_servings) || 0;
      const remaining = ceiling - totalCost;

      return {
        totalCost,
        surplusKg,
        surplusServings,
        remainingBudget: remaining,
        isOverBudget: remaining < 0,
        vegCount,
        nonVegCount,
        isCalculated: true,
      };
    }

    // Otherwise, compute live heuristic projection so the receipt is live as inputs change
    const mealCount = meals.length;
    let unitCostEstimate = 120; // default benchmark ₹120/meal

    if (costApproach === "UNIT" && parseFloat(knownUnitCost) > 0) {
      unitCostEstimate = parseFloat(knownUnitCost);
    }

    let projectedCost = 0;
    if (costApproach === "TOTAL" && parseFloat(knownTotalCost) > 0) {
      projectedCost = parseFloat(knownTotalCost);
    } else {
      projectedCost = Math.round(attendees * mealCount * unitCostEstimate * 0.85); // 85% participation benchmark
    }

    // Heuristic surplus: 12% surplus buffer on planned servings (0.40kg per serving)
    const projectedServings = Math.round(attendees * mealCount * 0.85);
    const projectedSurplusServings = Math.round(projectedServings * 0.12);
    const projectedSurplusKg = Number((projectedSurplusServings * 0.4).toFixed(1));
    const remaining = ceiling - projectedCost;

    return {
      totalCost: projectedCost,
      surplusKg: projectedSurplusKg,
      surplusServings: projectedSurplusServings,
      remainingBudget: remaining,
      isOverBudget: remaining < 0,
      vegCount,
      nonVegCount,
      isCalculated: false,
    };
  }, [
    event?.expected_attendees,
    meals.length,
    dietaryPreference,
    vegetarianRatio,
    costApproach,
    knownUnitCost,
    knownTotalCost,
    budgetCeiling,
    foodPlanResponse,
  ]);
}
