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
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-8 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2 border border-emerald-200">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Financial Feasibility</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Plan Budget Summary
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Financial comparison between your allocated budget and calculated
            plan expenditures.
          </p>
        </div>

        <div>
          {isFeasible ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Within Allocated Budget</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-xs font-extrabold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
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
          className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs space-y-2"
        >
          <div className="flex items-center space-x-2 font-bold text-sm text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Budget Ceiling Exceeded</span>
          </div>
          <p className="text-rose-800">
            The estimated cost for this plan exceeds your allocated budget by{" "}
            <strong className="font-extrabold text-rose-950">
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
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Allocated Budget</span>
            <Coins className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {formatCurrency(budgetSummary?.total_budget, currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Budget limit configured in Step 2
          </p>
        </div>

        {/* Estimated Plan Cost */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Estimated Plan Cost</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {formatCurrency(budgetSummary?.estimated_plan_cost, currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Calculated cost of selected plan
          </p>
        </div>

        {/* Remaining Contingency or Deficit */}
        <div
          className={`p-4 rounded-2xl border ${
            isFeasible
              ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
              : "bg-rose-50/60 border-rose-200 text-rose-950"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold">
              {isFeasible ? "Remaining Contingency" : "Budget Deficit"}
            </span>
            <PieChart className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold">
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
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs space-y-2">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
          Identified Cost Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-600">Catering & Food:</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(budgetSummary?.food_cost, currency)}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-600">Tableware & Packaging:</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(budgetSummary?.packaging_cost, currency)}
            </span>
          </div>
        </div>
        {budgetSummary?.notes && (
          <p className="text-[11px] text-slate-500 pt-2 italic">
            Note: {budgetSummary.notes}
          </p>
        )}
      </div>
    </div>
  );
};
