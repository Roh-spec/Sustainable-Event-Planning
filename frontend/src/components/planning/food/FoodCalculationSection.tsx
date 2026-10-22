import React from "react";
import {
  Loader2,
  Utensils,
  Wallet,
  Leaf,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { PlateIcon, SproutIcon } from "../../icons";
import { AnimatedCounter } from "../../common/AnimatedCounter";
import { FoodPlanResponse } from "../../../types/food";

export interface FoodCalculationSectionProps {
  response: FoodPlanResponse | null;
  isCalculating: boolean;
  onCalculate: () => void;
}

export const FoodCalculationSection: React.FC<FoodCalculationSectionProps> = ({
  response,
  isCalculating,
  onCalculate,
}) => {
  return (
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
          onClick={onCalculate}
          disabled={isCalculating}
          className="btn-primary px-6 py-3 font-bold text-sm"
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Calculating food estimates…</span>
            </>
          ) : (
            <>
              <PlateIcon className="w-4 h-4" />
              <span>Calculate Food Estimates</span>
            </>
          )}
        </button>
      </div>

      {/* State Before Calculation */}
      {!response && !isCalculating && (
        <div className="p-8 rounded-sheet border border-dashed border-line bg-paper-inset/30 text-center">
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
      {response && (
        <div className="space-y-6">
          {/* Primary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Servings Card */}
            <div className="bg-paper-raised border border-line rounded-sheet p-5 shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                  Estimated Servings
                </span>
                <Utensils className="w-4 h-4 text-moss-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-ink">
                {response.total_estimated_servings !== null &&
                response.total_estimated_servings !== undefined ? (
                  <AnimatedCounter
                    value={response.total_estimated_servings}
                    suffix=" portions"
                  />
                ) : (
                  "Unavailable"
                )}
              </div>
              {response.total_veg_servings != null &&
                response.total_non_veg_servings != null &&
                response.total_non_veg_servings > 0 && (
                  <div className="text-xs text-ink-muted mt-1.5 flex items-center gap-1.5 font-mono tabular-nums">
                    <span className="text-moss-700 font-semibold">
                      <AnimatedCounter
                        value={response.total_veg_servings}
                        suffix=" veg"
                      />
                    </span>
                    <span>•</span>
                    <span className="text-clay-700 font-semibold">
                      <AnimatedCounter
                        value={response.total_non_veg_servings}
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
            <div className="bg-paper-raised border border-line rounded-sheet p-5 shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                  Estimated Food Cost
                </span>
                <Wallet className="w-4 h-4 text-ink-muted" />
              </div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-ink font-mono tabular-nums">
                {response.cost_summary.estimated_total_cost !== null &&
                response.cost_summary.estimated_total_cost !== undefined ? (
                  <AnimatedCounter
                    value={response.cost_summary.estimated_total_cost}
                    prefix="₹"
                  />
                ) : (
                  "Cost unavailable"
                )}
              </div>
              {response.cost_summary.cost_per_attendee !== null &&
                response.cost_summary.cost_per_attendee !== undefined && (
                  <div className="text-xs text-ink-muted mt-1.5 font-medium font-mono tabular-nums">
                    <AnimatedCounter
                      value={response.cost_summary.cost_per_attendee}
                      prefix="₹"
                      suffix=" per attendee"
                      decimals={2}
                    />
                  </div>
                )}
              {response.cost_summary.is_over_budget ? (
                <div className="mt-2 text-[11px] font-bold text-clay-700 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-clay-700" />
                  <span>
                    ₹
                    {Number(
                      response.cost_summary.variance_amount,
                    ).toLocaleString()}{" "}
                    over allocated food budget
                  </span>
                </div>
              ) : response.cost_summary.food_budget ? (
                <div className="mt-2 text-[11px] font-semibold text-moss-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-moss-600" />
                  <span>Within allocated food budget</span>
                </div>
              ) : (
                <p className="text-[11px] text-ink-muted mt-2">
                  Pricing:{" "}
                  {response.cost_summary.pricing_approach
                    .toLowerCase()
                    .replace(/_/g, " ")}
                </p>
              )}
            </div>

            {/* 3. Food Waste Card */}
            <div className="bg-paper-raised border border-line rounded-sheet p-5 shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                  Expected Food Waste
                </span>
                <Leaf className="w-4 h-4 text-moss-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-ink font-mono tabular-nums">
                {response.waste_summary.estimated_waste_servings !== null &&
                response.waste_summary.estimated_waste_servings !== undefined ? (
                  <AnimatedCounter
                    value={response.waste_summary.estimated_waste_servings}
                    suffix=" servings"
                    decimals={2}
                  />
                ) : (
                  "Unavailable"
                )}
              </div>

              {response.waste_summary.estimated_waste_kg !== null &&
              response.waste_summary.estimated_waste_kg !== undefined ? (
                <div className="text-xs font-bold text-moss-800 mt-1.5 font-mono tabular-nums">
                  <AnimatedCounter
                    prefix="~"
                    value={response.waste_summary.estimated_waste_kg}
                    suffix=" kg estimated mass"
                    decimals={2}
                  />
                </div>
              ) : (
                <div className="text-[11px] text-clay-700 mt-1.5 bg-clay-50 px-2 py-1 rounded-control border border-clay-200">
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
          {response.recommendations.length > 0 && (
            <div className="bg-paper-inset/40 border border-line rounded-sheet p-4 space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-ink-muted block">
                Food Waste & Cost Recommendations
              </span>
              {response.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="text-xs text-ink-muted flex items-start space-x-2"
                >
                  <SproutIcon className="w-4 h-4 text-moss-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">{rec.title}:</strong>{" "}
                    {rec.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Constraint Warnings / Evaluation (if any) */}
          {response.constraints_evaluation &&
            response.constraints_evaluation.filter(
              (c) => c.status === "VIOLATED" || c.status === "WARNING",
            ).length > 0 && (
              <div className="p-4 rounded-sheet bg-clay-50 border border-clay-300 text-xs text-clay-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-clay-800">
                  <AlertTriangle className="w-4 h-4 text-clay-700" />
                  Preference & Constraint Notices:
                </span>
                {response.constraints_evaluation
                  .filter(
                    (c) => c.status === "VIOLATED" || c.status === "WARNING",
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
  );
};
