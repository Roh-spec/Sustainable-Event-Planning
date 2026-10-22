import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  Package,
  Sparkles,
  Utensils,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Info,
  Clock,
  Layers,
  Recycle,
} from "lucide-react";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";
import {
  WastePlanRequest,
  PackagingItemInput,
  PlasticItemInput,
  OtherWasteItemInput,
} from "../types/waste";
import { wasteApi } from "../api/waste";
import { AnimatedCounter } from "../components/common/AnimatedCounter";
import { useWasteLiveEstimates } from "../hooks/useWasteLiveEstimates";
import { WasteLiveReceipt } from "../components/planning/waste/WasteLiveReceipt";
import { WasteItemRow } from "../components/planning/waste/WasteItemRow";

// Human-readable labels for backend assumption parameters
const PARAMETER_LABEL_MAP: Record<string, string> = {
  packaging_plate_per_person: "Plates needed per attendee",
  packaging_cup_per_person: "Cups needed per attendee",
  packaging_spoon_per_person: "Spoons needed per attendee",
  packaging_fork_per_person: "Forks needed per attendee",
  packaging_glass_per_person: "Glasses needed per attendee",
  packaging_other_per_person: "Other packaging per attendee",
  packaging_plate_per_meal: "Plates needed per meal",
  packaging_cup_per_meal: "Cups needed per meal",
  packaging_spoon_per_meal: "Spoons needed per meal",
  packaging_fork_per_meal: "Forks needed per meal",
  packaging_glass_per_meal: "Glasses needed per meal",
  packaging_plate_per_event: "Plates needed per event",
  packaging_cup_per_event: "Cups needed per event",
  reusable_ratio_plate: "Reusable plates ratio",
  reusable_ratio_cup: "Reusable cups ratio",
  reusable_ratio_spoon: "Reusable spoons ratio",
  reusable_ratio_fork: "Reusable forks ratio",
  reusable_ratio_glass: "Reusable glasses ratio",
  reusable_ratio_other: "Reusable packaging ratio",
  single_use_ratio_plate: "Single-use plates ratio",
  single_use_ratio_cup: "Single-use cups ratio",
  single_use_ratio_spoon: "Single-use spoons ratio",
  single_use_ratio_fork: "Single-use forks ratio",
  single_use_ratio_glass: "Single-use glasses ratio",
  plastic_water_bottle_per_person: "Water bottles per attendee",
  plastic_plastic_bag_per_person: "Plastic bags per attendee",
  plastic_wrapper_per_person: "Wrappers per attendee",
  plastic_plastic_cup_per_person: "Plastic cups per attendee",
  plastic_other_per_person: "Other plastic items per attendee",
  plastic_water_bottle_per_meal: "Water bottles per meal",
  food_waste_percentage: "Food waste rate",
  food_serving_weight_kg_default: "Average meal portion weight",
  other_decorations_per_event: "Decorations needed per event",
  decorations_per_event: "Decorations needed per event",
  other_containers_per_event: "Food containers needed per event",
  containers_per_event: "Food containers needed per event",
};

