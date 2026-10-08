import React, { useState } from 'react';
import { AlertCircle, ArrowUpRight, ShieldAlert } from 'lucide-react';

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
  currency = 'INR',
  onApproveBudgetIncrease,
  isRetrying = false,
}) => {
  const currentNum = currentBudget ? Number(currentBudget) : 0;
  const minFeasibleNum = minFeasibleBudget ? Number(minFeasibleBudget) : 0;
  const deficitNum = budgetDeficit ? Number(budgetDeficit) : minFeasibleNum - currentNum;

  const [proposedBudget, setProposedBudget] = useState<string>(
    minFeasibleNum > 0 ? String(minFeasibleNum) : String(currentNum + deficitNum)
  );
  const [confirmed, setConfirmed] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;
    onApproveBudgetIncrease(proposedBudget);
  };

  return (
    <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 sm:p-6 mb-8 text-rose-950 shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-rose-200 text-rose-800 flex-shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-rose-200 text-rose-900 border border-rose-300">
            INFEASIBLE_BUDGET
          </span>
          <h3 className="text-lg font-bold text-rose-900 mt-1">Current Budget is Insufficient for Feasible Planning</h3>
          <p className="text-sm text-rose-800 mt-1">
            The planner evaluated baseline food and waste configurations for your expected attendees, but the total
            required cost exceeds your current budget limit.
          </p>

          {/* Breakdown numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="bg-white/80 border border-rose-200 p-3 rounded-xl">
              <span className="text-xs font-semibold text-rose-700 block uppercase">Current Budget</span>
              <span className="text-lg font-extrabold text-slate-800">{formatCurrency(currentNum)}</span>
            </div>

            <div className="bg-white/80 border border-rose-200 p-3 rounded-xl">
              <span className="text-xs font-semibold text-rose-700 block uppercase">Minimum Feasible Budget</span>
              <span className="text-lg font-extrabold text-rose-800">{formatCurrency(minFeasibleNum)}</span>
            </div>

            <div className="bg-white/80 border border-rose-200 p-3 rounded-xl">
              <span className="text-xs font-semibold text-rose-700 block uppercase">Budget Deficit</span>
              <span className="text-lg font-extrabold text-rose-700">+{formatCurrency(deficitNum)}</span>
            </div>
          </div>

          <div className="p-3.5 bg-rose-100/70 border border-rose-200 rounded-xl text-xs text-rose-900 mb-4 space-y-1">
            <p className="font-semibold flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-rose-700" />
              <span>Explicit Organiser Action Required:</span>
            </p>
            <p>
              The system <strong>never silently increases your budget</strong>. To proceed with plan generation, you must
              explicitly confirm whether you wish to raise the budget ceiling to cover the minimum feasible costs.
            </p>
          </div>

          {/* Approval Form */}
          <form onSubmit={handleSubmit} className="bg-white border border-rose-200 p-4 rounded-xl space-y-3">
            <div>
              <label htmlFor="approved-budget-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Approved Budget Ceiling ({currency})
              </label>
              <div className="relative rounded-lg shadow-sm max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                  ₹
                </div>
                <input
                  type="number"
                  id="approved-budget-input"
                  min={minFeasibleNum}
                  step="100"
                  value={proposedBudget}
                  onChange={(e) => setProposedBudget(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-emerald-500 focus:border-emerald-500"
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
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="confirm-increase" className="text-xs text-slate-700 font-medium cursor-pointer">
                I explicitly approve increasing the event budget to <strong>{formatCurrency(Number(proposedBudget) || 0)}</strong> to generate feasible plans.
              </label>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={!confirmed || isRetrying}
                className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm ${
                  confirmed && !isRetrying
                    ? 'bg-rose-700 hover:bg-rose-800 shadow-rose-600/20'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{isRetrying ? 'Regenerating Plans...' : 'Approve Budget Increase & Regenerate Plans'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
