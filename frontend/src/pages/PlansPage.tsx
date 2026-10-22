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
import { PlanAlternative, PlanningResponse } from "../types/planning";
import { PlanSelectionResult } from "../api/planning";
import { formatCurrency } from "../utils/metricFormatting";
import { staggerEntrance } from "../utils/animations";

export const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    loadEvent,
    budget,
    planningResponse,
    setPlanningResponse,
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

  const plans = planningResponse?.plans || [];

  // Demo preview loader for design inspection
  const loadDemoPlans = () => {
    const demoResponse: PlanningResponse = {
      event_id: Number(eventId) || 1,
      event_name: event?.name || "Eco Innovators Summit 2026",
      expected_attendees: 150,
      budget: budget.total_budget || "60000",
      status: "COMPLETE",
      plans: [
        {
          plan_id: "plan_budget",
          name: "Cost-Effective Baseline Plan",
          planning_objective: "BUDGET_FOCUSED" as const,
          candidate_id: "cand_budget_1",
          feasible: true,
          estimated_cost: "38500",
          food_metrics: {
            estimated_waste_kg: "22.5",
            estimated_waste_servings: "60",
          },
          waste_metrics: {
            total_packaging_items: "450",
            reusable_packaging_items: "120",
            single_use_packaging_items: "330",
            reusable_percentage: "26.7",
            total_plastic_items: "150",
          },
          sustainability_metrics: [
            {
              metric_name: "food_waste_kg",
              value: "22.5",
              unit: "kg",
              source_type: "ESTIMATED" as const,
              module: "FOOD",
            },
          ],
          constraint_result: {
            feasible: true,
            required_satisfied: true,
            not_allowed_satisfied: true,
            preferred_satisfied: true,
            budget_satisfied: true,
            flexible_adjustments: [],
            violations: [],
            relaxed_constraints: [],
          },
          assumptions_used: [
            {
              parameter: "food_waste_percentage",
              value: "0.20",
              unit: "ratio",
              source_type: "REFERENCE",
              is_resolved: true,
            },
          ],
          tradeoffs: [
            "Saves ₹14,500 compared to Maximum Eco Impact, but relies on 330 single-use items.",
          ],
          explanations: [
            "Prioritizes minimal financial expenditure while meeting attendee catering targets.",
          ],
        },
        {
          plan_id: "plan_balanced",
          name: "Pragmatic Circular Plan",
          planning_objective: "BALANCED" as const,
          candidate_id: "cand_balanced_1",
          feasible: true,
          estimated_cost: "48000",
          food_metrics: {
            estimated_waste_kg: "16.0",
            estimated_waste_servings: "42",
          },
          waste_metrics: {
            total_packaging_items: "450",
            reusable_packaging_items: "315",
            single_use_packaging_items: "135",
            reusable_percentage: "70.0",
            total_plastic_items: "35",
          },
          sustainability_metrics: [
            {
              metric_name: "food_waste_kg",
              value: "16.0",
              unit: "kg",
              source_type: "ESTIMATED" as const,
              module: "FOOD",
            },
          ],
          constraint_result: {
            feasible: true,
            required_satisfied: true,
            not_allowed_satisfied: true,
            preferred_satisfied: true,
            budget_satisfied: true,
            flexible_adjustments: [],
            violations: [],
            relaxed_constraints: [],
          },
          assumptions_used: [
            {
              parameter: "food_waste_percentage",
              value: "0.14",
              unit: "ratio",
              source_type: "REFERENCE",
              is_resolved: true,
            },
          ],
          tradeoffs: [
            "Moderate cost increase yields 70% reusable tableware and reduces plastic by 76%.",
          ],
          explanations: [
            "Optimal balance between fiscal responsibility and high environmental impact.",
          ],
        },
        {
          plan_id: "plan_sustainable",
          name: "Zero-Waste Hero Alternative",
          planning_objective: "SUSTAINABILITY_FOCUSED" as const,
          candidate_id: "cand_eco_1",
          feasible: true,
          estimated_cost: "53000",
          food_metrics: {
            estimated_waste_kg: "11.0",
            estimated_waste_servings: "28",
          },
          waste_metrics: {
            total_packaging_items: "450",
            reusable_packaging_items: "450",
            single_use_packaging_items: "0",
            reusable_percentage: "100.0",
            total_plastic_items: "0",
          },
          sustainability_metrics: [
            {
              metric_name: "food_waste_kg",
              value: "11.0",
              unit: "kg",
              source_type: "ESTIMATED" as const,
              module: "FOOD",
            },
          ],
          constraint_result: {
            feasible: true,
            required_satisfied: true,
            not_allowed_satisfied: true,
            preferred_satisfied: true,
            budget_satisfied: true,
            flexible_adjustments: [],
            violations: [],
            relaxed_constraints: [],
          },
          assumptions_used: [
            {
              parameter: "food_waste_percentage",
              value: "0.10",
              unit: "ratio",
              source_type: "REFERENCE",
              is_resolved: true,
            },
          ],
          tradeoffs: [
            "Costs ₹5,000 more than Balanced alternative but completely eliminates disposable plastics and single-use packaging.",
          ],
          explanations: [
            "100% reusable tableware and zero plastic packaging throughout the event.",
          ],
        },
      ],
      all_evaluated_candidates: [],
      assumptions_used: [],
      missing_assumptions: [],
      warnings: [],
    };
    setPlanningResponse(demoResponse);
    sessionStorage.setItem(
      "wizard_planning_response",
      JSON.stringify(demoResponse),
    );
  };

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "true") {
      loadDemoPlans();
    }
  }, []);

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

  // Subtle stagger entrance reveal when plans change
  useEffect(() => {
    if (plans.length > 0) {
      staggerEntrance(".plan-card-item", {
        stagger: 70,
        duration: 480,
        translateY: 14,
      });
    }
  }, [plans.length]);

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

  useEffect(() => {
    document.title = "Plans · EcoPlan";
  }, []);

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

      <div className="surface-sheet p-6 sm:p-10 mb-8">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-6 border-b border-line">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-paper-inset text-moss-800 text-xs font-semibold tracking-wide uppercase mb-2 border border-line">
              <Sparkles className="w-3.5 h-3.5 text-moss-600" />
              <span>Step 6 of 7 • Generated Sustainable Plans</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Your Sustainable Event Plan
            </h1>
          </div>

          {/* Secondary Action: Compare Plans (only when at least 2 distinct plans exist) */}
          {plans.length >= 2 && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                to={`/events/${event?.id || eventId}/compare`}
                className="btn-ghost text-xs py-2.5 px-4"
              >
                <Columns3 className="w-4 h-4 text-moss-600" />
                <span>Compare Plans Side-by-Side</span>
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-control bg-clay-50 border border-clay-300 text-clay-900 text-sm"
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
          <div className="mb-6 py-3.5 px-5 rounded-sheet bg-moss-50 border border-moss-300 text-moss-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-subtle">
            <div className="flex items-center space-x-2.5">
              <div className="p-1 rounded-control bg-moss-700 text-paper-raised flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-ink">
                Active Selection:{" "}
                <strong className="font-bold text-ink">
                  {selectedPlan.name}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {plans.length > 1 && (
                <Link
                  to={`/events/${event?.id || eventId}/compare`}
                  className="font-bold text-moss-700 hover:text-moss-900 underline underline-offset-2 flex-shrink-0"
                >
                  Compare Side-by-Side
                </Link>
              )}
              <Link
                to={`/events/${event?.id || eventId}/complete-plan`}
                className="btn-primary text-xs py-2 px-4"
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
            <div className="inline-block w-10 h-10 border-4 border-moss-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-ink">
              Evaluating multi-objective alternatives...
            </p>
            <p className="text-xs text-ink-muted mt-1">
              Calculating measurable food waste, single-use items, and costs.
            </p>
          </div>
        ) : plans.length === 0 && !isInfeasible ? (
          <div className="p-16 text-center border-2 border-dashed border-line rounded-sheet bg-paper-inset/20">
            <AlertCircle className="w-8 h-8 text-ink-muted mx-auto mb-2" />
            <h4 className="font-serif text-base font-bold text-ink">
              No Feasible Plans Generated
            </h4>
            <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
              Please check your constraint parameters and food configuration, or
              try regenerating.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => generatePlans()}
                className="btn-primary text-xs py-2 px-5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Generation</span>
              </button>
              <button
                type="button"
                onClick={loadDemoPlans}
                className="btn-ghost text-xs py-2 px-4"
              >
                <Sparkles className="w-3.5 h-3.5 text-moss-600" />
                <span>Load Sample Alternatives</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={getGridContainerClass(plans.length)}>
            {plans.map((plan) => (
              <div key={plan.plan_id} className="plan-card-item h-full">
                <PlanCard
                  plan={plan}
                  eventBudget={event?.budget?.total_budget || budget.total_budget}
                  isSelected={selectedPlan?.plan_id === plan.plan_id}
                  onSelect={handleOpenSelectModal}
                  currency={budget.currency || "INR"}
                />
              </div>
            ))}
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="pt-8 mt-8 border-t border-line flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/events/${event?.id || eventId}/waste`)}
            className="btn-ghost w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Waste Step</span>
          </button>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {plans.length >= 2 && (
              <Link
                to={`/events/${event?.id || eventId}/compare`}
                className="btn-ghost"
              >
                <Columns3 className="w-4 h-4 text-moss-600" />
                <span>Compare Plans</span>
              </Link>
            )}
            {selectedPlan && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/events/${event?.id || eventId}/complete-plan`)
                }
                className="btn-primary"
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
          className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="surface-sheet max-w-lg w-full p-6 sm:p-8 shadow-modal space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="label-kicker">Plan Selection Confirmation</span>
                <h3
                  id="selection-modal-title"
                  className="font-serif text-xl font-bold text-ink mt-1.5"
                >
                  Select {selectionModalPlan.name}?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectionModalPlan(null)}
                className="text-ink-muted hover:text-ink p-1.5 rounded-control hover:bg-paper-inset transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              You are explicitly selecting the{" "}
              <strong className="text-ink font-bold">
                {selectionModalPlan.name}
              </strong>{" "}
              for this event (
              <em className="text-ink">{event?.name}</em>).
            </p>

            <div className="p-4 bg-paper-inset/40 border border-line rounded-control text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-muted">Estimated Total Cost:</span>
                <span className="font-mono font-bold text-ink">
                  {formatCurrency(
                    selectionModalPlan.estimated_cost,
                    budget.currency || "INR",
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Food Waste:</span>
                <span className="font-mono font-bold text-ink">
                  {selectionModalPlan.food_metrics?.estimated_waste_kg
                    ? `${selectionModalPlan.food_metrics.estimated_waste_kg} kg`
                    : selectionModalPlan.food_metrics?.estimated_waste_servings
                      ? `${selectionModalPlan.food_metrics.estimated_waste_servings} servings`
                      : "Not estimated"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Single-use Items:</span>
                <span className="font-mono font-bold text-ink">
                  {selectionModalPlan.waste_metrics
                    ?.single_use_packaging_items ?? "Not estimated"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Reusable Items:</span>
                <span className="font-mono font-bold text-moss-700">
                  {selectionModalPlan.waste_metrics?.reusable_packaging_items ??
                    "Not estimated"}
                </span>
              </div>
            </div>

            {selectionResult ? (
              <div className="p-4 rounded-control bg-moss-50 border border-moss-300 text-xs text-moss-950 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-moss-900">
                  <CheckCircle className="w-4 h-4 text-moss-600" />
                  <span>Plan Selection Confirmed</span>
                </div>
                <p className="text-ink-muted">{selectionResult.message}</p>
                <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectionModalPlan(null)}
                    className="btn-ghost text-xs py-2 px-4"
                  >
                    Stay on Plans / Select Different
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionModalPlan(null);
                      navigate(`/events/${event?.id || eventId}/complete-plan`);
                    }}
                    className="btn-primary text-xs py-2 px-4"
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
                  className="btn-ghost text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={isSelecting}
                  className="btn-primary text-xs py-2 px-5"
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