const getHumanReadableParameter = (param: string): string => {
  if (PARAMETER_LABEL_MAP[param]) {
    return PARAMETER_LABEL_MAP[param];
  }
  return param
    .replace(/^packaging_|^plastic_|^other_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatSourceType = (
  sourceType?: string | null,
): { label: string; isUser: boolean } => {
  if (!sourceType) return { label: "Configured estimate", isUser: false };
  const s = sourceType.toUpperCase();
  if (s === "USER_PROVIDED" || s.includes("USER")) {
    return { label: "Your entered value", isUser: true };
  }
  if (s.includes("REFERENCE")) {
    return { label: "Campus reference benchmark", isUser: false };
  }
  if (s.includes("ACTUAL")) {
    return { label: "Historical event measurement", isUser: false };
  }
  if (s.includes("ML") || s.includes("MODEL")) {
    return { label: "Model estimate", isUser: false };
  }
  return { label: "Configured benchmark estimate", isUser: false };
};

const formatAssumptionValue = (
  param: string,
  value?: string | null,
  unit?: string | null,
): string => {
  if (value == null || value === "") return "Not set";
  const num = Number(value);
  if (!isNaN(num)) {
    if (
      unit === "ratio" ||
      param.includes("rate") ||
      param.includes("percentage") ||
      param.includes("ratio")
    ) {
      const pct = num <= 1 ? Math.round(num * 100) : Math.round(num);
      return `${pct}%`;
    }
    if (unit) {
      return `${num} ${unit}`;
    }
    return String(num);
  }
  return String(value);
};

// Contract-compliant default items for simplified categories
const DEFAULT_DISPOSABLE_ITEMS: PackagingItemInput[] = [
  { item_type: "PLATE", calculation_basis: "PER_PERSON" },
  { item_type: "CUP", calculation_basis: "PER_PERSON" },
];

const DEFAULT_PLASTIC_ITEMS: PlasticItemInput[] = [
  { item_type: "WATER_BOTTLE", calculation_basis: "PER_PERSON" },
];

const DEFAULT_OTHER_ITEMS: OtherWasteItemInput[] = [
  {
    name: "Decorations",
    category: "DECORATIONS",
    calculation_basis: "PER_EVENT",
    unit: "items",
  },
  {
    name: "Containers",
    category: "FOOD_CONTAINERS",
    calculation_basis: "PER_EVENT",
    unit: "items",
  },
];

export const WastePlanningPage: React.FC = () => {
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

  // Collapsible explanation section in results
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  // Loading & error states
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load event if needed
  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) =>
        setError(`Failed to load event details: ${err.message}`),
      );
    }
  }, [eventId]);

  // Category selection states derived from wasteConfig
  const isFoodSelected = wasteConfig.include_food_waste !== false;
  const isDisposableSelected = wasteConfig.packaging_items.length > 0;
  const isPlasticSelected = wasteConfig.plastic_items.length > 0;
  const isOtherSelected = wasteConfig.other_waste_items.length > 0;

  // Toggle Category Handlers
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

  // Submit estimate action
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
      // Build clean request payload adhering to existing backend contract
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 lg:pb-6 space-y-6">
      <WizardProgress currentStep={5} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner event={event} budget={budget} />

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-4">
        <div className="flex-1 w-full min-w-0 surface-sheet p-6 sm:p-10 space-y-8">
        {/* Step Header */}
        <div className="border-b border-line pb-6">
          <p className="label-kicker mb-2">Step 05 / Waste Planning</p>
          <h1 className="font-display text-2xl sm:text-3xl text-ink tracking-tight">
            Let's reduce event waste
          </h1>
          <p className="text-ink-muted text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Estimate the waste your event may generate and find simple ways to
            reduce it.
          </p>
        </div>

        {/* Paper Waste Waitlist Notice */}
        <div className="p-4 rounded-sheet bg-paper-inset/40 border border-line text-xs text-ink-muted flex items-start space-x-3">
          <Clock className="w-4 h-4 text-ink-muted mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-semibold text-ink">
              Release Note on Paper Waste:
            </strong>{" "}
            Paper waste estimation is currently <strong>waitlisted</strong> and
            not active in this release. Active waste streams include food waste,
            disposable items, plastic waste, and other materials.
          </div>
        </div>

        {/* Error / Validation Alerts */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-control bg-clay-50 border border-clay-300 text-clay-900 text-sm flex items-start space-x-2.5"
          >
            <AlertCircle className="w-5 h-5 text-clay-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Estimation Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {validationError && (
          <div
            role="alert"
            className="p-4 rounded-control bg-clay-50 border border-clay-300 text-clay-900 text-sm flex items-start space-x-2.5"
          >
            <AlertCircle className="w-5 h-5 text-clay-700 mt-0.5 flex-shrink-0" />
            <p className="font-medium">{validationError}</p>
          </div>
        )}

        {/* Four Selectable Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Select Waste Categories
            </h2>
            <span className="text-xs text-ink-muted font-medium">
              Choose what applies to your event
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category 1: Food waste */}
            <div
              role="button"
              tabIndex={0}
              aria-pressed={isFoodSelected}
              onClick={handleToggleFood}
              onKeyDown={(e) =>
                (e.key === " " || e.key === "Enter") && handleToggleFood()
              }
              className={`p-5 rounded-sheet border transition-all cursor-pointer select-none flex items-start justify-between ${
                isFoodSelected
                  ? "border-moss-600 bg-moss-50/70 ring-2 ring-moss-500/20"
                  : "border-line bg-paper-raised hover:border-line-strong hover:bg-paper-inset/30"
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-10 h-10 rounded-control flex items-center justify-center transition-colors flex-shrink-0 ${
                    isFoodSelected
                      ? "bg-moss-700 text-paper-raised"
                      : "bg-paper-inset/60 text-ink-muted border border-line"
                  }`}
                >
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm sm:text-base">
                    Food waste
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">
                    Leftover food after meals.
                  </p>
                  {foodConfig.meals.length > 0 && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-moss-100 text-moss-800 text-[11px] font-semibold border border-moss-200">
                      Connected to scheduled meals
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-control border flex items-center justify-center mt-1 transition-colors flex-shrink-0 ${
                  isFoodSelected
                    ? "bg-moss-700 border-moss-700 text-paper-raised"
                    : "border-line bg-paper-raised"
                }`}
              >
                {isFoodSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Category 2: Disposable items */}
            <div
              role="button"
              tabIndex={0}
              aria-pressed={isDisposableSelected}
              onClick={handleToggleDisposable}
              onKeyDown={(e) =>
                (e.key === " " || e.key === "Enter") && handleToggleDisposable()
              }
              className={`p-5 rounded-sheet border transition-all cursor-pointer select-none flex items-start justify-between ${
                isDisposableSelected
                  ? "border-moss-600 bg-moss-50/70 ring-2 ring-moss-500/20"
                  : "border-line bg-paper-raised hover:border-line-strong hover:bg-paper-inset/30"
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-10 h-10 rounded-control flex items-center justify-center transition-colors flex-shrink-0 ${
                    isDisposableSelected
                      ? "bg-moss-700 text-paper-raised"
                      : "bg-paper-inset/60 text-ink-muted border border-line"
                  }`}
                >
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm sm:text-base">
                    Disposable items
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">
                    Plates, cups, spoons and forks.
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-control border flex items-center justify-center mt-1 transition-colors flex-shrink-0 ${
                  isDisposableSelected
                    ? "bg-moss-700 border-moss-700 text-paper-raised"
                    : "border-line bg-paper-raised"
                }`}
              >
                {isDisposableSelected && (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
              </div>
            </div>

            {/* Category 3: Plastic waste */}
            <div
              role="button"
              tabIndex={0}
              aria-pressed={isPlasticSelected}
              onClick={handleTogglePlastic}
              onKeyDown={(e) =>
                (e.key === " " || e.key === "Enter") && handleTogglePlastic()
              }
              className={`p-5 rounded-sheet border transition-all cursor-pointer select-none flex items-start justify-between ${
                isPlasticSelected
                  ? "border-moss-600 bg-moss-50/70 ring-2 ring-moss-500/20"
                  : "border-line bg-paper-raised hover:border-line-strong hover:bg-paper-inset/30"
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-10 h-10 rounded-control flex items-center justify-center transition-colors flex-shrink-0 ${
                    isPlasticSelected
                      ? "bg-moss-700 text-paper-raised"
                      : "bg-paper-inset/60 text-ink-muted border border-line"
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm sm:text-base">
                    Plastic waste
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">
                    Bottles, bags and wrappers.
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-control border flex items-center justify-center mt-1 transition-colors flex-shrink-0 ${
                  isPlasticSelected
                    ? "bg-moss-700 border-moss-700 text-paper-raised"
                    : "border-line bg-paper-raised"
                }`}
              >
                {isPlasticSelected && (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
              </div>
            </div>

            {/* Category 4: Other waste */}
            <div
              role="button"
              tabIndex={0}
              aria-pressed={isOtherSelected}
              onClick={handleToggleOther}
              onKeyDown={(e) =>
                (e.key === " " || e.key === "Enter") && handleToggleOther()
              }
              className={`p-5 rounded-sheet border transition-all cursor-pointer select-none flex items-start justify-between ${
                isOtherSelected
                  ? "border-moss-600 bg-moss-50/70 ring-2 ring-moss-500/20"
                  : "border-line bg-paper-raised hover:border-line-strong hover:bg-paper-inset/30"
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-10 h-10 rounded-control flex items-center justify-center transition-colors flex-shrink-0 ${
                    isOtherSelected
                      ? "bg-moss-700 text-paper-raised"
                      : "bg-paper-inset/60 text-ink-muted border border-line"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm sm:text-base">
                    Other waste
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">
                    Decorations and containers.
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-control border flex items-center justify-center mt-1 transition-colors flex-shrink-0 ${
                  isOtherSelected
                    ? "bg-moss-700 border-moss-700 text-paper-raised"
                    : "border-line bg-paper-raised"
                }`}
              >
                {isOtherSelected && (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Button: "Estimate my waste" */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleEstimateWaste}
            disabled={isEstimating}
            className="btn-primary w-full sm:w-auto px-8 py-3.5 font-bold text-sm"
          >
            {isEstimating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-paper-raised" />
                <span>Estimating my waste...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-paper-raised" />
                <span>Estimate my waste</span>
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {wastePlanResponse && (
          <div className="space-y-6 pt-6 border-t border-line">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Estimated Event Waste
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Summary of waste estimates based on your selected categories.
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider ${
                  wastePlanResponse.status === "COMPLETE"
                    ? "bg-moss-100 text-moss-800 border border-moss-300"
                    : wastePlanResponse.status === "PARTIAL"
                      ? "bg-paper-inset text-ink border border-line"
                      : "bg-clay-100 text-clay-900 border border-clay-300"
                }`}
              >
                {wastePlanResponse.status === "COMPLETE"
                  ? "Complete Estimate"
                  : wastePlanResponse.status === "PARTIAL"
                    ? "Partial Estimate"
                    : "Estimate Blocked"}
              </span>
            </div>

            {/* Results Cards for Selected Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Food Waste Metric */}
              {isFoodSelected && (
                <div className="p-4 rounded-sheet bg-paper-raised border border-line shadow-subtle">
                  <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wide block">
                    Food Waste
                  </span>
                  <div className="mt-2 font-mono tabular-nums">
                    {wastePlanResponse.food_waste?.planning_servings != null ? (
                      <div>
                        <AnimatedCounter
                          className="text-2xl font-display font-bold text-ink"
                          value={Number(
                            wastePlanResponse.food_waste.planning_servings,
                          )}
                        />
                        <span className="text-xs font-semibold text-ink-muted ml-1 font-sans">
                          servings
                        </span>
                        {wastePlanResponse.food_waste.estimated_kg != null && (
                          <AnimatedCounter
                            className="block text-xs font-medium text-moss-700 mt-1 font-mono"
                            prefix="Approx. "
                            value={Number(
                              wastePlanResponse.food_waste.estimated_kg,
                            )}
                            suffix=" kg"
                            decimals={1}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-faint italic font-sans">
                        Estimate unavailable
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Disposable Items Metric */}
              {isDisposableSelected && (
                <div className="p-4 rounded-sheet bg-paper-raised border border-line shadow-subtle">
                  <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wide block">
                    Disposable Items
                  </span>
                  <div className="mt-2 font-mono tabular-nums">
                    {wastePlanResponse.packaging_waste.total_items != null ? (
                      <div>
                        <AnimatedCounter
                          className="text-2xl font-display font-bold text-ink"
                          value={Number(
                            wastePlanResponse.packaging_waste.total_items,
                          )}
                        />
                        <span className="text-xs font-semibold text-ink-muted ml-1 font-sans">
                          items
                        </span>
                        {wastePlanResponse.packaging_waste
                          .reusable_percentage != null && (
                          <span className="block text-xs font-bold text-moss-700 mt-1">
                            <AnimatedCounter
                              value={Number(
                                wastePlanResponse.packaging_waste
                                  .reusable_percentage,
                              )}
                              suffix="% reusable"
                              decimals={0}
                            />
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-faint italic font-sans">
                        Estimate unavailable
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Plastic Waste Metric */}
              {isPlasticSelected && (
                <div className="p-4 rounded-sheet bg-paper-raised border border-line shadow-subtle">
                  <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wide block">
                    Plastic Waste
                  </span>
                  <div className="mt-2 font-mono tabular-nums">
                    {wastePlanResponse.plastic_waste.total_planning_items !=
                    null ? (
                      <div>
                        <AnimatedCounter
                          className="text-2xl font-display font-bold text-ink"
                          value={Number(
                            wastePlanResponse.plastic_waste
                              .total_planning_items,
                          )}
                        />
                        <span className="text-xs font-semibold text-ink-muted ml-1 font-sans">
                          items
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-faint italic font-sans">
                        Estimate unavailable
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Other Waste Metric */}
              {isOtherSelected && (
                <div className="p-4 rounded-sheet bg-paper-raised border border-line shadow-subtle">
                  <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wide block">
                    Other Waste
                  </span>
                  <div className="mt-2 font-mono tabular-nums">
                    {wastePlanResponse.other_waste.total_items != null ? (
                      <div>
                        <AnimatedCounter
                          className="text-2xl font-display font-bold text-ink"
                          value={Number(
                            wastePlanResponse.other_waste.total_items,
                          )}
                        />
                        <span className="text-xs font-semibold text-ink-muted ml-1 font-sans">
                          items
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-faint italic font-sans">
                        Estimate unavailable
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Itemized Waste Breakdown using WasteItemRow */}
            {((wastePlanResponse.packaging_waste?.items && wastePlanResponse.packaging_waste.items.length > 0) ||
              (wastePlanResponse.plastic_waste?.items && wastePlanResponse.plastic_waste.items.length > 0) ||
              (wastePlanResponse.other_waste?.items && wastePlanResponse.other_waste.items.length > 0)) && (
              <div className="pt-4 border-t border-line space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="label-kicker block">Itemized Item Ledger</span>
                    <h3 className="font-display text-base font-semibold text-ink">
                      Disposables & Packaging Items
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-ink-muted">
                    Physical units & reusable split
                  </span>
                </div>

                <div className="bg-paper-raised border border-line rounded-sheet p-3 space-y-1">
                  {wastePlanResponse.packaging_waste?.items?.map((item, idx) => (
                    <WasteItemRow
                      key={`pkg-${idx}`}
                      name={item.item_name}
                      itemType={item.item_type}
                      totalQuantity={Number(item.total_quantity) || 0}
                      reusableQuantity={Number(item.reusable_quantity) || 0}
                      singleUseQuantity={Number(item.single_use_quantity) || 0}
                      explanation={item.explanation}
                    />
                  ))}

                  {wastePlanResponse.plastic_waste?.items?.map((item, idx) => (
                    <WasteItemRow
                      key={`plastic-${idx}`}
                      name={item.item_name}
                      itemType={item.item_type}
                      totalQuantity={Number(item.planning_quantity ?? item.estimated_quantity) || 0}
                      singleUseQuantity={Number(item.planning_quantity ?? item.estimated_quantity) || 0}
                      explanation={item.explanation}
                    />
                  ))}

                  {wastePlanResponse.other_waste?.items?.map((item, idx) => (
                    <WasteItemRow
                      key={`other-${idx}`}
                      name={item.name}
                      itemType={item.category}
                      totalQuantity={Number(item.quantity) || 0}
                      unit={item.unit}
                      explanation={item.explanation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Waste Reduction Recommendations */}
            {wastePlanResponse.recommendations.length > 0 && (
              <div className="p-5 rounded-sheet border border-line bg-paper-inset/30 space-y-3">
                <div className="flex items-center space-x-2">
                  <Recycle className="w-4 h-4 text-moss-700" />
                  <h3 className="text-sm font-semibold text-ink">
                    Waste Reduction Recommendations
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {wastePlanResponse.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-control bg-paper-raised border border-line text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="font-semibold text-ink">
                          {rec.title}
                        </strong>
                        <span className="px-2 py-0.5 rounded-full bg-moss-100 text-moss-800 text-[10px] font-bold border border-moss-200 font-mono">
                          {rec.impact}
                        </span>
                      </div>
                      <p className="text-ink-muted">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Section: "How we estimated it" */}
            <div className="border border-line rounded-sheet overflow-hidden bg-paper-inset/20">
              <button
                type="button"
                onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-paper-inset/40 transition-colors focus:outline-none cursor-pointer"
                aria-expanded={isExplanationOpen}
              >
                <div>
                  <h3 className="font-semibold text-ink text-sm sm:text-base">
                    How we estimated it
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Review the reference benchmarks and calculation details used
                    for your estimates.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-paper-raised border border-line flex items-center justify-center text-ink flex-shrink-0 ml-3">
                  {isExplanationOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isExplanationOpen && (
                <div className="p-4 sm:p-6 border-t border-line bg-paper-raised space-y-4">
                  <p className="text-xs text-ink-muted">
                    Calculations apply verified campus reference rates based on
                    your event size ({event?.expected_attendees || "attendees"}{" "}
                    attendees) and selected categories:
                  </p>

                  <div className="space-y-2.5">
                    {wastePlanResponse.assumptions_used.length > 0 ? (
                      wastePlanResponse.assumptions_used.map((assump, idx) => {
                        const label = getHumanReadableParameter(
                          assump.parameter,
                        );
                        const source = formatSourceType(assump.source_type);
                        const val = formatAssumptionValue(
                          assump.parameter,
                          assump.value,
                          assump.unit,
                        );
                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-control border border-line bg-paper-inset/20 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-ink">
                                {label}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-paper-raised border border-line text-ink-muted text-[10px] font-semibold">
                                {source.label}
                              </span>
                            </div>
                            <div className="text-ink-muted font-mono">
                              Configured Rate:{" "}
                              <strong className="text-ink font-semibold">
                                {val}
                              </strong>
                            </div>
                            {(assump.reference_notes || assump.explanation) && (
                              <p className="text-[11px] text-ink-muted italic mt-0.5 font-sans">
                                {assump.reference_notes || assump.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-ink-faint italic">
                        No assumptions were needed or recorded.
                      </p>
                    )}
                  </div>

                  {wastePlanResponse.missing_assumptions.length > 0 && (
                    <div className="p-3.5 rounded-control bg-clay-50 border border-clay-200 text-xs text-clay-900 space-y-1">
                      <strong>Missing Parameters:</strong>
                      <p>
                        The following reference parameters were not configured
                        in the system:
                      </p>
                      <ul className="list-disc list-inside text-[11px] pl-1">
                        {wastePlanResponse.missing_assumptions.map((m, i) => (
                          <li key={i}>{getHumanReadableParameter(m)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Required Disclaimer */}
            <div className="p-4 rounded-sheet bg-paper-inset/40 border border-line text-xs text-ink-muted flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-ink-faint mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-ink">Notice on Estimations:</strong> These figures are
                estimates based on available assumptions. Actual waste may vary
                depending on event activities and attendee behavior.
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Buttons */}
        <div className="pt-8 border-t border-line flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={isGenerating}
            className="btn-ghost px-6 py-3 font-semibold text-sm w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Food Planning</span>
          </button>

          <button
            type="button"
            onClick={handleContinueToPlans}
            disabled={isGenerating}
            className="btn-primary px-9 py-4 font-bold text-base w-full sm:w-auto disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Sustainable Plans...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Continue to Sustainable Plans</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      <WasteLiveReceipt
        totalItems={liveEstimates.totalItems}
        totalSingleUse={liveEstimates.totalSingleUse}
        totalReusable={liveEstimates.totalReusable}
        reusablePercent={liveEstimates.reusablePercent}
        foodWasteKg={liveEstimates.foodWasteKg}
        isCalculated={liveEstimates.isCalculated}
      />
      </div>
    </div>
  );
};
