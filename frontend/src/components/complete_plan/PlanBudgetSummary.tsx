import React from "react";
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Coins,
  Receipt,
} from "lucide-react";
import { BudgetSummary as BudgetSummaryType } from "../../types/completePlan";
import { formatCurrency } from "../../utils/metricFormatting";

interface PlanBudgetSummaryProps {
  budgetSummary: BudgetSummaryType;
}

export const PlanBudgetSummary: React.FC<PlanBudgetSummaryProps> = ({
  budgetSummary,
}) => {
  const currency = budgetSummary?.currency || "INR";
  const isFeasible = budgetSummary?.is_budget_feasible ?? true;
  const deficit = budgetSummary?.budget_deficit;
  const contingency = budgetSummary?.remaining_contingency;

  return (
    <div className="surface-sheet p-5 sm:p-8 mb-8 border border-line">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-line gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-paper-inset text-moss-800 text-xs font-semibold tracking-wide uppercase mb-2 border border-line">
            <Wallet className="w-3.5 h-3.5 text-moss-600" />
            <span>Financial Feasibility</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Plan Budget Summary
          </h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Financial comparison between your allocated budget and calculated
            plan expenditures.
          </p>
        </div>

        <div>
          {isFeasible ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-moss-50 text-moss-800 border border-moss-200 text-xs font-extrabold">
              <CheckCircle2 className="w-4 h-4 text-moss-600" />
              <span>Within Allocated Budget</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-clay-50 text-clay-800 border border-clay-300 text-xs font-extrabold">
              <AlertTriangle className="w-4 h-4 text-clay-600" />
              <span>Budget Deficit</span>
            </span>
          )}
        </div>
      </div>

      {/* Prominent Deficit Alert */}
      {!isFeasible && (
        <div
          role="alert"
          aria-label="Budget deficit alert"
          className="mb-6 p-4 rounded-control bg-clay-50 border border-clay-300 text-clay-950 text-xs space-y-2"
        >
          <div className="flex items-center space-x-2 font-bold text-sm text-clay-900">
            <span className="stamp-clay">Budget Ceiling Exceeded</span>
          </div>
          <p className="text-clay-800">
            The estimated cost for this plan exceeds your allocated budget by{" "}
            <strong className="font-extrabold text-clay-950 font-mono tabular-nums">
              {formatCurrency(deficit, currency)}
            </strong>
            . You may need to request an approved budget adjustment or review
            your catering scope.
          </p>
        </div>
      )}

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Allocated Budget */}
        <div className="p-4 rounded-sheet bg-paper-inset/40 border border-line shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
            <span>Allocated Budget</span>
            <Coins className="w-4 h-4 text-ink-muted" />
          </div>
          <div className="text-xl font-mono font-bold text-ink tabular-nums">
            {formatCurrency(budgetSummary?.total_budget, currency)}
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Budget limit configured in Step 2
          </p>
        </div>

        {/* Estimated Plan Cost */}
        <div className="p-4 rounded-sheet bg-paper-inset/40 border border-line shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
            <span>Estimated Plan Cost</span>
            <Receipt className="w-4 h-4 text-ink-muted" />
          </div>
          <div className="text-xl font-mono font-bold text-ink tabular-nums">
            {formatCurrency(budgetSummary?.estimated_plan_cost, currency)}
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Calculated cost of selected plan
          </p>
        </div>

        {/* Remaining Contingency or Deficit */}
        <div
          className={`p-4 rounded-sheet border shadow-xs ${
            isFeasible
              ? "bg-moss-50/60 border-moss-200 text-moss-950"
              : "bg-clay-50/60 border-clay-200 text-clay-950"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold">
              {isFeasible ? "Remaining Contingency" : "Budget Deficit"}
            </span>
            <PieChart className="w-4 h-4" />
          </div>
          <div className="text-xl font-mono font-bold tabular-nums">
            {isFeasible
              ? formatCurrency(contingency, currency)
              : formatCurrency(deficit, currency)}
          </div>
          <p className="text-[11px] opacity-75 mt-0.5">
            {isFeasible
              ? "Surplus buffer available"
              : "Shortfall requiring approval"}
          </p>
        </div>
      </div>

      {/* Available Subtotals Breakdown */}
      <div className="p-4 rounded-control bg-paper-inset/30 border border-line text-xs space-y-2">
        <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">
          Identified Cost Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="flex justify-between items-center py-1.5 border-b border-line/60">
            <span className="text-ink-muted">Catering & Food:</span>
            <span className="font-mono font-bold text-ink tabular-nums">
              {formatCurrency(budgetSummary?.food_cost, currency)}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-line/60">
            <span className="text-ink-muted">Tableware & Packaging:</span>
            <span className="font-mono font-bold text-ink tabular-nums">
              {formatCurrency(budgetSummary?.packaging_cost, currency)}
            </span>
          </div>
        </div>
        {budgetSummary?.notes && (
          <p className="text-[11px] text-ink-muted pt-2 italic">
            Note: {budgetSummary.notes}
          </p>
        )}
      </div>
    </div>
  );
};
