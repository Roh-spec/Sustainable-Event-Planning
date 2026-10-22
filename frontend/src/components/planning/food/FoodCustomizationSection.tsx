import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MealInput, FoodPricingUnit } from "../../../types/food";

export interface FoodCustomizationSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  meals: MealInput[];
  durationDays: number;
  expectedAttendees: number;
  onUpdateMeal: (index: number, field: keyof MealInput, val: any) => void;
  costApproach?: "ESTIMATE" | "UNIT" | "TOTAL";
  onCostApproachChange: (approach: "ESTIMATE" | "UNIT" | "TOTAL") => void;
  knownUnitCost?: string;
  onKnownUnitCostChange: (val: string) => void;
  costPricingUnit?: FoodPricingUnit;
  onCostPricingUnitChange: (unit: FoodPricingUnit) => void;
  knownTotalCost?: string;
  onKnownTotalCostChange: (val: string) => void;
}

export const FoodCustomizationSection: React.FC<FoodCustomizationSectionProps> = ({
  isOpen,
  onToggle,
  meals,
  durationDays,
  expectedAttendees,
  onUpdateMeal,
  costApproach = "ESTIMATE",
  onCostApproachChange,
  knownUnitCost = "",
  onKnownUnitCostChange,
  costPricingUnit = "PER_PERSON",
  onCostPricingUnitChange,
  knownTotalCost = "",
  onKnownTotalCostChange,
}) => {
  return (
    <section className="mb-10 pt-8 border-t border-line">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 rounded-sheet bg-paper-inset/30 hover:bg-paper-inset/60 border border-line transition-colors focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="text-left">
          <h3 className="text-sm font-semibold text-ink">
            Adjust your food estimates (Optional)
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Only change these settings if you have more information.
          </p>
        </div>
        <div className="p-1 rounded-control text-ink-muted">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-ink" />
          ) : (
            <ChevronDown className="w-5 h-5 text-ink" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 p-5 rounded-sheet bg-paper-inset/20 border border-line space-y-6">
          {/* Subsection 1: How many people will eat? */}
          {meals.length > 0 && (
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
                {meals.map((meal, index) => {
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
                      className="p-3.5 bg-paper-raised rounded-control border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
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
                            placeholder={`e.g. ${expectedAttendees}`}
                            value={meal.attendee_count ?? ""}
                            onChange={(e) =>
                              onUpdateMeal(
                                index,
                                "attendee_count",
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            className="w-24 px-2.5 py-1.5 rounded-control border border-line text-xs text-ink bg-paper-raised focus:outline-none focus:ring-1 focus:ring-moss-600 focus:border-moss-600"
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
                                  onUpdateMeal(
                                    index,
                                    "user_participation_rate",
                                    undefined,
                                  );
                                } else {
                                  const num = Number(raw);
                                  onUpdateMeal(
                                    index,
                                    "user_participation_rate",
                                    isNaN(num) ? undefined : num / 100,
                                  );
                                }
                              }}
                              className="w-20 pl-2.5 pr-6 py-1.5 rounded-control border border-line text-xs text-ink bg-paper-raised focus:outline-none focus:ring-1 focus:ring-moss-600 focus:border-moss-600"
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
                  onClick={() => onCostApproachChange(opt.id as any)}
                  className={`text-left p-3 rounded-control border text-xs transition-all focus:outline-none cursor-pointer ${
                    costApproach === opt.id
                      ? "border-moss-600 bg-moss-50 text-moss-950 font-bold"
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
            {costApproach === "UNIT" && (
              <div className="mt-3 p-4 rounded-sheet bg-paper-raised border border-line max-w-md space-y-2">
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
                      value={knownUnitCost}
                      onChange={(e) => onKnownUnitCostChange(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-control border border-line text-xs font-semibold bg-paper-raised focus:outline-none focus:ring-1 focus:ring-moss-600 focus:border-moss-600"
                    />
                  </div>
                  <select
                    aria-label="Pricing unit"
                    value={costPricingUnit}
                    onChange={(e) =>
                      onCostPricingUnitChange(e.target.value as FoodPricingUnit)
                    }
                    className="px-3 py-2 rounded-control border border-line text-xs font-semibold bg-paper-raised text-ink focus:outline-none focus:ring-1 focus:ring-moss-600"
                  >
                    <option value="PER_PERSON">per person</option>
                    <option value="PER_SERVING">per serving</option>
                  </select>
                </div>
              </div>
            )}

            {/* Total catering price: single total amount field */}
            {costApproach === "TOTAL" && (
              <div className="mt-3 p-4 rounded-sheet bg-paper-raised border border-line max-w-md space-y-2">
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
                    value={knownTotalCost}
                    onChange={(e) => onKnownTotalCostChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-control border border-line text-xs font-semibold bg-paper-raised text-ink focus:outline-none focus:ring-1 focus:ring-moss-600 focus:border-moss-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
