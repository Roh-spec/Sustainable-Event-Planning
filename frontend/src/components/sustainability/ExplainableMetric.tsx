import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Info, CheckCircle2 } from 'lucide-react';
import { formatProvenanceLabel } from '../../utils/metricFormatting';

interface ExplainableMetricProps {
  label: string;
  value?: number | string | null;
  unit?: string | null;
  sourceType?: string | null;
  explanation?: string | null;
  assumptionParam?: string | null;
  description?: string | null;
  icon?: React.ReactNode;
  badge?: string;
  isPositiveEco?: boolean;
}

export const ExplainableMetric: React.FC<ExplainableMetricProps> = ({
  label,
  value,
  unit,
  sourceType,
  explanation,
  description,
  icon,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // CRITICAL REQUIREMENT: Never convert null/undefined into 0!
  const isAvailable = value !== null && value !== undefined && value !== '';

  const formattedValue = isAvailable
    ? typeof value === 'number'
      ? Number.isInteger(value)
        ? value.toLocaleString()
        : Number(value).toFixed(1)
      : !isNaN(Number(value))
      ? Number.isInteger(Number(value))
        ? Number(value).toLocaleString()
        : Number(value).toFixed(1)
      : value
    : null;

  const provenance = formatProvenanceLabel(sourceType);

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 shadow-sm hover:border-emerald-300 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center space-x-1.5 min-w-0">
            {icon && <div className="text-emerald-600 flex-shrink-0">{icon}</div>}
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide truncate">
              {label}
            </span>
          </div>

          {/* Why? explainability button */}
          {(explanation || description) && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-500 hover:text-emerald-700 px-1.5 py-0.5 rounded hover:bg-emerald-50 transition-colors focus:outline-none flex-shrink-0"
              aria-label={`Why this ${label} estimate?`}
              aria-expanded={isOpen}
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-600" />
              <span className="hidden sm:inline">Why?</span>
              {isOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>
          )}
        </div>

        <div className="mt-2 flex items-baseline justify-between flex-wrap gap-1.5">
          <div className="flex items-baseline space-x-1.5">
            {isAvailable ? (
              <>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {formattedValue}
                </span>
                {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
              </>
            ) : (
              <span className="text-sm font-medium text-slate-400 italic">Not available</span>
            )}
          </div>

          {badge && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-300/60 inline-flex items-center">
              {badge}
            </span>
          )}
        </div>
      </div>

      {description && !isOpen && (
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-1">{description}</p>
      )}

      {/* Collapsible Explainability Drawer */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-200/70 text-xs text-slate-600 space-y-2 bg-slate-100/70 -mx-3 sm:-mx-3.5 -mb-3 sm:-mb-3.5 p-3 rounded-b-xl">
          <div className="flex items-start space-x-1.5 text-slate-800 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span className="font-medium">
              {explanation || description || 'Estimated using event details and reference assumptions.'}
            </span>
          </div>

          {sourceType && (
            <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>{provenance}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
