import React from "react";
import { Leaf, Flame, Users, Check } from "lucide-react";
import { DietaryPreference } from "../../../types/food";

export interface DietaryPreferenceSectionProps {
  preference: DietaryPreference;
  onPreferenceChange: (pref: DietaryPreference) => void;
  vegRatio?: string;
  onVegRatioChange: (ratio: string) => void;
}

export const DietaryPreferenceSection: React.FC<DietaryPreferenceSectionProps> = ({
  preference,
  onPreferenceChange,
  vegRatio = "0.70",
  onVegRatioChange,
}) => {
  return (
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
            icon: <Flame className="w-5 h-5 text-clay-700" />,
          },
          {
            id: "MIXED" as DietaryPreference,
            label: "Both options",
            description: "Offer both vegetarian and non-vegetarian choices.",
            icon: <Users className="w-5 h-5 text-moss-600" />,
          },
        ].map((opt) => {
          const isSelected = preference === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPreferenceChange(opt.id)}
              aria-pressed={isSelected}
              className={`text-left p-4 rounded-sheet border transition-all flex flex-col justify-between focus:outline-none cursor-pointer ${
                isSelected
                  ? "border-moss-600 bg-moss-50/70 text-moss-950 font-semibold ring-2 ring-moss-500/20"
                  : "border-line bg-paper-raised hover:border-line-strong text-ink"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-control bg-paper-inset/60 border border-line">
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
      {preference === "MIXED" && (
        <div className="mt-4 p-5 rounded-sheet bg-paper-inset/40 border border-line">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label
              htmlFor="veg-split-slider"
              className="text-xs font-mono uppercase tracking-wider text-ink-muted"
            >
              Vegetarian Portion Ratio
            </label>
            <span className="text-xs font-bold text-moss-800 bg-moss-100 px-2.5 py-1 rounded-full border border-moss-200 font-mono tabular-nums">
              {Math.round(Number(vegRatio || 0.7) * 100)}% Vegetarian •{" "}
              {100 - Math.round(Number(vegRatio || 0.7) * 100)}% Non-Vegetarian
            </span>
          </div>

          <input
            type="range"
            id="veg-split-slider"
            min="0"
            max="1"
            step="0.05"
            value={vegRatio || "0.70"}
            onChange={(e) => onVegRatioChange(e.target.value)}
            className="w-full accent-moss-700 cursor-pointer h-2 bg-paper-inset border border-line-strong rounded-control"
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
  );
};
