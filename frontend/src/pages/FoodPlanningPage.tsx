import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Utensils,
  Coffee,
  Moon,
  Cookie,
  CupSoda,
  Sparkles,
  Leaf,
  Flame,
  Users,
  Calculator,
  Wallet,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  AlertCircle,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";
import {
  MealType,
  DietaryPreference,
  FoodPricingUnit,
  MealInput,
  FoodPlanRequest,
} from "../types/food";
import { foodApi } from "../api/food";
import { AnimatedCounter } from "../components/common/AnimatedCounter";

interface MealOptionMeta {
  type: MealType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const SUPPORTED_MEAL_OPTIONS: MealOptionMeta[] = [
  {
    type: "BREAKFAST",
    label: "Breakfast",
    description: "Morning tea, coffee & breakfast items",
    icon: <Coffee className="w-5 h-5 text-amber-600" />,
  },
  {
    type: "LUNCH",
    label: "Lunch",
    description: "Midday meal for attendees",
    icon: <Utensils className="w-5 h-5 text-emerald-600" />,
  },
  {
    type: "DINNER",
    label: "Dinner",
    description: "Evening dinner service",
    icon: <Moon className="w-5 h-5 text-indigo-600" />,
  },
  {
    type: "SNACKS",
    label: "Snacks",
    description: "Finger foods & break snacks",
    icon: <Cookie className="w-5 h-5 text-orange-600" />,
  },
  {
    type: "HIGH_TEA",
    label: "High Tea",
    description: "Afternoon tea & light savories",
    icon: <CupSoda className="w-5 h-5 text-rose-600" />,
  },
  {
    type: "REFRESHMENTS",
    label: "Refreshments",
    description: "Beverages, water & light snacks",
    icon: <Sparkles className="w-5 h-5 text-sky-600" />,
  },
];

const PARAMETER_LABEL_MAP: Record<string, string> = {
  meal_participation_rate_lunch: "Lunch attendance rate",
  meal_participation_rate_breakfast: "Breakfast attendance rate",
  meal_participation_rate_dinner: "Dinner attendance rate",
  meal_participation_rate_snacks: "Snacks attendance rate",
  meal_participation_rate_high_tea: "High tea attendance rate",
  meal_participation_rate_refreshments: "Refreshments attendance rate",
  meal_participation_rate_default: "Default meal attendance rate",
  meal_cost_per_serving_lunch: "Lunch cost per portion",
  meal_cost_per_serving_breakfast: "Breakfast cost per portion",
  meal_cost_per_serving_dinner: "Dinner cost per portion",
  meal_cost_per_serving_snacks: "Snacks cost per portion",
  meal_cost_per_serving_high_tea: "High tea cost per portion",
  meal_cost_per_serving_refreshments: "Refreshments cost per portion",
  meal_cost_per_serving_default: "Default cost per portion",
  food_waste_percentage: "Food waste rate",
  food_serving_weight_kg_default: "Average portion weight",
  food_serving_weight_kg_lunch: "Lunch portion weight",
  food_serving_weight_kg_breakfast: "Breakfast portion weight",
  food_serving_weight_kg_dinner: "Dinner portion weight",
  food_serving_weight_kg_snacks: "Snacks portion weight",
  food_serving_weight_kg_high_tea: "High tea portion weight",
  food_serving_weight_kg_refreshments: "Refreshments portion weight",
  vegetarian_ratio: "Vegetarian portion ratio",
  food_participation_attrition_buffer_rate: "Catering buffer rate",
};

const getHumanReadableParameter = (param: string): string => {
  if (PARAMETER_LABEL_MAP[param]) {
    return PARAMETER_LABEL_MAP[param];
  }
  return param
    .replace(/^meal_/, "")
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
    return { label: "Reference benchmark", isUser: false };
  }
  if (s.includes("ACTUAL")) {
    return { label: "Campus historical data", isUser: false };
  }
  if (s.includes("ML") || s.includes("MODEL")) {
    return { label: "Model estimate", isUser: false };
  }
  return { label: "Configured estimate", isUser: false };
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
    if (unit?.toUpperCase().includes("INR")) {
      return `₹${num.toLocaleString()}`;
    }
    if (unit?.toLowerCase().includes("kg")) {
      return `${num.toFixed(2)} kg / serving`;
    }
  }
  return unit ? `${value} ${unit}` : value;
};

