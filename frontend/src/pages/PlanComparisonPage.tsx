import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Columns3,
  Check,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { usePlanningWizard } from '../context/PlanningWizardContext';
import { EventSummaryBanner } from '../components/wizard/EventSummaryBanner';
import { PlanAlternative } from '../types/planning';
import { formatReusablePercentage } from '../utils/metricFormatting';

export const PlanComparisonPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    loadEvent,
    budget,
    planningResponse,
    generatePlans,
    isGenerating,
    selectedPlan,
    selectPlan,
  } = usePlanningWizard();

  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId));
    }
  }, [eventId]);

  useEffect(() => {
    if (event && !planningResponse && !isGenerating) {
      generatePlans().catch(() => {});
    }
  }, [event, planningResponse]);

  const plans = planningResponse?.plans || [];
  const eventBudgetNum = event?.budget?.total_budget
    ? Number(event.budget.total_budget)
    : budget.total_budget
    ? Number(budget.total_budget)
    : null;

  const handleSelect = async (plan: PlanAlternative) => {
    const res = await selectPlan(plan);
    setSelectionNotice(res.message);
  };

  const formatCost = (val?: string | number | null) => {
    if (val === null || val === undefined || val === '') return 'Not estimated';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: budget.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

  const formatMetric = (val?: string | number | null, unit?: string) => {
    if (val === null || val === undefined || val === '') return 'Not available';
    const num = Number(val);
    const displayNum = isNaN(num) ? val : Number.isInteger(num) ? num.toLocaleString() : num.toFixed(1);
    return unit ? `${displayNum} ${unit}` : `${displayNum}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={`/events/${event?.id || eventId}/plans`}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans View</span>
        </Link>
      </div>

      <EventSummaryBanner event={event} budget={budget} />

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 mb-8">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3 border border-emerald-200">
            <Columns3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Comparative Trade-Off Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Side-by-Side Sustainable Plan Comparison
          </h1>
          <p className="text-slate-600 text-sm mt-1.5 max-w-3xl">
            Compare generated alternatives across budget expenditure, physical food waste, single-use vs. reusable
            packaging items, and constraint satisfaction. Evaluate:{' '}
            <strong className="text-emerald-950 font-bold">"What measurable environmental gains do I achieve if I spend more?"</strong>
          </p>
        </div>

        {selectionNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{selectionNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectionNotice(null)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {plans.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            No plans available to compare. Please navigate back to generate plans.
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (hidden on narrow screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="py-4 px-4 text-xs font-extrabold uppercase tracking-wider text-slate-400 w-1/4">
                      Evaluation Dimension
                    </th>
                    {plans.map((p) => {
                      const isSel = selectedPlan?.plan_id === p.plan_id;
                      return (
                        <th key={p.plan_id} className={`py-4 px-4 ${isSel ? 'bg-emerald-50/60 rounded-t-2xl' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {p.planning_objective.replace('_', ' ')}
                            </span>
                            {isSel && (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center space-x-0.5">
                                <Check className="w-3 h-3" />
                                <span>Selected</span>
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 mt-1">{p.name}</h3>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* Row: Estimated Cost */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-700">Estimated Total Cost</td>
                    {plans.map((p) => (
                      <td key={p.plan_id} className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                        {formatCost(p.estimated_cost)}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Budget Difference */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-700">Budget Headroom / Deficit</td>
                    {plans.map((p) => {
                      if (!eventBudgetNum || !p.estimated_cost) {
                        return <td key={p.plan_id} className="py-3.5 px-4 text-slate-400">N/A</td>;
                      }
                      const diff = eventBudgetNum - Number(p.estimated_cost);
                      const isOver = diff < 0;
                      return (
                        <td
                          key={p.plan_id}
                          className={`py-3.5 px-4 font-semibold ${isOver ? 'text-rose-600' : 'text-emerald-700'}`}
                        >
                          {isOver ? `Deficit ₹${Math.abs(diff).toLocaleString()}` : `Remaining ₹${diff.toLocaleString()}`}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Food Waste */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-700">Estimated Food Waste</td>
                    {plans.map((p) => (
                      <td key={p.plan_id} className="py-3.5 px-4 font-bold text-slate-800">
                        {p.food_metrics?.estimated_waste_kg !== null && p.food_metrics?.estimated_waste_kg !== undefined
                          ? formatMetric(p.food_metrics.estimated_waste_kg, 'kg')
                          : formatMetric(p.food_metrics?.estimated_waste_servings, 'servings')}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Single-Use Items */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-700">Single-Use Packaging</td>
                    {plans.map((p) => (
                      <td key={p.plan_id} className="py-3.5 px-4 font-semibold text-slate-700">
                        {formatMetric(p.waste_metrics?.single_use_packaging_items, 'items')}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Reusable Items */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-700">Reusable Packaging Items</td>
                    {plans.map((p) => {
                      const reusablePctBadge = formatReusablePercentage(p.waste_metrics);
                      return (
                        <td key={p.plan_id} className="py-3.5 px-4 font-bold text-emerald-800">
                          {formatMetric(p.waste_metrics?.reusable_packaging_items, 'items')}{' '}
                          {reusablePctBadge && (
                            <span className="text-[11px] text-emerald-600 font-normal">
                              ({reusablePctBadge})
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Plastic Items */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-700">Plastic Waste Items</td>
                    {plans.map((p) => {
                      const count = p.waste_metrics?.total_plastic_items;
                      const isZero = count === 0 || count === '0';
                      return (
                        <td key={p.plan_id} className="py-3.5 px-4 font-semibold">
                          {isZero ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                              Zero Plastic
                            </span>
                          ) : (
                            formatMetric(count, 'items')
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Constraint Result */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-700">Constraint Satisfaction</td>
                    {plans.map((p) => (
                      <td key={p.plan_id} className="py-3.5 px-4">
                        {p.constraint_result.feasible ? (
                          <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {p.constraint_result.relaxed_constraints.length === 0
                                ? 'All satisfied'
                                : `${p.constraint_result.relaxed_constraints.length} relaxed`}
                            </span>
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Infeasible</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Relaxed Constraints */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-700">Relaxed Constraints</td>
                    {plans.map((p) => (
                      <td key={p.plan_id} className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {p.constraint_result.relaxed_constraints.length === 0 ? (
                          <span className="text-slate-400">None</span>
                        ) : (
                          <ul className="list-disc pl-3 space-y-0.5">
                            {p.constraint_result.relaxed_constraints.map((rc, i) => (
                              <li key={i}>{rc.description}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Key Trade-offs */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-700">Key Trade-offs</td>
                    {plans.map((p) => (
                      <td key={p.plan_id} className="py-3.5 px-4 text-slate-700 leading-snug text-[11px]">
                        {p.tradeoffs.length > 0 ? p.tradeoffs.join('; ') : 'Balanced allocation'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Selection Action */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-slate-700">Organiser Selection</td>
                    {plans.map((p) => {
                      const isSel = selectedPlan?.plan_id === p.plan_id;
                      return (
                        <td key={p.plan_id} className={`py-4 px-4 ${isSel ? 'bg-emerald-50/60 rounded-b-2xl' : ''}`}>
                          <button
                            type="button"
                            onClick={() => handleSelect(p)}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                              isSel
                                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-md'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isSel ? 'Selected Plan' : 'Select Plan'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile / Narrow Screen View (stacked cards per Requirement 18) */}
            <div className="md:hidden space-y-6">
              {plans.map((p) => {
                const isSel = selectedPlan?.plan_id === p.plan_id;
                return (
                  <div
                    key={p.plan_id}
                    className={`p-5 rounded-2xl border ${
                      isSel ? 'border-2 border-emerald-600 bg-emerald-50/20' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {p.planning_objective.replace('_', ' ')}
                      </span>
                      {isSel && (
                        <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Selected</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{p.name}</h3>

                    <div className="space-y-2 text-xs divide-y divide-slate-100">
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Estimated Cost:</span>
                        <span className="font-extrabold text-slate-900">{formatCost(p.estimated_cost)}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Food Waste:</span>
                        <span className="font-bold text-slate-800">
                          {p.food_metrics?.estimated_waste_kg !== null && p.food_metrics?.estimated_waste_kg !== undefined
                            ? formatMetric(p.food_metrics.estimated_waste_kg, 'kg')
                            : formatMetric(p.food_metrics?.estimated_waste_servings, 'servings')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Single-use Items:</span>
                        <span className="font-bold text-slate-800">
                          {formatMetric(p.waste_metrics?.single_use_packaging_items, 'items')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Reusable Items:</span>
                        <span className="font-bold text-emerald-800">
                          {formatMetric(p.waste_metrics?.reusable_packaging_items, 'items')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Plastic Items:</span>
                        <span className="font-bold text-slate-800">
                          {formatMetric(p.waste_metrics?.total_plastic_items, 'items')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleSelect(p)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                          isSel ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                        }`}
                      >
                        {isSel ? 'Selected Plan' : 'Select Plan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
