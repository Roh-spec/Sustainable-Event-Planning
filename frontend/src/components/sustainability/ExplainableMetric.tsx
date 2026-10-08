import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Info, CheckCircle2 } from 'lucide-react';

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
  isPositiveEco?: boolean; // If lower is better or higher is better
}

export const ExplainableMetric: React.FC<ExplainableMetricProps> = ({
  label,
  value,
  unit,
  sourceType,
  explanation,
  assumptionParam,
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

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-sm hover:border-emerald-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-emerald-600 flex-shrink-0">{icon}</div>}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
            {badge && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {badge}
              </span>
            )}
          </div>
        </div>

        {/* Why? explainability button */}
        {(explanation || sourceType || assumptionParam || description) && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-500 hover:text-emerald-700 px-1.5 py-0.5 rounded hover:bg-emerald-50 transition-colors focus:outline-none"
            aria-label={`Why this ${label} estimate?`}
            aria-expanded={isOpen}
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-600" />
            <span className="hidden sm:inline">Why?</span>
            {isOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        )}
      </div>

      <div className="mt-2 flex items-baseline space-x-1.5">
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

      {description && !isOpen && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{description}</p>
      )}

      {/* Collapsible Explainability Drawer */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2 bg-slate-50 -mx-3.5 sm:-mx-4 -mb-3.5 sm:-mb-4 p-3 rounded-b-xl">
          <div className="flex items-start space-x-1.5 text-slate-700">
            <Info className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span className="font-semibold text-slate-800">
              {explanation || description || 'Calculated using domain model assumptions and attendee configuration.'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-slate-200/60 font-mono">
            {sourceType && (
              <div>
                <span className="text-slate-400 block font-sans">Provenance:</span>
                <span className="font-semibold text-slate-700">{sourceType}</span>
              </div>
            )}
            {assumptionParam && (
              <div>
                <span className="text-slate-400 block font-sans">Parameter:</span>
                <span className="font-semibold text-slate-700 truncate block">{assumptionParam}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 text-[10px] text-emerald-700 font-sans font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Traceable calculation without arbitrary weights</span>
          </div>
        </div>
      )}
    </div>
  );
};
