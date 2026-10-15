import React, { useState } from "react";
import { AlertCircle, ArrowUpRight, ShieldAlert } from "lucide-react";

interface InfeasibleBudgetAlertProps {
  currentBudget?: number | string | null;
  minFeasibleBudget?: number | string | null;
  budgetDeficit?: number | string | null;
  currency?: string;
  onApproveBudgetIncrease: (approvedAmount: string) => Promise<void>;
  isRetrying?: boolean;
}

export const InfeasibleBudgetAlert: React.FC<InfeasibleBudgetAlertProps> = ({
  currentBudget,
  minFeasibleBudget,
  budgetDeficit,
  currency = "INR",
  onApproveBudgetIncrease,
  isRetrying = false,
}) => {
  const currentNum = currentBudget ? Number(currentBudget) : 0;
  const minFeasibleNum = minFeasibleBudget ? Number(minFeasibleBudget) : 0;
  const deficitNum = budgetDeficit
    ? Number(budgetDeficit)
    : minFeasibleNum - currentNum;

  const [proposedBudget, setProposedBudget] = useState<string>(
    minFeasibleNum > 0
      ? String(minFeasibleNum)
      : String(currentNum + deficitNum),
  );
  const [confirmed, setConfirmed] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;
    onApproveBudgetIncrease(proposedBudget);
  };

  return (
    <div className="bg-clay-50 border-2 border-clay-300 rounded-2xl p-5 sm:p-6 mb-8 text-clay-950 shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-clay-200 text-clay-800 flex-shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <span className="text-xs font-mono uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-clay-200 text-clay-900 border border-clay-300">
            INFEASIBLE_BUDGET
          </span>
          <h3 className="text-lg font-display font-bold text-clay-900 mt-1">
            Current Budget is Insufficient for Feasible Planning
          </h3>
          <p className="text-sm text-clay-800 mt-1">
            The planner evaluated baseline food and waste configurations for
            your expected attendees, but the total required cost exceeds your
            current budget limit.
          </p>

          {/* Breakdown numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="bg-paper-raised border border-clay-200 p-3 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-clay-700 block uppercase">
                Current Budget
              </span>
              <span className="text-lg font-bold text-ink">
                {formatCurrency(currentNum)}
              </span>
            </div>

            <div className="bg-paper-raised border border-clay-200 p-3 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-clay-700 block uppercase">
                Minimum Feasible Budget
              </span>
              <span className="text-lg font-bold text-clay-900">
                {formatCurrency(minFeasibleNum)}
              </span>
            </div>

            <div className="bg-paper-raised border border-clay-200 p-3 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-clay-700 block uppercase">
                Budget Deficit
              </span>
              <span className="text-lg font-bold text-clay-700">
                +{formatCurrency(deficitNum)}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-clay-100/70 border border-clay-200 rounded-xl text-xs text-clay-900 mb-4 space-y-1">
            <p className="font-semibold flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-clay-700" />
              <span>Explicit Organiser Action Required:</span>
            </p>
            <p>
              The system <strong>never silently increases your budget</strong>.
              To proceed with plan generation, you must explicitly confirm
              whether you wish to raise the budget ceiling to cover the minimum
              feasible costs.
            </p>
          </div>

          {/* Approval Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-paper-raised border border-clay-200 p-4 rounded-xl space-y-3 shadow-xs"
          >
            <div>
              <label
                htmlFor="approved-budget-input"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink mb-1"
              >
                Approved Budget Ceiling ({currency})
              </label>
              <div className="relative rounded-lg shadow-xs max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-faint font-bold">
                  ₹
                </div>
                <input
                  type="number"
                  id="approved-budget-input"
                  min={minFeasibleNum}
                  step="100"
                  value={proposedBudget}
                  onChange={(e) => setProposedBudget(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2 border border-line rounded-lg text-sm font-semibold bg-paper-inset/40 text-ink focus:outline-none focus:ring-2 focus:ring-moss-500/20 focus:border-moss-600"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirm-increase"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 text-moss-700 rounded border-line focus:ring-moss-600 cursor-pointer accent-moss-700"
              />
              <label
                htmlFor="confirm-increase"
                className="text-xs text-ink-muted font-medium cursor-pointer"
              >
                I explicitly approve increasing the event budget to{" "}
                <strong className="text-ink">
                  {formatCurrency(Number(proposedBudget) || 0)}
                </strong>{" "}
                to generate feasible plans.
              </label>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={!confirmed || isRetrying}
                className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer ${
                  confirmed && !isRetrying
                    ? "bg-clay-900 hover:bg-clay-800 text-paper-raised shadow-clay-900/20"
                    : "bg-paper-inset text-ink-faint border border-line cursor-not-allowed"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>
                  {isRetrying
                    ? "Regenerating Plans..."
                    : "Approve Budget Increase & Regenerate Plans"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
