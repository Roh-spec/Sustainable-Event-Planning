import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, DollarSign } from "lucide-react";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";

export const BudgetPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { event, loadEvent, budget, setBudget } = usePlanningWizard();

  const [totalBudget, setTotalBudget] = useState(
    budget.total_budget || "50000",
  );
  const [currency, setCurrency] = useState(budget.currency || "INR");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) =>
        setError(`Failed to load event: ${err.message}`),
      );
    }
  }, [eventId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseFloat(totalBudget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      setError("Please provide a valid non-negative budget limit.");
      return;
    }

    setBudget({
      total_budget: totalBudget,
      currency,
    });

    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/constraints`);
  };

  const handleBack = () => {
    const targetId = eventId || event?.id;
    navigate(targetId ? `/events/${targetId}/edit` : "/events/new");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <WizardProgress currentStep={2} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner
        event={event}
        budget={{ total_budget: totalBudget, currency }}
      />

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3 border border-emerald-200">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Step 2 of 6 • Budget Ceiling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Budget Specification
          </h1>
          <p className="text-slate-600 text-sm mt-1.5 max-w-2xl">
            Set your event's maximum financial expenditure ceiling. The planning
            engine will evaluate candidate configurations to ensure generated
            plans respect this threshold.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Main Budget Input */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <label
                  htmlFor="total-budget-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Your Maximum Budget <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  The planner will try to keep generated plans within this
                  budget.
                </p>
              </div>

              {/* Currency selector */}
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="currency-select"
                  className="text-xs text-slate-500 font-semibold"
                >
                  Currency:
                </label>
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="relative rounded-2xl max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
                {currency === "INR" ? "₹" : currency === "USD" ? "$" : "€"}
              </div>
              <input
                type="number"
                id="total-budget-input"
                min="0"
                step="500"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="50000"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 text-xl font-extrabold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Event</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all focus:outline-none"
            >
              <span>Continue to Constraints</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
