import React, { useState } from 'react';
import {
  Wallet,
  Scale,
  Leaf,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
} from 'lucide-react';
import { PlanAlternative, PLANNING_OBJECTIVE_CONFIG } from '../../types';
import { ExplainableMetric } from '../sustainability/ExplainableMetric';
import {
  formatCurrency,
  formatReusablePercentage,
  formatAssumptionKey,
  formatAssumptionValue,
  formatProvenanceLabel,
} from '../../utils/metricFormatting';

interface PlanCardProps {
  plan: PlanAlternative;
  eventBudget?: number | string | null;
  isSelected?: boolean;
  onSelect: (plan: PlanAlternative) => void;
  currency?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  eventBudget,
  isSelected,
  onSelect,
  currency = 'INR',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const config = PLANNING_OBJECTIVE_CONFIG[plan.planning_objective] || {
    label: plan.name,
    badge: 'Alternative',
    icon: 'Sparkles',
    description: 'Deterministic alternative balancing budget, waste and attendee preferences.',
    tagColor: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const estimatedCostNum =
    plan.estimated_cost !== null && plan.estimated_cost !== undefined && plan.estimated_cost !== ''
      ? Number(plan.estimated_cost)
      : null;
  const budgetNum =
    eventBudget !== null && eventBudget !== undefined && eventBudget !== ''
      ? Number(eventBudget)
      : null;

  const isOverBudget =
    estimatedCostNum !== null && budgetNum !== null && estimatedCostNum > budgetNum;
  const budgetDifference =
    estimatedCostNum !== null && budgetNum !== null ? budgetNum - estimatedCostNum : null;

  const formattedCost = formatCurrency(plan.estimated_cost, currency);

  const getObjectiveIcon = () => {
    switch (plan.planning_objective) {
      case 'BUDGET_FOCUSED':
        return <Wallet className="w-5 h-5 text-blue-600" />;
      case 'BALANCED':
        return <Scale className="w-5 h-5 text-emerald-600" />;
      case 'SUSTAINABILITY_FOCUSED':
        return <Leaf className="w-5 h-5 text-green-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-slate-600" />;
    }
  };

  const borderClass = isSelected
    ? 'border-2 border-emerald-600 ring-4 ring-emerald-100 shadow-xl'
    : plan.planning_objective === 'SUSTAINABILITY_FOCUSED'
    ? 'border-2 border-emerald-400 hover:border-emerald-500 shadow-md'
    : 'border border-slate-200/90 hover:border-slate-300 shadow-sm';

  // Metrics mapping
  const hasWasteKg =
    plan.food_metrics?.estimated_waste_kg !== null &&
    plan.food_metrics?.estimated_waste_kg !== undefined &&
    plan.food_metrics?.estimated_waste_kg !== '';
  const hasWasteServings =
    plan.food_metrics?.estimated_waste_servings !== null &&
    plan.food_metrics?.estimated_waste_servings !== undefined &&
    plan.food_metrics?.estimated_waste_servings !== '';

  const foodWasteValue = hasWasteKg
    ? plan.food_metrics!.estimated_waste_kg
    : hasWasteServings
    ? plan.food_metrics!.estimated_waste_servings
    : null;

  const foodWasteUnit = hasWasteKg ? 'kg' : hasWasteServings ? 'servings' : undefined;

  const reusableBadge = formatReusablePercentage(plan.waste_metrics);

  const plasticCount = plan.waste_metrics?.total_plastic_items;
  const isZeroPlastic =
    plasticCount !== null &&
    plasticCount !== undefined &&
    plasticCount !== '' &&
    (plasticCount === 0 || plasticCount === '0' || Number(plasticCount) === 0);
  const plasticBadge = isZeroPlastic ? 'Zero Plastic' : undefined;

  // Plain-language explanations (Section A)
  const foodWasteExplanation =
    foodWasteValue !== null
      ? `We estimate how much food may be left uneaten based on the planned meals and expected leftovers (${foodWasteValue} ${foodWasteUnit || 'kg'} estimated).`
      : 'We estimate how much food may be left uneaten based on the planned meals and expected leftovers.';

  const reusableExplanation =
    plan.waste_metrics?.reusable_packaging_items !== null &&
    plan.waste_metrics?.reusable_packaging_items !== undefined
      ? reusableBadge
        ? `These are serving items expected to be reusable, helping reduce disposable waste (${plan.waste_metrics.reusable_packaging_items} items, ${reusableBadge} reusable).`
        : `These are serving items expected to be reusable, helping reduce disposable waste (${plan.waste_metrics.reusable_packaging_items} items).`
      : 'These are serving items expected to be reusable, helping reduce disposable waste.';

  const singleUseExplanation =
    plan.waste_metrics?.single_use_packaging_items !== null &&
    plan.waste_metrics?.single_use_packaging_items !== undefined
      ? `These are disposable serving items expected to be used during the event (${plan.waste_metrics.single_use_packaging_items} items estimated).`
      : 'These are disposable serving items expected to be used during the event.';

  const plasticExplanation = isZeroPlastic
    ? 'We estimate plastic items such as bottles or cups based on the event size and available assumptions (0 plastic items — plastic-free alternative).'
    : plasticCount !== null && plasticCount !== undefined
    ? `We estimate plastic items such as bottles or cups based on the event size and available assumptions (${plasticCount} items estimated).`
    : 'We estimate plastic items such as bottles or cups based on the event size and available assumptions.';

  return (
    <div className={`bg-white rounded-2xl flex flex-col justify-between transition-all h-full ${borderClass}`}>
      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        {/* Header: Objective Badge & Feasibility */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 mt-0.5">
              {getObjectiveIcon()}
            </div>
            <div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${config.tagColor}`}>
                {config.badge}
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1">{plan.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>

          {isSelected && (
            <span className="inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-sm flex-shrink-0">
              <Check className="w-3.5 h-3.5" />
              <span>Selected</span>
            </span>
          )}
        </div>

        {/* Cost & Budget Status */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Estimated Total Cost
            </span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formattedCost}
            </span>
          </div>

          {budgetNum !== null && (
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">Budget Limit:</span>
              {isOverBudget ? (
                <span className="text-rose-600 font-semibold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Deficit of ₹{Math.abs(budgetDifference || 0).toLocaleString()}</span>
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Remaining: ₹{(budgetDifference || 0).toLocaleString()}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Key Measurable Sustainability Metrics */}
        <div className="mb-5 flex-grow">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Measurable Sustainability Indicators</span>
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5 items-stretch">
            {/* Food Waste */}
            <ExplainableMetric
              label="Food Waste"
              value={foodWasteValue}
              unit={foodWasteUnit}
              sourceType="ESTIMATED"
              explanation={foodWasteExplanation}
            />

            {/* Reusable Items */}
            <ExplainableMetric
              label="Reusable Items"
              value={plan.waste_metrics?.reusable_packaging_items}
              unit="items"
              badge={reusableBadge}
              sourceType="ESTIMATED"
              explanation={reusableExplanation}
            />

            {/* Single-Use Items */}
            <ExplainableMetric
              label="Single-Use Items"
              value={plan.waste_metrics?.single_use_packaging_items}
              unit="items"
              sourceType="ESTIMATED"
              explanation={singleUseExplanation}
            />

            {/* Plastic Items */}
            <ExplainableMetric
              label="Plastic Items"
              value={plan.waste_metrics?.total_plastic_items}
              unit="items"
              badge={plasticBadge}
              sourceType="ESTIMATED"
              explanation={plasticExplanation}
            />
          </div>
        </div>

        {/* Why this plan? */}
        {plan.explanations && plan.explanations.length > 0 && (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 mb-3 text-xs text-emerald-900">
            <span className="font-bold block text-emerald-950 mb-0.5">Why this plan?</span>
            <p className="line-clamp-2 leading-relaxed">{plan.explanations[0]}</p>
          </div>
        )}

        {/* Trade-offs */}
        {plan.tradeoffs && plan.tradeoffs.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 mb-3 text-xs text-amber-900">
            <span className="font-bold block text-amber-950 mb-0.5">Important Trade-off:</span>
            <p className="line-clamp-2 leading-relaxed">{plan.tradeoffs[0]}</p>
          </div>
        )}

        {/* Preferences / Constraints Status */}
        <div className="text-xs text-slate-600 mb-2 flex items-center justify-between">
          <span className="text-slate-500 font-medium">Preferences:</span>
          {plan.constraint_result.feasible ? (
            <span className="text-emerald-700 font-semibold flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>
                {plan.constraint_result.relaxed_constraints &&
                plan.constraint_result.relaxed_constraints.length > 0
                  ? `Feasible (${plan.constraint_result.relaxed_constraints.length} relaxed)`
                  : 'All preferences satisfied'}
              </span>
            </span>
          ) : (
            <span className="text-rose-600 font-semibold flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Hard constraints violated</span>
            </span>
          )}
        </div>

        {/* Expandable Technical Details Drawer */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3.5 text-xs">
            {/* A preference we couldn't fully meet (Section C) */}
            {plan.constraint_result.relaxed_constraints &&
              plan.constraint_result.relaxed_constraints.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-950 space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>A preference we couldn't fully meet</span>
                  </div>
                  <ul className="space-y-2 text-slate-700">
                    {plan.constraint_result.relaxed_constraints.map((r, idx) => (
                      <li key={idx} className="bg-white/90 p-2.5 rounded-lg border border-amber-200/50 leading-relaxed">
                        <p className="font-semibold text-slate-900">
                          You preferred: <span className="font-normal text-slate-700">{r.description}</span>
                        </p>
                        {r.relaxation_reason && (
                          <p className="mt-1 text-slate-600">
                            <strong>Plan trade-off:</strong> {r.relaxation_reason}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* What we based this estimate on (Section B) */}
            {plan.assumptions_used && plan.assumptions_used.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 text-xs">
                <h5 className="font-bold text-slate-800">What we based this estimate on:</h5>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {plan.assumptions_used.map((a, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-slate-800 block truncate">
                          {formatAssumptionKey(a.parameter)}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {formatProvenanceLabel(a.source_type)}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 text-right whitespace-nowrap">
                        {formatAssumptionValue(a.value, a.unit, a.parameter)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Sustainability Indicators */}
            {plan.sustainability_metrics && plan.sustainability_metrics.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 text-xs">
                <h5 className="font-bold text-slate-800">All sustainability indicators:</h5>
                <ul className="space-y-1.5">
                  {plan.sustainability_metrics.map((m, idx) => (
                    <li
                      key={idx}
                      className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex justify-between items-center text-xs text-slate-700 gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-slate-800 block truncate">
                          {formatAssumptionKey(m.metric_name)}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {formatProvenanceLabel(m.source_type)}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 whitespace-nowrap">
                        {m.value} {m.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 rounded-b-2xl flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 px-3 rounded-lg hover:bg-slate-200/60 transition-colors focus:outline-none"
        >
          <span>{showDetails ? 'Hide Details' : 'View Details'}</span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={() => onSelect(plan)}
          className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all focus:outline-none ${
            isSelected
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4" />
              <span>Selected Plan</span>
            </>
          ) : (
            <span>Select this Plan</span>
          )}
        </button>
      </div>
    </div>
  );
};
