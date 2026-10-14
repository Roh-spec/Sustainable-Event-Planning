import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Columns3,
  CheckCircle,
  AlertCircle,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";
import { PlanCard } from "../components/planning/PlanCard";
import { InfeasibleBudgetAlert } from "../components/planning/InfeasibleBudgetAlert";
import { PlanAlternative } from "../types/planning";
import { PlanSelectionResult } from "../api/planning";
import { formatCurrency } from "../utils/metricFormatting";

export const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    loadEvent,
    budget,
    planningResponse,
    generatePlans,
    isGenerating,
    selectedPlan,
    selectPlan,
  } = usePlanningWizard();

  const [selectionModalPlan, setSelectionModalPlan] =
    useState<PlanAlternative | null>(null);
  const [selectionResult, setSelectionResult] =
    useState<PlanSelectionResult | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [retryingBudget, setRetryingBudget] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) =>
        setError(`Failed to load event: ${err.message}`),
      );
    }
  }, [eventId]);

  // If page is loaded directly and plans are not generated yet, attempt generation
  useEffect(() => {
    if (event && !planningResponse && !isGenerating) {
      generatePlans().catch((err) => {
        setError(err.message || "Could not generate plans automatically.");
      });
    }
  }, [event, planningResponse]);

  const handleApproveBudgetIncrease = async (approvedAmount: string) => {
    setRetryingBudget(true);
    setError(null);
    try {
      await generatePlans(true, approvedAmount);
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to generate plans with approved budget increase.",
      );
    } finally {
      setRetryingBudget(false);
    }
  };

  const handleOpenSelectModal = (plan: PlanAlternative) => {
    setSelectionModalPlan(plan);
    setSelectionResult(null);
  };

  const handleConfirmSelection = async () => {
    if (!selectionModalPlan) return;
    setIsSelecting(true);
    try {
      const result = await selectPlan(selectionModalPlan);
      setSelectionResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to select plan.");
    } finally {
      setIsSelecting(false);
    }
  };

  const plans = planningResponse?.plans || [];
  const isInfeasible = planningResponse?.status === "INFEASIBLE_BUDGET";

  // Dynamic grid configuration based on plan count to prevent narrow cards & excessive empty space
  const getGridContainerClass = (count: number) => {
    if (count === 1) return "max-w-3xl mx-auto";
    if (count === 2)
      return "grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-6";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <WizardProgress currentStep={6} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner event={event} budget={budget} />

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-8 lg:p-8 mb-8">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Step 6 of 7 • Generated Sustainable Plans</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Your Sustainable Event Plan
            </h1>
          </div>

          {/* Secondary Action: Compare Plans (only when at least 2 distinct plans exist) */}
          {plans.length >= 2 && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                to={`/events/${event?.id || eventId}/compare`}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm transition-all focus:outline-none"
              >
                <Columns3 className="w-4 h-4 text-emerald-600" />
                <span>Compare Plans Side-by-Side</span>
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm"
          >
            {error}
          </div>
        )}

        {/* Infeasible Budget Scenario */}
        {isInfeasible && (
          <InfeasibleBudgetAlert
            currentBudget={planningResponse?.budget || budget.total_budget}
            minFeasibleBudget={planningResponse?.min_feasible_budget}
            budgetDeficit={planningResponse?.budget_deficit}
            currency={budget.currency || "INR"}
            onApproveBudgetIncrease={handleApproveBudgetIncrease}
            isRetrying={retryingBudget}
          />
        )}

        {/* Selected Plan Status Banner */}
        {selectedPlan && (
          <div className="mb-6 py-3 px-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="p-1 rounded-md bg-emerald-600 text-white flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>
                Active Selection:{" "}
                <strong className="font-bold text-emerald-950">
                  {selectedPlan.name}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {plans.length > 1 && (
                <Link
                  to={`/events/${event?.id || eventId}/compare`}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 flex-shrink-0"
                >
                  Compare Side-by-Side
                </Link>
              )}
              <Link
                to={`/events/${event?.id || eventId}/complete-plan`}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>Continue to Complete Event Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {isGenerating ? (
          <div className="p-16 text-center">
            <div className="inline-block w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-700">
              Evaluating multi-objective alternatives...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Calculating measurable food waste, single-use items, and costs.
            </p>
          </div>
        ) : plans.length === 0 && !isInfeasible ? (
          <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">
              No Feasible Plans Generated
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Please check your constraint parameters and food configuration, or
              try regenerating.
            </p>
            <button
              type="button"
              onClick={() => generatePlans()}
              className="mt-4 inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Generation</span>
            </button>
          </div>
        ) : (
          <div className={getGridContainerClass(plans.length)}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.plan_id}
                plan={plan}
                eventBudget={event?.budget?.total_budget || budget.total_budget}
                isSelected={selectedPlan?.plan_id === plan.plan_id}
                onSelect={handleOpenSelectModal}
                currency={budget.currency || "INR"}
              />
            ))}
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/events/${event?.id || eventId}/waste`)}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors focus:outline-none w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Waste Step</span>
          </button>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {plans.length >= 2 && (
              <Link
                to={`/events/${event?.id || eventId}/compare`}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-sm transition-all focus:outline-none"
              >
                <Columns3 className="w-4 h-4 text-emerald-600" />
                <span>Compare Plans</span>
              </Link>
            )}
            {selectedPlan && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/events/${event?.id || eventId}/complete-plan`)
                }
                className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all focus:outline-none"
              >
                <span>Continue to Complete Event Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plan Selection Confirmation Modal */}
      {selectionModalPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="selection-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Plan Selection Confirmation
                </span>
                <h3
                  id="selection-modal-title"
                  className="text-xl font-extrabold text-slate-900 mt-2"
                >
                  Select {selectionModalPlan.name}?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectionModalPlan(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are explicitly selecting the{" "}
              <strong>{selectionModalPlan.name}</strong> for this event (
              <em>{event?.name}</em>).
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Total Cost:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(
                    selectionModalPlan.estimated_cost,
                    budget.currency || "INR",
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Food Waste:</span>
                <span className="font-bold text-slate-900">
                  {selectionModalPlan.food_metrics?.estimated_waste_kg
                    ? `${selectionModalPlan.food_metrics.estimated_waste_kg} kg`
                    : selectionModalPlan.food_metrics?.estimated_waste_servings
                      ? `${selectionModalPlan.food_metrics.estimated_waste_servings} servings`
                      : "Not estimated"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Single-use Items:</span>
                <span className="font-bold text-slate-900">
                  {selectionModalPlan.waste_metrics
                    ?.single_use_packaging_items ?? "Not estimated"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reusable Items:</span>
                <span className="font-bold text-slate-900">
                  {selectionModalPlan.waste_metrics?.reusable_packaging_items ??
                    "Not estimated"}
                </span>
              </div>
            </div>

            {selectionResult ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-emerald-950">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Plan Selection Confirmed</span>
                </div>
                <p>{selectionResult.message}</p>
                <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectionModalPlan(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Stay on Plans / Select Different
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionModalPlan(null);
                      navigate(`/events/${event?.id || eventId}/complete-plan`);
                    }}
                    className="inline-flex items-center justify-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                  >
                    <span>Continue to Complete Event Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectionModalPlan(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={isSelecting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  {isSelecting ? "Confirming..." : "Confirm Plan Selection"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
