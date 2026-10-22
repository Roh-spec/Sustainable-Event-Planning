import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { WastePlanRequest } from "../types/waste";
import { wasteApi } from "../api/waste";
import { useWasteLiveEstimates } from "./useWasteLiveEstimates";
import {
  DEFAULT_DISPOSABLE_ITEMS,
  DEFAULT_PLASTIC_ITEMS,
  DEFAULT_OTHER_ITEMS,
} from "../components/planning/waste/wastePlanningHelpers";

export const useWastePlanningState = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    loadEvent,
    budget,
    foodConfig,
    foodPlanResponse,
    wasteConfig,
    setWasteConfig,
    wastePlanResponse,
    setWastePlanResponse,
    generatePlans,
    isGenerating,
  } = usePlanningWizard();

  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) =>
        setError(`Failed to load event details: ${err.message}`),
      );
    }
  }, [eventId]);

  const isFoodSelected = wasteConfig.include_food_waste !== false;
  const isDisposableSelected = wasteConfig.packaging_items.length > 0;
  const isPlasticSelected = wasteConfig.plastic_items.length > 0;
  const isOtherSelected = wasteConfig.other_waste_items.length > 0;

  const handleToggleFood = () => {
    setWasteConfig((prev) => ({
      ...prev,
      include_food_waste: !isFoodSelected,
    }));
    setValidationError(null);
  };

  const handleToggleDisposable = () => {
    setWasteConfig((prev) => ({
      ...prev,
      packaging_items: isDisposableSelected ? [] : DEFAULT_DISPOSABLE_ITEMS,
    }));
    setValidationError(null);
  };

  const handleTogglePlastic = () => {
    setWasteConfig((prev) => ({
      ...prev,
      plastic_items: isPlasticSelected ? [] : DEFAULT_PLASTIC_ITEMS,
    }));
    setValidationError(null);
  };

  const handleToggleOther = () => {
    setWasteConfig((prev) => ({
      ...prev,
      other_waste_items: isOtherSelected ? [] : DEFAULT_OTHER_ITEMS,
    }));
    setValidationError(null);
  };

  const handleEstimateWaste = async () => {
    if (!event) {
      setError("Please create or select an event first.");
      return;
    }

    const hasAnySelected =
      isFoodSelected ||
      isDisposableSelected ||
      isPlasticSelected ||
      isOtherSelected;

    if (!hasAnySelected) {
      setValidationError(
        "Please select at least one waste category before estimating.",
      );
      return;
    }

    setIsEstimating(true);
    setError(null);
    setValidationError(null);

    try {
      const requestPayload: WastePlanRequest = {
        event_id: event.id,
        food_waste: isFoodSelected
          ? {
              food_plan_request: {
                event_id: event.id,
                meals: foodConfig.meals,
                default_dietary_preference:
                  foodConfig.default_dietary_preference,
                vegetarian_ratio: foodConfig.vegetarian_ratio
                  ? Number(foodConfig.vegetarian_ratio)
                  : undefined,
              },
              estimated_food_waste_servings:
                foodPlanResponse?.waste_summary?.estimated_waste_servings,
              estimated_food_waste_kg:
                foodPlanResponse?.waste_summary?.estimated_waste_kg,
            }
          : undefined,
        packaging_items: isDisposableSelected
          ? wasteConfig.packaging_items
          : [],
        plastic_items: isPlasticSelected ? wasteConfig.plastic_items : [],
        other_waste_items: isOtherSelected ? wasteConfig.other_waste_items : [],
      };

      const response = await wasteApi.planWaste(requestPayload);
      setWastePlanResponse(response);
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to estimate waste. Please review your event inputs.",
      );
    } finally {
      setIsEstimating(false);
    }
  };

  const handleBack = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/food`);
  };

  const handleContinueToPlans = async () => {
    if (!event) {
      setError("Please create or select an event first.");
      return;
    }

    try {
      await generatePlans();
      const targetId = eventId || event.id;
      navigate(`/events/${targetId}/plans`);
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to generate sustainable plans. Please review inputs.",
      );
    }
  };

  const liveEstimates = useWasteLiveEstimates({
    event,
    includeFoodWaste: isFoodSelected,
    packagingItems: isDisposableSelected ? DEFAULT_DISPOSABLE_ITEMS : [],
    plasticItems: isPlasticSelected ? DEFAULT_PLASTIC_ITEMS : [],
    otherWasteItems: isOtherSelected ? DEFAULT_OTHER_ITEMS : [],
    wastePlanResponse,
    budgetCeiling: budget?.total_budget?.toString() || "",
  });

  return {
    eventId,
    event,
    budget,
    foodConfig,
    wastePlanResponse,
    isExplanationOpen,
    setIsExplanationOpen,
    isEstimating,
    error,
    validationError,
    isGenerating,
    isFoodSelected,
    isDisposableSelected,
    isPlasticSelected,
    isOtherSelected,
    handleToggleFood,
    handleToggleDisposable,
    handleTogglePlastic,
    handleToggleOther,
    handleEstimateWaste,
    handleBack,
    handleContinueToPlans,
    liveEstimates,
  };
};
