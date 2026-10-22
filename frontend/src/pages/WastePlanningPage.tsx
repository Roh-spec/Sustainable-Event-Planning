import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { WaypointIcon } from "../components/icons";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";
import { WasteLiveReceipt } from "../components/planning/waste/WasteLiveReceipt";
import { WasteCategorySelector } from "../components/planning/waste/WasteCategorySelector";
import { WasteResultsSection } from "../components/planning/waste/WasteResultsSection";
import { WasteExplainableSection } from "../components/planning/waste/WasteExplainableSection";
import { useWastePlanningState } from "../hooks/useWastePlanningState";
import { usePageTitle } from "../hooks/usePageTitle";

export const WastePlanningPage: React.FC = () => {
  usePageTitle("Materials & Waste · EcoPlan");

  const {
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
  } = useWastePlanningState();

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

          {/* Four Selectable Categories & Estimate CTA */}
          <WasteCategorySelector
            isFoodSelected={isFoodSelected}
            isDisposableSelected={isDisposableSelected}
            isPlasticSelected={isPlasticSelected}
            isOtherSelected={isOtherSelected}
            onToggleFood={handleToggleFood}
            onToggleDisposable={handleToggleDisposable}
            onTogglePlastic={handleTogglePlastic}
            onToggleOther={handleToggleOther}
            hasScheduledMeals={foodConfig.meals.length > 0}
            isEstimating={isEstimating}
            onEstimateWaste={handleEstimateWaste}
          />

          {/* Results Section */}
          {wastePlanResponse && (
            <WasteResultsSection
              response={wastePlanResponse}
              isFoodSelected={isFoodSelected}
              isDisposableSelected={isDisposableSelected}
              isPlasticSelected={isPlasticSelected}
              isOtherSelected={isOtherSelected}
            />
          )}

          {/* Explainable Estimation & Disclaimers */}
          {wastePlanResponse && (
            <WasteExplainableSection
              response={wastePlanResponse}
              isOpen={isExplanationOpen}
              onToggle={() => setIsExplanationOpen(!isExplanationOpen)}
              expectedAttendees={event?.expected_attendees || "attendees"}
            />
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
                  <WaypointIcon className="w-5 h-5" />
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
