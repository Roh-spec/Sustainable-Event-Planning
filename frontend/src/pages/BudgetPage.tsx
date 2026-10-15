import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

      <div className="surface-sheet p-6 sm:p-10">
        <div className="border-b border-line pb-6 mb-8">
          <p className="label-kicker mb-2">Step 02 / Budget ceiling</p>
          <h1 className="font-display text-2xl sm:text-3xl text-ink tracking-tight">
            Event Budget Specification
          </h1>
          <p className="text-ink-muted text-sm mt-1.5 max-w-2xl leading-relaxed">
            Set your event's maximum financial expenditure ceiling. The planning
            engine will evaluate candidate configurations to ensure generated
            plans respect this threshold.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-clay-50 border border-clay-300 text-clay-900 text-sm font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Main Budget Input */}
          <div className="bg-paper-inset/50 border border-line p-6 sm:p-8 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <label
                  htmlFor="total-budget-input"
                  className="block text-xs font-bold uppercase tracking-wider text-ink"
                >
                  Your Maximum Budget <span className="text-clay-600">*</span>
                </label>
                <p className="text-xs text-ink-muted mt-0.5">
                  The planner will try to keep generated plans within this
                  budget.
                </p>
              </div>

              {/* Currency selector */}
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="currency-select"
                  className="text-xs text-ink-muted font-semibold"
                >
                  Currency:
                </label>
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-line text-xs font-bold text-ink bg-paper-raised focus:ring-2 focus:ring-moss-600"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="relative rounded-2xl max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-faint font-bold text-lg font-mono">
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
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-line bg-paper text-ink text-2xl font-extrabold font-mono focus:ring-2 focus:ring-moss-600 focus:border-moss-600 focus:bg-paper-raised transition-colors"
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-6 border-t border-line flex justify-between items-center">
            <button type="button" onClick={handleBack} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Event</span>
            </button>

            <button
              type="submit"
              className="btn-primary px-8 py-3.5 text-sm"
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
