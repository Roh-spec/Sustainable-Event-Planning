import React from "react";
import { Calculator, Wallet, Check } from "lucide-react";

export interface FoodBudgetSectionProps {
  budgetMode?: "ESTIMATE" | "ENTER";
  onBudgetModeChange: (mode: "ESTIMATE" | "ENTER") => void;
  foodBudget?: string;
  onFoodBudgetChange: (val: string) => void;
}

export const FoodBudgetSection: React.FC<FoodBudgetSectionProps> = ({
  budgetMode = "ESTIMATE",
  onBudgetModeChange,
  foodBudget = "",
  onFoodBudgetChange,
}) => {
  return (
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
          onClick={() => onBudgetModeChange("ESTIMATE")}
          aria-pressed={budgetMode !== "ENTER"}
          className={`text-left p-4 rounded-sheet border transition-all flex flex-col justify-between focus:outline-none cursor-pointer ${
            budgetMode !== "ENTER"
              ? "border-moss-600 bg-moss-50/70 text-moss-950 font-semibold ring-2 ring-moss-500/20"
              : "border-line bg-paper-raised hover:border-line-strong text-ink"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="p-2 rounded-control bg-paper-inset/60 border border-line">
              <Calculator className="w-5 h-5 text-moss-700" />
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                budgetMode !== "ENTER"
                  ? "bg-moss-700 border-moss-700 text-paper-raised"
                  : "border-line bg-paper-raised"
              }`}
            >
              {budgetMode !== "ENTER" && (
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
          onClick={() => onBudgetModeChange("ENTER")}
          aria-pressed={budgetMode === "ENTER"}
          className={`text-left p-4 rounded-sheet border transition-all flex flex-col justify-between focus:outline-none cursor-pointer ${
            budgetMode === "ENTER"
              ? "border-moss-600 bg-moss-50/70 text-moss-950 font-semibold ring-2 ring-moss-500/20"
              : "border-line bg-paper-raised hover:border-line-strong text-ink"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="p-2 rounded-control bg-paper-inset/60 border border-line">
              <Wallet className="w-5 h-5 text-ink-muted" />
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                budgetMode === "ENTER"
                  ? "bg-moss-700 border-moss-700 text-paper-raised"
                  : "border-line bg-paper-raised"
              }`}
            >
              {budgetMode === "ENTER" && (
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
      {budgetMode === "ENTER" && (
        <div className="p-5 rounded-sheet bg-paper-inset/40 border border-line space-y-2">
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
              value={foodBudget}
              onChange={(e) => onFoodBudgetChange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-control border border-line text-sm font-semibold text-ink bg-paper-raised focus:outline-none focus:ring-2 focus:ring-moss-500/20 focus:border-moss-600"
            />
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Note: This food budget is dedicated to catering and is separate
            from your overall event budget.
          </p>
        </div>
      )}
    </section>
  );
};
