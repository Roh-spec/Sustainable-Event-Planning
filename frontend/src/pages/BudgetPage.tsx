import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";
import { LedgerRow } from "../components/common/LedgerTable";
import { Stamp } from "../components/common/Stamp";
import { SegmentedToggle } from "../components/common/SegmentedToggle";
import { usePageTitle } from "../hooks/usePageTitle";

export const BudgetPage: React.FC = () => {
  usePageTitle("Budget & Scale · EcoPlan");
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { event, loadEvent, budget, setBudget, foodPlanResponse } =
    usePlanningWizard();

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

  const ceilingNum = parseFloat(totalBudget) || 0;

  // Calculate committed spend if user has already configured food step
  const committedFood = foodPlanResponse?.cost_summary?.estimated_total_cost
    ? Number(foodPlanResponse.cost_summary.estimated_total_cost)
    : 0;
  const committedTotal = committedFood;
  const remaining = ceilingNum - committedTotal;
  const isDeficit = remaining < 0;
  const deficitAmount = Math.abs(remaining);

  const formatCurrency = (val: number) => {
    const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : "€";
    return `${symbol}${Math.round(val).toLocaleString()}`;
  };

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

  // Percentage for ruled gauge
  const gaugePercent = ceilingNum > 0 ? Math.min(100, Math.round((committedTotal / ceilingNum) * 100)) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <WizardProgress currentStep={2} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner
        event={event}
        budget={{ total_budget: totalBudget, currency }}
      />

      <div className="surface-sheet p-6 sm:p-10">
        <div className="border-b border-line pb-6 mb-8">
          <span className="label-kicker mb-1 block">Step 02 · Ledger Ceiling</span>
          <h1 className="font-display text-2xl sm:text-3xl text-ink tracking-tight font-semibold">
            Event Budget Specification
          </h1>
          <p className="text-ink-muted text-sm mt-1 max-w-2xl leading-relaxed">
            Record your maximum expenditure ceiling. Every downstream menu choice and waste stream will compute real-time variance against this limit.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-8 p-4 rounded-control bg-danger-bg border-l-2 border-danger-deep text-danger-deep text-xs font-mono flex items-start space-x-3"
          >
            <AlertCircle className="w-4 h-4 text-danger-deep flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider">Budget Validation: </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Main Budget Ceiling Input */}
          <section className="bg-paper p-5 sm:p-6 rounded-control border border-line space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label
                  htmlFor="total-budget-input"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink"
                >
                  Your Maximum Budget <span className="text-danger-deep">*</span>
                </label>
                <p className="text-xs text-ink-muted mt-0.5">
                  The planner strictly treats this as an immutable expenditure ceiling.
                </p>
              </div>

              {/* Currency Segmented Toggle */}
              <div className="flex items-center space-x-2">
                <SegmentedToggle
                  label="Currency"
                  value={currency}
                  onChange={(val) => setCurrency(String(val))}
                  options={[
                    { value: "INR", label: "INR (₹)" },
                    { value: "USD", label: "USD ($)" },
                    { value: "EUR", label: "EUR (€)" },
                  ]}
                />
                <select
                  id="currency-select"
                  aria-label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="sr-only"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="relative max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-mono text-ink-muted font-bold text-lg">
                {currency === "INR" ? "₹" : currency === "USD" ? "$" : "€"}
              </span>
              <input
                type="number"
                id="total-budget-input"
                min="0"
                step="500"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="50000"
                className="input-ruled no-spin pl-8 text-2xl font-bold tracking-tight text-ink"
                required
              />
            </div>
          </section>

          {/* Working Ledger Breakdown */}
          <section className="surface-sheet p-5 sm:p-6 bg-paper-raised border border-line">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-line">
              <span className="label-kicker">Budget Variance Ledger</span>
              {isDeficit && (
                <Stamp variant="danger" thump>
                  {formatCurrency(deficitAmount)} over ceiling
                </Stamp>
              )}
            </div>

            <div aria-live="polite" className="space-y-0.5">
              <LedgerRow
                label="Total Ceiling Allowance"
                sublabel="Organiser maximum expenditure limit"
                value={formatCurrency(ceilingNum)}
              />
              <LedgerRow
                label="Committed Item Spend"
                sublabel={
                  committedTotal > 0
                    ? `Food catering committed: ${formatCurrency(committedFood)}`
                    : "No catering or waste streams selected yet"
                }
                value={formatCurrency(committedTotal)}
              />
              <LedgerRow
                isTotal
                label="Remaining Ledger Balance"
                sublabel={isDeficit ? "Exceeds approved budget ceiling" : "Available unallocated budget"}
                value={isDeficit ? `\u2212${formatCurrency(deficitAmount)}` : formatCurrency(remaining)}
                delta={isDeficit ? `Deficit +\u2212${formatCurrency(deficitAmount)}` : `Surplus ${formatCurrency(remaining)}`}
                deltaType={isDeficit ? "danger" : "moss"}
              />
            </div>

            {/* Ruled Gauge */}
            <div className="mt-5 pt-4 border-t border-line/60 space-y-2">
              <div className="flex justify-between text-xs font-mono text-ink-muted">
                <span>Committed: {gaugePercent}%</span>
                <span>{ceilingNum > 0 ? formatCurrency(ceilingNum) : "₹0"} Ceiling</span>
              </div>
              <div className="h-2 w-full bg-paper-inset border border-line-strong relative overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isDeficit ? "bg-danger-deep" : "bg-moss-700"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, isDeficit ? 100 : gaugePercent))}%` }}
                />
              </div>
            </div>
          </section>

          {/* Action Row */}
          <div className="pt-6 border-t border-line flex justify-between items-center">
            <button type="button" onClick={handleBack} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Event</span>
            </button>

            <button type="submit" className="btn-primary px-7 py-3 text-sm">
              <span>Continue to Constraints</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
