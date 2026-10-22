import React from "react";
import { Check } from "lucide-react";
import { MealType, MealInput } from "../../../types/food";
import { SUPPORTED_MEAL_OPTIONS } from "./foodPlanningHelpers";

export interface MealSelectionSectionProps {
  durationDays: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  meals: MealInput[];
  onToggleMeal: (type: MealType, day: number) => void;
  onCopyMealsToAllDays: () => void;
}

export const MealSelectionSection: React.FC<MealSelectionSectionProps> = ({
  durationDays,
  selectedDay,
  onSelectDay,
  meals,
  onToggleMeal,
  onCopyMealsToAllDays,
}) => {
  const isMealSelected = (type: MealType, day: number) => {
    return meals.some((m) => m.meal_type === type && m.day === day);
  };

  return (
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-paper-inset/40 p-2 rounded-sheet border border-line">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: durationDays }, (_, i) => i + 1).map(
              (dayNum) => {
                const dayMealsCount = meals.filter(
                  (m) => m.day === dayNum,
                ).length;
                const isActive = selectedDay === dayNum;
                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => onSelectDay(dayNum)}
                    className={`px-3.5 py-1.5 rounded-control text-xs font-semibold transition-all focus:outline-none ${
                      isActive
                        ? "bg-paper-raised text-moss-800 border border-moss-300"
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

          {meals.some((m) => m.day === selectedDay) && (
            <button
              type="button"
              onClick={onCopyMealsToAllDays}
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
              onClick={() => onToggleMeal(meal.type, selectedDay)}
              aria-pressed={isSelected}
              className={`text-left p-4 rounded-sheet border transition-all flex flex-col justify-between focus:outline-none cursor-pointer ${
                isSelected
                  ? "border-moss-600 bg-moss-50/70 text-moss-950 font-semibold ring-2 ring-moss-500/20"
                  : "border-line bg-paper-raised hover:border-line-strong text-ink"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-control bg-paper-inset/60 border border-line">
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
        {meals.length === 0 ? (
          <span className="text-ink-faint italic">
            No meals selected yet. Please select at least one meal.
          </span>
        ) : (
          meals.map((m, idx) => (
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
  );
};
