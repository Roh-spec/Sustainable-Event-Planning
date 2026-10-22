import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";
import { FoodLiveReceipt } from "../components/planning/food/FoodLiveReceipt";
import { MealSelectionSection } from "../components/planning/food/MealSelectionSection";
import { DietaryPreferenceSection } from "../components/planning/food/DietaryPreferenceSection";
import { FoodBudgetSection } from "../components/planning/food/FoodBudgetSection";
import { FoodCustomizationSection } from "../components/planning/food/FoodCustomizationSection";
import { FoodCalculationSection } from "../components/planning/food/FoodCalculationSection";
import { FoodExplainableSection } from "../components/planning/food/FoodExplainableSection";
import { useFoodPlanningState } from "../hooks/useFoodPlanningState";
import { usePageTitle } from "../hooks/usePageTitle";

export const FoodPlanningPage: React.FC = () => {
  usePageTitle("Food & Catering · EcoPlan");

  const {
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
  } = useFoodPlanningState();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-32 lg:pb-8">
      <WizardProgress currentStep={4} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner event={event} budget={budget} />

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-4">
        <div className="flex-1 w-full min-w-0 surface-sheet p-6 sm:p-10">
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
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-muted bg-paper-inset/40 border border-line rounded-control px-4 py-2.5">
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
              className="mb-6 p-4 rounded-control bg-clay-50 border border-clay-300 text-clay-900 text-sm flex items-start space-x-2.5"
            >
              <AlertCircle className="w-5 h-5 text-clay-700 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {apiError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-control bg-clay-50 border border-clay-300 text-clay-900 text-sm flex items-start space-x-2.5"
            >
              <AlertCircle className="w-5 h-5 text-clay-700 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Section A: Select Meals */}
          <MealSelectionSection
            durationDays={durationDays}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            meals={foodConfig.meals}
            onToggleMeal={handleToggleMeal}
            onCopyMealsToAllDays={handleCopyMealsToAllDays}
          />

          {/* Section B: Food Preference */}
          <DietaryPreferenceSection
            preference={foodConfig.default_dietary_preference}
            onPreferenceChange={handleDietaryChange}
            vegRatio={foodConfig.vegetarian_ratio}
            onVegRatioChange={(ratio) =>
              setFoodConfig((prev) => ({ ...prev, vegetarian_ratio: ratio }))
            }
          />

          {/* Section C: Food Budget */}
          <FoodBudgetSection
            budgetMode={foodConfig.budgetMode}
            onBudgetModeChange={handleBudgetModeChange}
            foodBudget={foodConfig.food_budget}
            onFoodBudgetChange={(val) =>
              setFoodConfig((prev) => ({ ...prev, food_budget: val }))
            }
          />

          {/* Section D: Optional Customization */}
          <FoodCustomizationSection
            isOpen={isCustomizationOpen}
            onToggle={() => setIsCustomizationOpen(!isCustomizationOpen)}
            meals={foodConfig.meals}
            durationDays={durationDays}
            expectedAttendees={event?.expected_attendees || 100}
            onUpdateMeal={updateMealCustomization}
            costApproach={foodConfig.costApproach}
            onCostApproachChange={(approach) =>
              setFoodConfig((prev) => ({ ...prev, costApproach: approach }))
            }
            knownUnitCost={foodConfig.known_unit_cost}
            onKnownUnitCostChange={(val) =>
              setFoodConfig((prev) => ({ ...prev, known_unit_cost: val }))
            }
            costPricingUnit={foodConfig.cost_pricing_unit}
            onCostPricingUnitChange={(unit) =>
              setFoodConfig((prev) => ({ ...prev, cost_pricing_unit: unit }))
            }
            knownTotalCost={foodConfig.known_total_cost}
            onKnownTotalCostChange={(val) =>
              setFoodConfig((prev) => ({ ...prev, known_total_cost: val }))
            }
          />

          {/* Section E: Explicit Calculation & Results */}
          <FoodCalculationSection
            response={foodPlanResponse}
            isCalculating={isCalculating}
            onCalculate={handleCalculateFoodEstimates}
          />

          {/* Section F: Explainable Estimates & Assumptions */}
          {foodPlanResponse && (
            <FoodExplainableSection
              response={foodPlanResponse}
              isOpen={isExplainOpen}
              onToggle={() => setIsExplainOpen(!isExplainOpen)}
              knownUnitCost={foodConfig.known_unit_cost}
            />
          )}

          {/* Navigation Buttons */}
          <div className="pt-8 border-t border-line flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="btn-ghost px-6 py-3 font-semibold text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Constraints</span>
            </button>

            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary px-8 py-3.5 font-bold text-sm"
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

        <FoodLiveReceipt
          totalCost={liveEstimates.totalCost}
          surplusKg={liveEstimates.surplusKg}
          surplusServings={liveEstimates.surplusServings}
          remainingBudget={liveEstimates.remainingBudget}
          isOverBudget={liveEstimates.isOverBudget}
          mealCount={foodConfig.meals.length}
          attendees={event?.expected_attendees || 100}
          currency={budget?.currency || "INR"}
          isCalculated={liveEstimates.isCalculated}
        />
      </div>
    </div>
  );
};
