import React from 'react';
import { Leaf, Target, ShieldCheck } from 'lucide-react';
import { SustainabilityActionItem } from '../../types/completePlan';

interface SustainabilityActionsListProps {
  actions: SustainabilityActionItem[];
}

const formatActionType = (type: string) => {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const getActionTypeBadge = (type: string) => {
  const upper = type.toUpperCase();
  if (upper.includes('FOOD')) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  if (upper.includes('REUSABLE') || upper.includes('PACKAGING')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (upper.includes('PLASTIC')) {
    return 'bg-teal-50 text-teal-800 border-teal-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

export const SustainabilityActionsList: React.FC<SustainabilityActionsListProps> = ({
  actions,
}) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-8 mb-8">
      {/* Header */}
      <div className="pb-6 mb-6 border-b border-slate-100">
        <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2 border border-emerald-200">
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>Measurable Environmental Actions</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Sustainability Commitments & Verification
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Concrete operational interventions derived from your selected plan, with verification criteria for your team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((act, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3 shadow-sm"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getActionTypeBadge(
                    act.action_type
                  )}`}
                >
                  {formatActionType(act.action_type)}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Action Item #{idx + 1}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm mb-1.5">{act.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>

              {act.target_metric && (
                <div className="mt-2.5 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200/80">
                  <Target className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Target: {act.target_metric}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-1.5 text-slate-700 font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verification Step:</span>
              </div>
              <p className="text-[11px] text-slate-600">{act.verification_step}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
