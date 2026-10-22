import React from "react";
import { Leaf, Target, ShieldCheck } from "lucide-react";
import { SustainabilityActionItem } from "../../types/completePlan";

interface SustainabilityActionsListProps {
  actions: SustainabilityActionItem[];
}

const formatActionType = (type: string) => {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const getActionTypeBadge = (type: string) => {
  const upper = type.toUpperCase();
  if (upper.includes("FOOD")) {
    return "bg-clay-50 text-clay-800 border-clay-200";
  }
  if (upper.includes("REUSABLE") || upper.includes("PACKAGING")) {
    return "bg-moss-50 text-moss-800 border-moss-200";
  }
  if (upper.includes("PLASTIC")) {
    return "bg-paper-inset text-ink border-line";
  }
  return "bg-paper-inset text-ink-muted border-line";
};

export const SustainabilityActionsList: React.FC<
  SustainabilityActionsListProps
> = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="surface-sheet p-5 sm:p-8 mb-8 border border-line">
      {/* Header */}
      <div className="pb-6 mb-6 border-b border-line">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-paper-inset text-moss-800 text-xs font-semibold tracking-wide uppercase mb-2 border border-line">
          <Leaf className="w-3.5 h-3.5 text-moss-600" />
          <span>Measurable Environmental Actions</span>
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Sustainability Commitments & Verification
        </h2>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          Concrete operational interventions derived from your selected plan,
          with verification criteria for your team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((act, idx) => (
          <div
            key={idx}
            className="p-5 rounded-sheet border border-line bg-paper-raised hover:border-moss-400 transition-all flex flex-col justify-between space-y-3 shadow-xs card-hover"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono ${getActionTypeBadge(
                    act.action_type,
                  )}`}
                >
                  {formatActionType(act.action_type)}
                </span>
                <span className="text-[10px] text-ink-faint font-semibold font-mono">
                  Action Item #{idx + 1}
                </span>
              </div>

              <h3 className="font-serif font-bold text-ink text-base mb-1.5">
                {act.title}
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                {act.description}
              </p>

              {act.target_metric && (
                <div className="mt-2.5 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-control bg-moss-50 text-moss-900 text-xs font-bold border border-moss-200">
                  <Target className="w-3.5 h-3.5 text-moss-600 flex-shrink-0" />
                  <span>Target: {act.target_metric}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-line text-xs bg-paper-inset/40 p-3 rounded-control border border-line/60">
              <div className="flex items-center space-x-1.5 text-ink font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-moss-600" />
                <span>Verification Step:</span>
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                {act.verification_step}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
