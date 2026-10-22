import React, { useState } from "react";
import { AlertCircle, ArrowUpRight } from "lucide-react";

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
    <div className="surface-sheet p-5 sm:p-6 mb-8 border border-clay-700/60 bg-paper-raised relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-4 border-b border-line">
        <div className="flex items-center space-x-3">
          <span className="stamp-clay">INFEASIBLE_BUDGET</span>
          <span className="font-handwriting text-lg text-clay-800 font-semibold">
            organizer action needed ✍
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-display font-semibold text-ink">
          Current Budget is Insufficient for Feasible Planning
        </h3>
        <p className="text-sm text-ink-muted mt-1 max-w-2xl">
          The planner evaluated baseline food and waste configurations for
          your expected attendees, but the total required cost exceeds your
          current budget limit.
        </p>

        {/* Ledger Breakdown */}
        <div className="my-5 border-y border-line py-2 divide-y divide-line/60">
          <div className="flex justify-between items-baseline py-2 font-mono text-xs">
            <span className="text-ink-muted uppercase font-semibold">Current Budget</span>
            <span className="text-ink font-semibold tabular-nums text-sm">{formatCurrency(currentNum)}</span>
          </div>
          <div className="flex justify-between items-baseline py-2 font-mono text-xs">
            <span className="text-ink-muted uppercase font-semibold">Minimum Feasible Budget</span>
            <span className="text-moss-800 font-semibold tabular-nums text-sm">{formatCurrency(minFeasibleNum)}</span>
          </div>
          <div className="flex justify-between items-baseline py-2 font-mono text-xs text-clay-800 font-bold">
            <span className="uppercase">Budget Deficit</span>
            <span className="tabular-nums text-sm">+{formatCurrency(deficitNum)}</span>
          </div>
        </div>

        <div className="border-l-2 border-clay-700 pl-3 py-1 bg-clay-50/60 text-xs text-clay-900 mb-4 space-y-1">
          <p className="font-semibold flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-clay-700 flex-shrink-0" />
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
          className="bg-paper p-4 border border-line rounded-control space-y-3"
        >
          <div>
            <label
              htmlFor="approved-budget-input"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink mb-1"
            >
              Approved Budget Ceiling ({currency})
            </label>
            <div className="relative max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted font-mono font-semibold">
                ₹
              </span>
              <input
                type="number"
                id="approved-budget-input"
                min={minFeasibleNum}
                step="100"
                value={proposedBudget}
                onChange={(e) => setProposedBudget(e.target.value)}
                className="input-ruled pl-8 text-sm font-semibold"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="confirm-increase"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 text-moss-700 border-line rounded-control focus:ring-moss-700 cursor-pointer accent-moss-700"
            />
            <label
              htmlFor="confirm-increase"
              className="text-xs text-ink-muted font-medium cursor-pointer"
            >
              I explicitly approve increasing the event budget to{" "}
              <strong className="text-ink font-mono font-semibold">
                {formatCurrency(Number(proposedBudget) || 0)}
              </strong>{" "}
              to generate feasible plans.
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!confirmed || isRetrying}
              className={`btn-primary ${
                confirmed && !isRetrying
                  ? ""
                  : "opacity-40 cursor-not-allowed"
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
  );
};