export const FoodPlanningPage: React.FC = () => {
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
  const [isCustomizationOpen, setIsCustomizationOpen] =
    useState<boolean>(false);
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

  // Ensure selected day is within range
  useEffect(() => {
    if (selectedDay > durationDays) {
      setSelectedDay(1);
    }
  }, [durationDays]);

  // Helper: check if a meal type is selected for a given day
  const isMealSelected = (mealType: MealType, day: number): boolean => {
    return foodConfig.meals.some(
      (m) => m.meal_type === mealType && m.day === day,
    );
  };

  // Toggle meal selection for the active day
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

  // Copy selected day's meals to all event days
  const handleCopyMealsToAllDays = () => {
    setValidationError(null);
    const currentDayMeals = foodConfig.meals.filter(
      (m) => m.day === selectedDay,
    );
    if (currentDayMeals.length === 0) return;

    setFoodConfig((prev) => {
      // Remove all meals and replicate currentDayMeals across all days
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

  // Handle Dietary Preference Selection
  const handleDietaryChange = (pref: DietaryPreference) => {
    setFoodConfig((prev) => ({
      ...prev,
      default_dietary_preference: pref,
      // Reset or initialize vegetarian ratio default when switching
      vegetarian_ratio:
        pref === "MIXED"
          ? prev.vegetarian_ratio || "0.70"
          : prev.vegetarian_ratio,
    }));
  };

  // Handle Budget Mode Selection
  const handleBudgetModeChange = (mode: "ESTIMATE" | "ENTER") => {
    setFoodConfig((prev) => ({
      ...prev,
      budgetMode: mode,
    }));
  };

  // Execute explicit Food Calculation
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

  // Navigation handlers
  const handleBack = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/constraints`);
  };

  const handleNext = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/waste`);
  };

  // Helper for per-meal customization
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <WizardProgress currentStep={4} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner event={event} budget={budget} />

      <div className="surface-sheet p-6 sm:p-10">
        {/* Page Heading & Introduction */}
        <div className="border-b border-line pb-6 mb-8">
          <p className="label-kicker mb-2">Step 04 / Food Planning</p>
          <h1 className="font-display text-2xl sm:text-3xl text-ink tracking-tight">
            Plan Your Event Food
          </h1>
          <p className="text-ink-muted text-sm mt-1.5 max-w-2xl leading-relaxed">
            Choose the meals you want to serve. We'll estimate the food
            quantity, cost, and possible food waste for your event.
          </p>

          {/* Event Details Context */}
          {event && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-muted bg-paper-inset/40 border border-line rounded-xl px-4 py-2.5">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-ink-muted" />
                {event.expected_attendees} Expected Attendees
              </span>
              <span className="text-line-strong">•</span>
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                {durationDays} {durationDays === 1 ? "Day Event" : "Days Event"}
              </span>
            </div>
          )}
        </div>

        {/* Validation and API Error Banners */}
        {validationError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-clay-50 border border-clay-300 text-clay-900 text-sm flex items-start space-x-2.5"
          >
            <AlertCircle className="w-5 h-5 text-clay-600 flex-shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {apiError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-clay-50 border border-clay-300 text-clay-900 text-sm flex items-start space-x-2.5"
          >
            <AlertCircle className="w-5 h-5 text-clay-600 flex-shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION A — Select Meals */}
        {/* ========================================================================= */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              Which meals will you serve?
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Select one or more meals for your attendees. You can serve
              different meals on each day.
            </p>
          </div>

          {/* Multi-Day Selector Tabs */}
          {durationDays > 1 && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-paper-inset/40 p-2 rounded-2xl border border-line">
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: durationDays }, (_, i) => i + 1).map(
                  (dayNum) => {
                    const dayMealsCount = foodConfig.meals.filter(
                      (m) => m.day === dayNum,
                    ).length;
                    const isActive = selectedDay === dayNum;
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => setSelectedDay(dayNum)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all focus:outline-none ${
                          isActive
                            ? "bg-paper-raised text-moss-800 shadow-sm border border-moss-300"
                            : "text-ink-muted hover:text-ink hover:bg-paper-inset/60"
                        }`}
                      >
                        Day {dayNum}
                        {dayMealsCount > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-moss-100 text-moss-800 text-[10px] font-bold">
                            {dayMealsCount}
                          </span>
                        )}
                      </button>
                    );
                  },
                )}
              </div>

              {foodConfig.meals.some((m) => m.day === selectedDay) && (
                <button
                  type="button"
                  onClick={handleCopyMealsToAllDays}
                  className="text-[11px] font-semibold text-moss-700 hover:text-moss-800 hover:underline px-2 py-1"
                >
                  Copy Day {selectedDay} meals to all days
                </button>
              )}
            </div>
          )}

          {/* Meal Selection Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {SUPPORTED_MEAL_OPTIONS.map((meal) => {
              const isSelected = isMealSelected(meal.type, selectedDay);
              return (
                <button
                  key={meal.type}
                  type="button"
                  onClick={() => handleToggleMeal(meal.type, selectedDay)}
                  aria-pressed={isSelected}
                  className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between focus:outline-none cursor-pointer ${
                    isSelected
                      ? "border-moss-600 bg-moss-50/70 text-moss-950 font-semibold ring-2 ring-moss-500/20 shadow-sm"
                      : "border-line bg-paper-raised hover:border-line-strong text-ink"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-paper-inset/60 border border-line">
                      {meal.icon}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-moss-700 border-moss-700 text-paper-raised"
                          : "border-line bg-paper-raised"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-ink">
                      {meal.label}
                    </span>
                    <span className="text-xs text-ink-muted mt-0.5 block line-clamp-2">
                      {meal.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scheduled Meals Summary Pill */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span className="font-semibold text-ink">Scheduled:</span>
            {foodConfig.meals.length === 0 ? (
              <span className="text-ink-faint italic">
                No meals selected yet. Please select at least one meal.
              </span>
            ) : (
              foodConfig.meals.map((m, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-paper-inset/60 text-ink font-medium text-[11px] border border-line"
                >
                  <span>
                    {durationDays > 1 ? `Day ${m.day}: ` : ""}
                    {m.meal_type.toLowerCase()}
                  </span>
                </span>
              ))
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION B — Food Preference */}
        {/* ========================================================================= */}
        <section className="mb-10 pt-8 border-t border-line">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              What food options will you offer?
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Choose dietary preferences for your catering menu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              {
                id: "VEGETARIAN" as DietaryPreference,
                label: "Vegetarian only",
                description: "All meals served will be strictly vegetarian.",
                icon: <Leaf className="w-5 h-5 text-moss-700" />,
              },
              {
                id: "NON_VEGETARIAN" as DietaryPreference,
                label: "Non-vegetarian only",
                description: "All meals will include non-vegetarian dishes.",
                icon: <Flame className="w-5 h-5 text-clay-600" />,
              },
              {
                id: "MIXED" as DietaryPreference,
                label: "Both options",
                description:
                  "Offer both vegetarian and non-vegetarian choices.",
                icon: <Users className="w-5 h-5 text-moss-600" />,
              },
            ].map((opt) => {
              const isSelected =
                foodConfig.default_dietary_preference === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleDietaryChange(opt.id)}
                  aria-pressed={isSelected}
                  className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between focus:outline-none cursor-pointer ${
                    isSelected
                      ? "border-moss-600 bg-moss-50/70 text-moss-950 font-semibold ring-2 ring-moss-500/20 shadow-sm"
                      : "border-line bg-paper-raised hover:border-line-strong text-ink"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-paper-inset/60 border border-line">
                      {opt.icon}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-moss-700 border-moss-700 text-paper-raised"
                          : "border-line bg-paper-raised"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-ink">
                      {opt.label}
                    </span>
                    <span className="text-xs text-ink-muted mt-0.5 block">
                      {opt.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* If "Both options" is selected: Configurable Vegetarian Ratio */}
          {foodConfig.default_dietary_preference === "MIXED" && (
            <div className="mt-4 p-5 rounded-2xl bg-paper-inset/40 border border-line">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label
                  htmlFor="veg-split-slider"
                  className="text-xs font-mono uppercase tracking-wider text-ink-muted"
                >
                  Vegetarian Portion Ratio
                </label>
                <span className="text-xs font-bold text-moss-800 bg-moss-100 px-2.5 py-1 rounded-full border border-moss-200">
                  {Math.round(Number(foodConfig.vegetarian_ratio || 0.7) * 100)}
                  % Vegetarian •{" "}
                  {100 -
                    Math.round(
                      Number(foodConfig.vegetarian_ratio || 0.7) * 100,
                    )}
                  % Non-Vegetarian
                </span>
              </div>

              <input
                type="range"
                id="veg-split-slider"
                min="0"
                max="1"
                step="0.05"
                value={foodConfig.vegetarian_ratio || "0.70"}
                onChange={(e) =>
                  setFoodConfig((prev) => ({
                    ...prev,
                    vegetarian_ratio: e.target.value,
                  }))
                }
                className="w-full accent-moss-700 cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-ink-faint mt-1.5">
                <span>All Non-Veg (0%)</span>
                <span>Standard Campus Benchmark (70%)</span>
                <span>All Veg (100%)</span>
              </div>

              <p className="text-xs text-ink-muted mt-3">
                We use this ratio to calculate portion requirements for
                vegetarian and non-vegetarian catering.
              </p>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION C — Food Budget */}
        {/* ========================================================================= */}
        <section className="mb-10 pt-8 border-t border-line">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              What's your food budget?
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              You can set a dedicated food budget or let the system calculate
              catering costs automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
            <button
              type="button"
              onClick={() => handleBudgetModeChange("ESTIMATE")}
              aria-pressed={foodConfig.budgetMode !== "ENTER"}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between focus:outline-none cursor-pointer ${
                foodConfig.budgetMode !== "ENTER"
                  ? "border-moss-600 bg-moss-50/70 text-moss-950 font-semibold ring-2 ring-moss-500/20 shadow-sm"
                  : "border-line bg-paper-raised hover:border-line-strong text-ink"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-xl bg-paper-inset/60 border border-line">
                  <Calculator className="w-5 h-5 text-moss-700" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    foodConfig.budgetMode !== "ENTER"
                      ? "bg-moss-700 border-moss-700 text-paper-raised"
                      : "border-line bg-paper-raised"
                  }`}
                >
                  {foodConfig.budgetMode !== "ENTER" && (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="block text-sm font-semibold text-ink">
                    Estimate it for me
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-moss-100 text-moss-800 text-[10px] font-bold">
                    Recommended
                  </span>
                </div>
                <span className="text-xs text-ink-muted mt-0.5 block">
                  Estimate catering costs automatically using verified campus
                  benchmarks.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleBudgetModeChange("ENTER")}
              aria-pressed={foodConfig.budgetMode === "ENTER"}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between focus:outline-none cursor-pointer ${
                foodConfig.budgetMode === "ENTER"
                  ? "border-moss-600 bg-moss-50/70 text-moss-950 font-semibold ring-2 ring-moss-500/20 shadow-sm"
                  : "border-line bg-paper-raised hover:border-line-strong text-ink"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-xl bg-paper-inset/60 border border-line">
                  <Wallet className="w-5 h-5 text-ink-muted" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    foodConfig.budgetMode === "ENTER"
                      ? "bg-moss-700 border-moss-700 text-paper-raised"
                      : "border-line bg-paper-raised"
                  }`}
                >
                  {foodConfig.budgetMode === "ENTER" && (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </div>
              </div>
              <div>
                <span className="block text-sm font-semibold text-ink">
                  I'll enter my food budget
                </span>
                <span className="text-xs text-ink-muted mt-0.5 block">
                  Set a specific spending limit dedicated to food and catering.
                </span>
              </div>
            </button>
          </div>

          {/* If user chooses to enter food budget */}
          {foodConfig.budgetMode === "ENTER" && (
            <div className="p-5 rounded-2xl bg-paper-inset/40 border border-line space-y-2">
              <label
                htmlFor="food-budget-input"
                className="block text-xs font-mono uppercase tracking-wider text-ink-muted"
              >
                Food Budget Amount (₹)
              </label>
              <div className="relative max-w-sm">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-ink-faint font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  id="food-budget-input"
                  min="0"
                  step="100"
                  placeholder="e.g. 25000"
                  value={foodConfig.food_budget || ""}
                  onChange={(e) =>
                    setFoodConfig((prev) => ({
                      ...prev,
                      food_budget: e.target.value,
                    }))
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-line text-sm font-semibold text-ink bg-paper-raised focus:outline-none focus:ring-2 focus:ring-moss-500/20 focus:border-moss-600"
                />
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Note: This food budget is dedicated to catering and is separate
                from your overall event budget.
              </p>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION D — Optional Customization */}
        {/* ========================================================================= */}
        <section className="mb-10 pt-8 border-t border-line">
          <button
            type="button"
            onClick={() => setIsCustomizationOpen(!isCustomizationOpen)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-paper-inset/30 hover:bg-paper-inset/60 border border-line transition-colors focus:outline-none cursor-pointer"
            aria-expanded={isCustomizationOpen}
          >
            <div className="text-left">
              <h3 className="text-sm font-semibold text-ink">
                Adjust your food estimates (Optional)
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Only change these settings if you have more information.
              </p>
            </div>
            <div className="p-1 rounded-lg text-ink-muted">
              {isCustomizationOpen ? (
                <ChevronUp className="w-5 h-5 text-ink" />
              ) : (
                <ChevronDown className="w-5 h-5 text-ink" />
              )}
            </div>
          </button>

          {isCustomizationOpen && (
            <div className="mt-4 p-5 rounded-2xl bg-paper-inset/20 border border-line space-y-6">
              {/* Subsection 1: How many people will eat? */}
              {foodConfig.meals.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-1">
                    How many people will eat?
                  </h4>
                  <p className="text-xs text-ink-muted mb-3">
                    Meal attendance may be lower than total event attendance
                    (for example, some attendees may arrive later or skip
                    certain meals). You can optionally adjust expected
                    attendance or attendance rate for each meal.
                  </p>

                  <div className="space-y-2.5">
                    {foodConfig.meals.map((meal, index) => {
                      const partRateNum =
                        meal.user_participation_rate != null
                          ? Number(meal.user_participation_rate)
                          : null;
                      const participationPercent =
                        partRateNum != null && !isNaN(partRateNum)
                          ? partRateNum <= 1
                            ? Math.round(partRateNum * 100)
                            : Math.round(partRateNum)
                          : "";

                      return (
                        <div
                          key={index}
                          className="p-3.5 bg-paper-raised rounded-xl border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="font-semibold text-ink">
                            {durationDays > 1 ? `Day ${meal.day} • ` : ""}
                            {meal.meal_type.charAt(0) +
                              meal.meal_type.slice(1).toLowerCase()}
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            {/* Expected meal attendance */}
                            <div className="flex items-center space-x-1.5">
                              <label
                                htmlFor={`meal-attendance-${index}`}
                                className="text-ink-muted font-medium text-[11px]"
                              >
                                Expected meal attendance:
                              </label>
                              <input
                                type="number"
                                id={`meal-attendance-${index}`}
                                min="0"
                                placeholder={`e.g. ${event?.expected_attendees || 100}`}
                                value={meal.attendee_count ?? ""}
                                onChange={(e) =>
                                  updateMealCustomization(
                                    index,
                                    "attendee_count",
                                    e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  )
                                }
                                className="w-24 px-2.5 py-1.5 rounded-lg border border-line text-xs text-ink bg-paper-raised focus:outline-none focus:ring-1 focus:ring-moss-600 focus:border-moss-600"
                              />
                            </div>

                            {/* Attendance percentage (human readable percentage) */}
                            <div className="flex items-center space-x-1.5">
                              <label
                                htmlFor={`meal-percent-${index}`}
                                className="text-ink-muted font-medium text-[11px]"
                              >
                                Attendance rate:
                              </label>
                              <div className="relative inline-flex items-center">
                                <input
                                  type="number"
                                  id={`meal-percent-${index}`}
                                  min="0"
                                  max="100"
                                  step="1"
                                  placeholder="e.g. 85"
                                  value={participationPercent}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === "") {
                                      updateMealCustomization(
                                        index,
                                        "user_participation_rate",
                                        undefined,
                                      );
                                    } else {
                                      const num = Number(raw);
                                      updateMealCustomization(
                                        index,
                                        "user_participation_rate",
                                        isNaN(num) ? undefined : num / 100,
                                      );
                                    }
                                  }}
                                  className="w-20 pl-2.5 pr-6 py-1.5 rounded-lg border border-line text-xs text-ink bg-paper-raised focus:outline-none focus:ring-1 focus:ring-moss-600 focus:border-moss-600"
                                />
                                <span className="absolute right-2 text-ink-faint font-bold text-xs pointer-events-none">
                                  %
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subsection 2: Do you already have a caterer's price? */}
              <div className="pt-4 border-t border-line">
                <h4 className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-1">
                  Do you already have a caterer's price?
                </h4>
                <p className="text-xs text-ink-muted mb-3">
                  If you already have a quote from your catering vendor, select
                  how your caterer charges.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                  {[
                    {
                      id: "ESTIMATE",
                      label: "Use an estimate",
                      desc: "Use campus reference rates",
                    },
                    {
                      id: "UNIT",
                      label: "Price per person or serving",
                      desc: "Exact rate per portion",
                    },
                    {
                      id: "TOTAL",
                      label: "Total catering price",
                      desc: "Fixed lump sum quote",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setFoodConfig((prev) => ({
                          ...prev,
                          costApproach: opt.id as any,
                        }))
                      }
                      className={`text-left p-3 rounded-xl border text-xs transition-all focus:outline-none cursor-pointer ${
                        foodConfig.costApproach === opt.id
                          ? "border-moss-600 bg-moss-50 text-moss-950 font-bold shadow-sm"
                          : "border-line bg-paper-raised text-ink hover:border-line-strong"
                      }`}
                    >
                      <span className="block font-semibold">{opt.label}</span>
                      <span className="text-[11px] text-ink-muted mt-0.5 block">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Price per person or serving: amount and unit selector */}
                {foodConfig.costApproach === "UNIT" && (
                  <div className="mt-3 p-4 rounded-xl bg-paper-raised border border-line max-w-md space-y-2">
                    <label
                      htmlFor="known-unit-cost-input"
                      className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted"
                    >
                      Price per person or serving
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[140px]">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-faint font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          id="known-unit-cost-input"
                          min="0"
                          placeholder="e.g. 150"
                          value={foodConfig.known_unit_cost || ""}
                          onChange={(e) =>
                            setFoodConfig((prev) => ({
                              ...prev,
                              known_unit_cost: e.target.value,
                            }))
                          }
                          className="w-full pl-7 pr-3 py-2 rounded-lg border border-line text-xs font-semibold bg-paper-raised focus:outline-none focus:ring-1 focus:ring-moss-600 focus:border-moss-600"
                        />
                      </div>
                      <select
                        aria-label="Pricing unit"
                        value={foodConfig.cost_pricing_unit || "PER_PERSON"}
                        onChange={(e) =>
                          setFoodConfig((prev) => ({
                            ...prev,
                            cost_pricing_unit: e.target
                              .value as FoodPricingUnit,
                          }))
                        }
                        className="px-3 py-2 rounded-lg border border-line text-xs font-semibold bg-paper-raised text-ink focus:outline-none focus:ring-1 focus:ring-moss-600"
                      >
                        <option value="PER_PERSON">per person</option>
                        <option value="PER_SERVING">per serving</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Total catering price: single total amount field */}
                {foodConfig.costApproach === "TOTAL" && (
                  <div className="mt-3 p-4 rounded-xl bg-paper-raised border border-line max-w-md space-y-2">
                    <label
                      htmlFor="known-total-cost-input"
                      className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted"
                    >
                      Total catering price
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-faint font-bold text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        id="known-total-cost-input"
                        min="0"
                        placeholder="e.g. 25000"
                        value={foodConfig.known_total_cost || ""}
                        onChange={(e) =>
                          setFoodConfig((prev) => ({
                            ...prev,
                            known_total_cost: e.target.value,
                          }))
                        }
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-line text-xs font-semibold bg-paper-raised text-ink focus:outline-none focus:ring-1 focus:ring-moss-600 focus:border-moss-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION E — Explicit Calculation */}
        {/* ========================================================================= */}
        <section className="mb-10 pt-8 border-t border-line">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Food Estimation & Waste Projections
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Calculate portion counts, catering costs, and food waste
                projections based on your selections.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCalculateFoodEstimates}
              disabled={isCalculating}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-moss-700 hover:bg-moss-800 disabled:bg-moss-300 text-paper-raised font-bold text-sm shadow-sm transition-all focus:outline-none cursor-pointer"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating food estimates…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Calculate Food Estimates</span>
                </>
              )}
            </button>
          </div>

          {/* State Before Calculation */}
          {!foodPlanResponse && !isCalculating && (
            <div className="p-8 rounded-2xl border border-dashed border-line bg-paper-inset/30 text-center">
              <Utensils className="w-8 h-8 text-ink-faint mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink">
                Select your meals and calculate to see your food estimates.
              </p>
              <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
                We'll project required servings, estimated catering expenditure,
                and expected surplus waste using verified campus benchmarks.
              </p>
            </div>
          )}

          {/* State After Successful Calculation */}
          {foodPlanResponse && (
            <div className="space-y-6">
              {/* Primary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Servings Card */}
                <div className="bg-paper-raised border border-line rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                      Estimated Servings
                    </span>
                    <Utensils className="w-4 h-4 text-moss-700" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-bold text-ink">
                    {foodPlanResponse.total_estimated_servings !== null &&
                    foodPlanResponse.total_estimated_servings !== undefined ? (
                      <AnimatedCounter
                        value={foodPlanResponse.total_estimated_servings}
                        suffix=" portions"
                      />
                    ) : (
                      "Unavailable"
                    )}
                  </div>
                  {foodPlanResponse.total_veg_servings != null &&
                    foodPlanResponse.total_non_veg_servings != null &&
                    foodPlanResponse.total_non_veg_servings > 0 && (
                      <div className="text-xs text-ink-muted mt-1.5 flex items-center gap-1.5">
                        <span className="text-moss-700 font-semibold">
                          <AnimatedCounter
                            value={foodPlanResponse.total_veg_servings}
                            suffix=" veg"
                          />
                        </span>
                        <span>•</span>
                        <span className="text-clay-700 font-semibold">
                          <AnimatedCounter
                            value={foodPlanResponse.total_non_veg_servings}
                            suffix=" non-veg"
                          />
                        </span>
                      </div>
                    )}
                  <p className="text-[11px] text-ink-muted mt-2">
                    Calculated from attendee count and participation rate
                    assumptions.
                  </p>
                </div>

                {/* 2. Food Cost Card */}
                <div className="bg-paper-raised border border-line rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                      Estimated Food Cost
                    </span>
                    <Wallet className="w-4 h-4 text-ink-muted" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-bold text-ink">
                    {foodPlanResponse.cost_summary.estimated_total_cost !==
                      null &&
                    foodPlanResponse.cost_summary.estimated_total_cost !==
                      undefined ? (
                      <AnimatedCounter
                        value={
                          foodPlanResponse.cost_summary.estimated_total_cost
                        }
                        prefix="₹"
                      />
                    ) : (
                      "Cost unavailable"
                    )}
                  </div>
                  {foodPlanResponse.cost_summary.cost_per_attendee !== null &&
                    foodPlanResponse.cost_summary.cost_per_attendee !==
                      undefined && (
                      <div className="text-xs text-ink-muted mt-1.5 font-medium">
                        <AnimatedCounter
                          value={
                            foodPlanResponse.cost_summary.cost_per_attendee
                          }
                          prefix="₹"
                          suffix=" per attendee"
                          decimals={2}
                        />
                      </div>
                    )}
                  {foodPlanResponse.cost_summary.is_over_budget ? (
                    <div className="mt-2 text-[11px] font-bold text-clay-700 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-clay-600" />
                      <span>
                        ₹
                        {Number(
                          foodPlanResponse.cost_summary.variance_amount,
                        ).toLocaleString()}{" "}
                        over allocated food budget
                      </span>
                    </div>
                  ) : foodPlanResponse.cost_summary.food_budget ? (
                    <div className="mt-2 text-[11px] font-semibold text-moss-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-moss-600" />
                      <span>Within allocated food budget</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-ink-muted mt-2">
                      Pricing:{" "}
                      {foodPlanResponse.cost_summary.pricing_approach
                        .toLowerCase()
                        .replace(/_/g, " ")}
                    </p>
                  )}
                </div>

                {/* 3. Food Waste Card */}
                <div className="bg-paper-raised border border-line rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                      Expected Food Waste
                    </span>
                    <Leaf className="w-4 h-4 text-moss-700" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-bold text-ink">
                    {foodPlanResponse.waste_summary.estimated_waste_servings !==
                      null &&
                    foodPlanResponse.waste_summary.estimated_waste_servings !==
                      undefined ? (
                      <AnimatedCounter
                        value={
                          foodPlanResponse.waste_summary
                            .estimated_waste_servings
                        }
                        suffix=" servings"
                        decimals={2}
                      />
                    ) : (
                      "Unavailable"
                    )}
                  </div>

                  {/* Waste mass in kilograms (only shown if valid estimate returned) */}
                  {foodPlanResponse.waste_summary.estimated_waste_kg !== null &&
                  foodPlanResponse.waste_summary.estimated_waste_kg !==
                    undefined ? (
                    <div className="text-xs font-bold text-moss-800 mt-1.5">
                      <AnimatedCounter
                        prefix="~"
                        value={
                          foodPlanResponse.waste_summary.estimated_waste_kg
                        }
                        suffix=" kg estimated mass"
                        decimals={2}
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] text-clay-700 mt-1.5 bg-clay-50 px-2 py-1 rounded-lg border border-clay-200">
                      Food waste in kilograms hasn't been estimated because a
                      serving-weight assumption is unavailable.
                    </div>
                  )}

                  <p className="text-[11px] text-ink-muted mt-2">
                    Surplus buffer portions estimated to remain unconsumed.
                  </p>
                </div>
              </div>

              {/* Actionable Recommendations (if any) */}
              {foodPlanResponse.recommendations.length > 0 && (
                <div className="bg-paper-inset/40 border border-line rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-ink-muted block">
                    Food Waste & Cost Recommendations
                  </span>
                  {foodPlanResponse.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="text-xs text-ink-muted flex items-start space-x-2"
                    >
                      <Sparkles className="w-4 h-4 text-moss-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-ink">{rec.title}:</strong>{" "}
                        {rec.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Constraint Warnings / Evaluation (if any) */}
              {foodPlanResponse.constraints_evaluation &&
                foodPlanResponse.constraints_evaluation.filter(
                  (c) => c.status === "VIOLATED" || c.status === "WARNING",
                ).length > 0 && (
                  <div className="p-4 rounded-2xl bg-clay-50 border border-clay-300 text-xs text-clay-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-clay-800">
                      <AlertTriangle className="w-4 h-4 text-clay-600" />
                      Preference & Constraint Notices:
                    </span>
                    {foodPlanResponse.constraints_evaluation
                      .filter(
                        (c) =>
                          c.status === "VIOLATED" || c.status === "WARNING",
                      )
                      .map((c, i) => (
                        <p key={i} className="ml-5">
                          <strong>{c.description}:</strong> {c.message}
                        </p>
                      ))}
                  </div>
                )}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION F — Explainable Estimates */}
        {/* ========================================================================= */}
        {foodPlanResponse && (
          <section className="mb-10 pt-6 border-t border-line">
            <button
              type="button"
              onClick={() => setIsExplainOpen(!isExplainOpen)}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-moss-700 hover:text-moss-800 focus:outline-none cursor-pointer"
              aria-expanded={isExplainOpen}
            >
              <span>How we calculated your food estimates</span>
              {isExplainOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {isExplainOpen && (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-ink-muted">
                  These estimates are based on your event size (
                  {foodPlanResponse.expected_attendees} attendees), your
                  selected meal schedule, and verified reference benchmarks or
                  quotes.
                </p>

                {/* 1. Estimated food servings */}
                <div className="p-4 rounded-2xl bg-paper-inset/30 border border-line text-xs text-ink space-y-2">
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-4 h-4 text-moss-700" />
                    <h4 className="font-semibold text-ink text-sm">
                      Estimated food servings
                    </h4>
                  </div>
                  <p className="text-ink-muted">
                    The number of servings needed is calculated from your
                    attendee count and the expected attendance rate for each
                    meal.
                  </p>

                  <div className="bg-paper-raised rounded-xl p-3 border border-line space-y-1.5">
                    {foodPlanResponse.meal_plans.map((meal, idx) => {
                      const attendees = meal.attendee_count;
                      const partRate =
                        meal.participation_rate_used != null
                          ? Number(meal.participation_rate_used)
                          : null;
                      const partPct =
                        partRate != null
                          ? Math.round(
                              partRate <= 1 ? partRate * 100 : partRate,
                            )
                          : null;
                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1"
                        >
                          <span className="font-semibold text-ink">
                            {meal.name || meal.meal_type}
                          </span>
                          <span className="text-ink-muted font-mono text-[11px]">
                            {attendees} attendees{" "}
                            {partPct != null ? `× ${partPct}% attendance` : ""}{" "}
                            = {meal.estimated_servings} portions
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {foodPlanResponse.meal_plans.length > 1 && (
                    <div className="text-xs font-semibold text-ink pt-1">
                      Total across all {foodPlanResponse.meal_plans.length}{" "}
                      meals: {foodPlanResponse.total_estimated_servings}{" "}
                      portions
                    </div>
                  )}

                  {foodPlanResponse.total_veg_servings != null &&
                    foodPlanResponse.total_non_veg_servings != null &&
                    foodPlanResponse.total_non_veg_servings > 0 && (
                      <p className="text-[11px] text-ink-muted">
                        Dietary split: {foodPlanResponse.total_veg_servings}{" "}
                        vegetarian and {foodPlanResponse.total_non_veg_servings}{" "}
                        non-vegetarian portions.
                      </p>
                    )}
                </div>

                {/* 2. Estimated food cost */}
                <div className="p-4 rounded-2xl bg-paper-inset/30 border border-line text-xs text-ink space-y-2">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-ink-muted" />
                    <h4 className="font-semibold text-ink text-sm">
                      Estimated food cost
                    </h4>
                  </div>

                  {foodPlanResponse.cost_summary.pricing_approach ===
                  "USER_PROVIDED_TOTAL" ? (
                    <p className="text-ink-muted">
                      Cost is based on your specified total catering contract
                      quote of{" "}
                      <strong className="text-ink">
                        ₹
                        {Number(
                          foodPlanResponse.cost_summary.estimated_total_cost,
                        ).toLocaleString()}
                      </strong>
                      .
                    </p>
                  ) : foodPlanResponse.cost_summary.pricing_approach ===
                    "USER_PROVIDED_UNIT" ? (
                    <div className="space-y-1.5">
                      <p className="text-ink-muted">
                        Cost is calculated from your entered rate per portion:
                      </p>
                      <div className="bg-paper-raised rounded-xl p-3 border border-line font-mono text-ink text-xs">
                        {foodPlanResponse.total_estimated_servings} portions × ₹
                        {Number(foodConfig.known_unit_cost || 0)} per portion =
                        ₹
                        {Number(
                          foodPlanResponse.cost_summary.estimated_total_cost,
                        ).toLocaleString()}
                      </div>
                    </div>
                  ) : foodPlanResponse.cost_summary.estimated_total_cost !=
                    null ? (
                    <div className="space-y-2">
                      <p className="text-ink-muted">
                        Cost is estimated using reference catering rates for
                        campus events:
                      </p>
                      <div className="bg-paper-raised rounded-xl p-3 border border-line space-y-1.5">
                        {foodPlanResponse.meal_plans.map((meal, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1"
                          >
                            <span className="font-semibold text-ink">
                              {meal.name || meal.meal_type}
                            </span>
                            <span className="text-ink-muted font-mono text-[11px]">
                              {meal.estimated_servings} portions × ₹
                              {Number(meal.unit_cost || 0).toFixed(2)} = ₹
                              {Number(meal.total_cost || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs font-semibold text-ink flex justify-between pt-1">
                        <span>Total catering cost:</span>
                        <span>
                          ₹
                          {Number(
                            foodPlanResponse.cost_summary.estimated_total_cost,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-clay-800 bg-clay-50 p-2.5 rounded-xl border border-clay-200">
                      Cost could not be calculated because reference pricing
                      assumptions are unavailable.
                    </p>
                  )}
                </div>

                {/* 3. Expected food waste */}
                <div className="p-4 rounded-2xl bg-paper-inset/30 border border-line text-xs text-ink space-y-2">
                  <div className="flex items-center space-x-2">
                    <Leaf className="w-4 h-4 text-moss-700" />
                    <h4 className="font-semibold text-ink text-sm">
                      Expected food waste
                    </h4>
                  </div>

                  {foodPlanResponse.waste_summary.waste_percentage_used !=
                  null ? (
                    <div className="space-y-2">
                      <p className="text-ink-muted">
                        Catering operations typically include a small surplus
                        buffer. Based on campus event reference data, an
                        estimated{" "}
                        <strong className="text-ink">
                          {Math.round(
                            Number(
                              foodPlanResponse.waste_summary
                                .waste_percentage_used,
                            ) *
                              (Number(
                                foodPlanResponse.waste_summary
                                  .waste_percentage_used,
                              ) <= 1
                                ? 100
                                : 1),
                          )}
                          %
                        </strong>{" "}
                        of prepared portions is expected to remain unconsumed.
                      </p>

                      <div className="bg-paper-raised rounded-xl p-3 border border-line font-mono text-ink text-xs space-y-1">
                        <div>
                          {foodPlanResponse.total_estimated_servings} portions ×{" "}
                          {Math.round(
                            Number(
                              foodPlanResponse.waste_summary
                                .waste_percentage_used,
                            ) *
                              (Number(
                                foodPlanResponse.waste_summary
                                  .waste_percentage_used,
                              ) <= 1
                                ? 100
                                : 1),
                          )}
                          % surplus ={" "}
                          {
                            foodPlanResponse.waste_summary
                              .estimated_waste_servings
                          }{" "}
                          servings
                        </div>

                        {foodPlanResponse.waste_summary.estimated_waste_kg !=
                          null &&
                        foodPlanResponse.waste_summary.serving_weight_kg_used !=
                          null ? (
                          <div className="pt-1 text-ink-muted border-t border-line">
                            {
                              foodPlanResponse.waste_summary
                                .estimated_waste_servings
                            }{" "}
                            servings ×{" "}
                            {Number(
                              foodPlanResponse.waste_summary
                                .serving_weight_kg_used,
                            ).toFixed(2)}{" "}
                            kg/serving ={" "}
                            {foodPlanResponse.waste_summary.estimated_waste_kg}{" "}
                            kg waste mass
                          </div>
                        ) : null}
                      </div>

                      {foodPlanResponse.waste_summary.estimated_waste_kg ==
                        null && (
                        <p className="text-[11px] text-ink-muted italic">
                          Food waste in kilograms was not calculated because an
                          average portion weight benchmark is not available.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-ink-muted italic">
                      Food waste estimates are currently unavailable.
                    </p>
                  )}
                </div>

                {/* Note below Expected Food Waste calculation */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-paper-inset/40 border border-line text-ink-muted flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-ink-faint flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] sm:text-xs text-ink-muted leading-relaxed">
                    These figures are estimates based on configured assumptions.
                    Actual food waste may vary depending on the menu, serving
                    sizes, and attendee consumption.
                  </p>
                </div>

                {/* 4. Assumptions and data sources */}
                <div className="p-4 rounded-2xl bg-paper-inset/30 border border-line text-xs text-ink space-y-3">
                  <div>
                    <h4 className="font-semibold text-ink text-sm">
                      Assumptions and data sources
                    </h4>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Values and reference benchmarks used to produce these
                      estimates:
                    </p>
                  </div>

                  {foodPlanResponse.assumptions_used &&
                  foodPlanResponse.assumptions_used.length > 0 ? (
                    <div className="space-y-2">
                      {foodPlanResponse.assumptions_used.map((assump, idx) => {
                        const paramLabel = getHumanReadableParameter(
                          assump.parameter,
                        );
                        const sourceInfo = formatSourceType(assump.source_type);
                        const formattedVal = formatAssumptionValue(
                          assump.parameter,
                          assump.value,
                          assump.unit,
                        );
                        return (
                          <div
                            key={idx}
                            className="p-3 bg-paper-raised rounded-xl border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-semibold text-ink text-xs block">
                                {paramLabel}
                              </span>
                              <span className="text-[11px] text-ink-muted">
                                {assump.explanation ||
                                  assump.reference_notes ||
                                  "Standard planning assumption"}
                              </span>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 flex-shrink-0">
                              <span className="font-bold text-ink text-xs">
                                {formattedVal}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  sourceInfo.isUser
                                    ? "bg-moss-100 text-moss-800 border-moss-300"
                                    : "bg-paper-inset text-ink-muted border-line"
                                }`}
                              >
                                {sourceInfo.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-ink-muted italic">
                      No external assumptions were required for this
                      calculation.
                    </p>
                  )}

                  {foodPlanResponse.missing_assumptions &&
                    foodPlanResponse.missing_assumptions.length > 0 && (
                      <div className="pt-2 border-t border-line">
                        <span className="font-semibold text-ink block text-[11px] mb-1">
                          Unavailable benchmarks:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {foodPlanResponse.missing_assumptions.map(
                            (m, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-paper-inset text-ink-muted rounded-md text-[10px] border border-line"
                              >
                                {getHumanReadableParameter(m)}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* Navigation Buttons */}
        {/* ========================================================================= */}
        <div className="pt-8 border-t border-line flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl border border-line hover:bg-paper-inset/60 text-ink font-semibold text-sm transition-colors focus:outline-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Constraints</span>
          </button>

          <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-moss-700 hover:bg-moss-800 text-paper-raised font-bold text-sm shadow-sm transition-all focus:outline-none cursor-pointer"
            >
              <span>Continue to Waste Planning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!foodPlanResponse && (
              <span className="text-[11px] text-ink-faint mt-1">
                You can continue without calculating, or calculate now to
                preview estimates.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
