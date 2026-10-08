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
    description: '',
    tagColor: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const estimatedCostNum = plan.estimated_cost ? Number(plan.estimated_cost) : null;
  const budgetNum = eventBudget ? Number(eventBudget) : null;
  const isOverBudget =
    estimatedCostNum !== null && budgetNum !== null && estimatedCostNum > budgetNum;
  const budgetDifference =
    estimatedCostNum !== null && budgetNum !== null ? budgetNum - estimatedCostNum : null;

  const formattedCost =
    estimatedCostNum !== null
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(estimatedCostNum)
      : 'Not estimated';

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
    : 'border border-slate-200 hover:border-slate-300 shadow-sm';

  return (
    <div className={`bg-white rounded-2xl flex flex-col justify-between transition-all ${borderClass}`}>
      <div className="p-5 sm:p-6">
        {/* Header: Objective Badge & Feasibility */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              {getObjectiveIcon()}
            </div>
            <div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${config.tagColor}`}>
                {config.badge}
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1">{plan.name}</h3>
            </div>
          </div>

          {isSelected && (
            <span className="inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-sm">
              <Check className="w-3.5 h-3.5" />
              <span>Selected</span>
            </span>
          )}
        </div>

        {/* Cost & Budget Status */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estimated Total Cost</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{formattedCost}</span>
          </div>

          {budgetNum !== null && (
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">Budget Limit:</span>
              {isOverBudget ? (
                <span className="text-rose-600 font-semibold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Deficit of ₹{Math.abs(budgetDifference || 0).toLocaleString()}</span>
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Remaining: ₹{(budgetDifference || 0).toLocaleString()}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Key Measurable Sustainability Metrics */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Measurable Sustainability Indicators</span>
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Food Waste */}
            <ExplainableMetric
              label="Food Waste"
              value={
                plan.food_metrics?.estimated_waste_kg !== null && plan.food_metrics?.estimated_waste_kg !== undefined
                  ? plan.food_metrics.estimated_waste_kg
                  : plan.food_metrics?.estimated_waste_servings !== null && plan.food_metrics?.estimated_waste_servings !== undefined
                  ? plan.food_metrics.estimated_waste_servings
                  : null
              }
              unit={
                plan.food_metrics?.estimated_waste_kg !== null && plan.food_metrics?.estimated_waste_kg !== undefined
                  ? 'kg'
                  : 'servings'
              }
              sourceType="ESTIMATED"
              explanation="Calculated by multiplying servings by per-serving weight and expected food waste percentage."
              assumptionParam="food_waste_percentage"
            />

            {/* Reusable Items */}
            <ExplainableMetric
              label="Reusable Items"
              value={plan.waste_metrics?.reusable_packaging_items}
              unit="items"
              badge={
                plan.waste_metrics?.reusable_percentage !== null && plan.waste_metrics?.reusable_percentage !== undefined
                  ? `${Math.round(Number(plan.waste_metrics.reusable_percentage) * 100)}%`
                  : undefined
              }
              sourceType="ESTIMATED"
              explanation="Based on organizer preference or domain assumptions for reusable cutlery/plates."
            />

            {/* Single-Use Items */}
            <ExplainableMetric
              label="Single-Use Items"
              value={plan.waste_metrics?.single_use_packaging_items}
              unit="items"
              sourceType="ESTIMATED"
              explanation="Disposable packaging items required to serve the scheduled meal courses."
            />

            {/* Plastic Items */}
            <ExplainableMetric
              label="Plastic Items"
              value={plan.waste_metrics?.total_plastic_items}
              unit="items"
              badge={
                plan.waste_metrics?.total_plastic_items === 0 ||
                plan.waste_metrics?.total_plastic_items === '0'
                  ? 'Zero Plastic'
                  : undefined
              }
              sourceType="ESTIMATED"
              explanation="Estimated plastic bottles and cups calculated per person/meal."
            />
          </div>
        </div>

        {/* Why this plan? */}
        {plan.explanations && plan.explanations.length > 0 && (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 mb-4 text-xs text-emerald-900">
            <span className="font-bold block text-emerald-950 mb-0.5">Why this plan?</span>
            <p className="line-clamp-2">{plan.explanations[0]}</p>
          </div>
        )}

        {/* Trade-offs */}
        {plan.tradeoffs && plan.tradeoffs.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 mb-4 text-xs text-amber-900">
            <span className="font-bold block text-amber-950 mb-0.5">Important Trade-off:</span>
            <p className="line-clamp-2">{plan.tradeoffs[0]}</p>
          </div>
        )}

        {/* Constraint Status */}
        <div className="text-xs text-slate-600 mb-4 flex items-center justify-between">
          <span className="text-slate-500 font-medium">Constraints:</span>
          {plan.constraint_result.feasible ? (
            <span className="text-emerald-700 font-semibold flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {plan.constraint_result.relaxed_constraints.length > 0
                  ? `Feasible (${plan.constraint_result.relaxed_constraints.length} relaxed)`
                  : 'All constraints satisfied'}
              </span>
            </span>
          ) : (
            <span className="text-rose-600 font-semibold flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Hard constraints violated</span>
            </span>
          )}
        </div>

        {/* Expandable Technical Details Drawer */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 text-xs">
            {/* All Sustainability Indicators */}
            {plan.sustainability_metrics && plan.sustainability_metrics.length > 0 && (
              <div>
                <h5 className="font-bold text-slate-800 mb-1.5">All Sustainability Metrics:</h5>
                <ul className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 font-mono text-[11px]">
                  {plan.sustainability_metrics.map((m, idx) => (
                    <li key={idx} className="flex justify-between items-center text-slate-700">
                      <span className="font-sans text-slate-600">{m.metric_name}:</span>
                      <span className="font-bold">
                        {m.value} {m.unit} <span className="text-[9px] text-slate-400 font-sans">({m.source_type})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Relaxed Constraints */}
            {plan.constraint_result.relaxed_constraints.length > 0 && (
              <div>
                <h5 className="font-bold text-amber-900 mb-1">Soft Constraints Relaxed:</h5>
                <ul className="space-y-1 text-slate-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px]">
                  {plan.constraint_result.relaxed_constraints.map((r, idx) => (
                    <li key={idx}>
                      <strong>{r.description}:</strong> {r.relaxation_reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Assumptions Used */}
            {plan.assumptions_used && plan.assumptions_used.length > 0 && (
              <div>
                <h5 className="font-bold text-slate-800 mb-1">Assumptions Resolved:</h5>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] font-mono">
                  {plan.assumptions_used.map((a, idx) => (
                    <div key={idx} className="text-slate-600 truncate">
                      <strong>{a.parameter}</strong>: {a.value} {a.unit} ({a.source_type})
                    </div>
                  ))}
                </div>
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
