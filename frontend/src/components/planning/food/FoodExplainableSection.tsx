import React from "react";
import {
  ChevronDown,
  ChevronUp,
  Utensils,
  Wallet,
  Leaf,
  Info,
} from "lucide-react";
import { FoodPlanResponse } from "../../../types/food";
import {
  getHumanReadableParameter,
  formatSourceType,
  formatAssumptionValue,
} from "./foodPlanningHelpers";

export interface FoodExplainableSectionProps {
  response: FoodPlanResponse;
  isOpen: boolean;
  onToggle: () => void;
  knownUnitCost?: string;
}

export const FoodExplainableSection: React.FC<FoodExplainableSectionProps> = ({
  response,
  isOpen,
  onToggle,
  knownUnitCost = "",
}) => {
  return (
    <section className="mb-10 pt-6 border-t border-line">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-moss-700 hover:text-moss-800 focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <span>How we calculated your food estimates</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-ink-muted">
            These estimates are based on your event size (
            {response.expected_attendees} attendees), your
            selected meal schedule, and verified reference benchmarks or
            quotes.
          </p>

          {/* 1. Estimated food servings */}
          <div className="p-4 rounded-sheet bg-paper-inset/30 border border-line text-xs text-ink space-y-2">
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

            <div className="bg-paper-raised rounded-control p-3 border border-line space-y-1.5">
              {response.meal_plans.map((meal, idx) => {
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

            {response.meal_plans.length > 1 && (
              <div className="text-xs font-semibold text-ink pt-1">
                Total across all {response.meal_plans.length}{" "}
                meals: {response.total_estimated_servings}{" "}
                portions
              </div>
            )}

            {response.total_veg_servings != null &&
              response.total_non_veg_servings != null &&
              response.total_non_veg_servings > 0 && (
                <p className="text-[11px] text-ink-muted">
                  Dietary split: {response.total_veg_servings}{" "}
                  vegetarian and {response.total_non_veg_servings}{" "}
                  non-vegetarian portions.
                </p>
              )}
          </div>

          {/* 2. Estimated food cost */}
          <div className="p-4 rounded-sheet bg-paper-inset/30 border border-line text-xs text-ink space-y-2">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-ink-muted" />
              <h4 className="font-semibold text-ink text-sm">
                Estimated food cost
              </h4>
            </div>

            {response.cost_summary.pricing_approach ===
            "USER_PROVIDED_TOTAL" ? (
              <p className="text-ink-muted">
                Cost is based on your specified total catering contract
                quote of{" "}
                <strong className="text-ink">
                  ₹
                  {Number(
                    response.cost_summary.estimated_total_cost,
                  ).toLocaleString()}
                </strong>
                .
              </p>
            ) : response.cost_summary.pricing_approach ===
              "USER_PROVIDED_UNIT" ? (
              <div className="space-y-1.5">
                <p className="text-ink-muted">
                  Cost is calculated from your entered rate per portion:
                </p>
                <div className="bg-paper-raised rounded-control p-3 border border-line font-mono text-ink text-xs">
                  {response.total_estimated_servings} portions × ₹
                  {Number(knownUnitCost || 0)} per portion =
                  ₹
                  {Number(
                    response.cost_summary.estimated_total_cost,
                  ).toLocaleString()}
                </div>
              </div>
            ) : response.cost_summary.estimated_total_cost !=
              null ? (
              <div className="space-y-2">
                <p className="text-ink-muted">
                  Cost is estimated using reference catering rates for
                  campus events:
                </p>
                <div className="bg-paper-raised rounded-control p-3 border border-line space-y-1.5">
                  {response.meal_plans.map((meal, idx) => (
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
                      response.cost_summary.estimated_total_cost,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-clay-800 bg-clay-50 p-2.5 rounded-control border border-clay-200">
                Cost could not be calculated because reference pricing
                assumptions are unavailable.
              </p>
            )}
          </div>

          {/* 3. Expected food waste */}
          <div className="p-4 rounded-sheet bg-paper-inset/30 border border-line text-xs text-ink space-y-2">
            <div className="flex items-center space-x-2">
              <Leaf className="w-4 h-4 text-moss-700" />
              <h4 className="font-semibold text-ink text-sm">
                Expected food waste
              </h4>
            </div>

            {response.waste_summary.waste_percentage_used !=
            null ? (
              <div className="space-y-2">
                <p className="text-ink-muted">
                  Catering operations typically include a small surplus
                  buffer. Based on campus event reference data, an
                  estimated{" "}
                  <strong className="text-ink">
                    {Math.round(
                      Number(
                        response.waste_summary
                          .waste_percentage_used,
                      ) *
                        (Number(
                          response.waste_summary
                            .waste_percentage_used,
                        ) <= 1
                          ? 100
                          : 1),
                    )}
                    %
                  </strong>{" "}
                  of prepared portions is expected to remain unconsumed.
                </p>

                <div className="bg-paper-raised rounded-control p-3 border border-line font-mono text-ink text-xs space-y-1">
                  <div>
                    {response.total_estimated_servings} portions ×{" "}
                    {Math.round(
                      Number(
                        response.waste_summary
                          .waste_percentage_used,
                      ) *
                        (Number(
                          response.waste_summary
                            .waste_percentage_used,
                        ) <= 1
                          ? 100
                          : 1),
                    )}
                    % surplus ={" "}
                    {
                      response.waste_summary
                        .estimated_waste_servings
                    }{" "}
                    servings
                  </div>

                  {response.waste_summary.estimated_waste_kg !=
                    null &&
                  response.waste_summary.serving_weight_kg_used !=
                    null ? (
                    <div className="pt-1 text-ink-muted border-t border-line">
                      {
                        response.waste_summary
                          .estimated_waste_servings
                      }{" "}
                      servings ×{" "}
                      {Number(
                        response.waste_summary
                          .serving_weight_kg_used,
                      ).toFixed(2)}{" "}
                      kg/serving ={" "}
                      {response.waste_summary.estimated_waste_kg}{" "}
                      kg waste mass
                    </div>
                  ) : null}
                </div>

                {response.waste_summary.estimated_waste_kg ==
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
          <div className="p-3 sm:p-3.5 rounded-control bg-paper-inset/40 border border-line text-ink-muted flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-ink-faint flex-shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-ink-muted leading-relaxed">
              These figures are estimates based on configured assumptions.
              Actual food waste may vary depending on the menu, serving
              sizes, and attendee consumption.
            </p>
          </div>

          {/* 4. Assumptions and data sources */}
          <div className="p-4 rounded-sheet bg-paper-inset/30 border border-line text-xs text-ink space-y-3">
            <div>
              <h4 className="font-semibold text-ink text-sm">
                Assumptions and data sources
              </h4>
              <p className="text-xs text-ink-muted mt-0.5">
                Values and reference benchmarks used to produce these
                estimates:
              </p>
            </div>

            {response.assumptions_used &&
            response.assumptions_used.length > 0 ? (
              <div className="space-y-2">
                {response.assumptions_used.map((assump, idx) => {
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
                      className="p-3 bg-paper-raised rounded-control border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2"
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

            {response.missing_assumptions &&
              response.missing_assumptions.length > 0 && (
                <div className="pt-2 border-t border-line">
                  <span className="font-semibold text-ink block text-[11px] mb-1">
                    Unavailable benchmarks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {response.missing_assumptions.map(
                      (m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-paper-inset text-ink-muted rounded-control text-[10px] border border-line"
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
  );
};
