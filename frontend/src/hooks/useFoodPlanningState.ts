import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import {
  MealType,
  DietaryPreference,
  MealInput,
  FoodPlanRequest,
} from "../types/food";
import { foodApi } from "../api/food";
import { useFoodLiveEstimates } from "./useFoodLiveEstimates";

export const useFoodPlanningState = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    loadEvent,
    budget,
    foodConfig,
    setFoodConfig,
    foodPlanResponse,
    setFoodPlanResponse,
  } = usePlanningWizard();

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState<boolean>(false);
  const [isExplainOpen, setIsExplainOpen] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const durationDays =
    event?.duration_days && event.duration_days > 0 ? event.duration_days : 1;

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) =>
        setApiError(`Failed to load event details: ${err.message}`),
      );
    }
  }, [eventId]);

  useEffect(() => {
    if (selectedDay > durationDays) {
      setSelectedDay(1);
    }
  }, [durationDays]);

  const handleToggleMeal = (mealType: MealType, day: number) => {
    setValidationError(null);
    setFoodConfig((prev) => {
      const exists = prev.meals.some(
        (m) => m.meal_type === mealType && m.day === day,
      );
      if (exists) {
        return {
          ...prev,
          meals: prev.meals.filter(
            (m) => !(m.meal_type === mealType && m.day === day),
          ),
        };
      } else {
        const newMeal: MealInput = {
          meal_type: mealType,
          day: day,
          name:
            durationDays > 1
              ? `Day ${day} ${mealType.toLowerCase()}`
              : undefined,
        };
        return {
          ...prev,
          meals: [...prev.meals, newMeal],
        };
      }
    });
  };

  const handleCopyMealsToAllDays = () => {
    setValidationError(null);
    const currentDayMeals = foodConfig.meals.filter(
      (m) => m.day === selectedDay,
    );
    if (currentDayMeals.length === 0) return;

    setFoodConfig((prev) => {
      const newMeals: MealInput[] = [];
      for (let d = 1; d <= durationDays; d++) {
        currentDayMeals.forEach((cm) => {
          newMeals.push({
            ...cm,
            day: d,
            name: `Day ${d} ${cm.meal_type.toLowerCase()}`,
          });
        });
      }
      return {
        ...prev,
        meals: newMeals,
      };
    });
  };

  const handleDietaryChange = (pref: DietaryPreference) => {
    setFoodConfig((prev) => ({
      ...prev,
      default_dietary_preference: pref,
      vegetarian_ratio:
        pref === "MIXED"
          ? prev.vegetarian_ratio || "0.70"
          : prev.vegetarian_ratio,
    }));
  };

  const handleBudgetModeChange = (mode: "ESTIMATE" | "ENTER") => {
    setFoodConfig((prev) => ({
      ...prev,
      budgetMode: mode,
    }));
  };

  const handleCalculateFoodEstimates = async () => {
    setValidationError(null);
    setApiError(null);

    if (foodConfig.meals.length === 0) {
      setValidationError(
        "Please select at least one meal to serve before calculating estimates.",
      );
      return;
    }

    if (!event) {
      setApiError(
        "Event details are still loading. Please try again in a moment.",
      );
      return;
    }

    setIsCalculating(true);

    try {
      const requestPayload: FoodPlanRequest = {
        event_id: event.id,
        meals: foodConfig.meals,
        default_dietary_preference: foodConfig.default_dietary_preference,
        vegetarian_ratio:
          foodConfig.default_dietary_preference === "MIXED" &&
          foodConfig.vegetarian_ratio
            ? Number(foodConfig.vegetarian_ratio)
            : undefined,
        food_budget:
          foodConfig.budgetMode === "ENTER" &&
          foodConfig.food_budget &&
          Number(foodConfig.food_budget) > 0
            ? Number(foodConfig.food_budget)
            : undefined,
        known_unit_cost:
          foodConfig.costApproach === "UNIT" &&
          foodConfig.known_unit_cost &&
          Number(foodConfig.known_unit_cost) > 0
            ? Number(foodConfig.known_unit_cost)
            : undefined,
        known_total_cost:
          foodConfig.costApproach === "TOTAL" &&
          foodConfig.known_total_cost &&
          Number(foodConfig.known_total_cost) > 0
            ? Number(foodConfig.known_total_cost)
            : undefined,
        cost_pricing_unit:
          foodConfig.costApproach === "UNIT"
            ? foodConfig.cost_pricing_unit
            : undefined,
      };

      const response = await foodApi.planFood(requestPayload);
      setFoodPlanResponse(response);
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Unable to calculate food estimates. Please verify your connection and inputs.";
      setApiError(message);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleBack = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/constraints`);
  };

  const handleNext = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/waste`);
  };

  const updateMealCustomization = (
    index: number,
    field: keyof MealInput,
    value: any,
  ) => {
    setFoodConfig((prev) => {
      const updated = [...prev.meals];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          [field]: value === "" ? undefined : value,
        };
      }
      return { ...prev, meals: updated };
    });
  };

  const liveEstimates = useFoodLiveEstimates({
    event,
    meals: foodConfig.meals,
    dietaryPreference: foodConfig.default_dietary_preference,
    vegetarianRatio: foodConfig.vegetarian_ratio || "0.70",
    costApproach: foodConfig.costApproach,
    knownUnitCost: foodConfig.known_unit_cost || "",
    knownTotalCost: foodConfig.known_total_cost || "",
    budgetCeiling:
      budget?.total_budget?.toString() || foodConfig.known_total_cost || "",
    foodPlanResponse,
  });

  return {
    eventId,
    event,
    budget,
    foodConfig,
    setFoodConfig,
    foodPlanResponse,
    selectedDay,
    setSelectedDay,
    isCustomizationOpen,
    setIsCustomizationOpen,
    isExplainOpen,
    setIsExplainOpen,
    isCalculating,
    validationError,
    apiError,
    durationDays,
    handleToggleMeal,
    handleCopyMealsToAllDays,
    handleDietaryChange,
    handleBudgetModeChange,
    handleCalculateFoodEstimates,
    handleBack,
    handleNext,
    updateMealCustomization,
    liveEstimates,
  };
};
