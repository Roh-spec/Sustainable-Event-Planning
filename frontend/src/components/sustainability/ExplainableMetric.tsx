import React, { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
} from "lucide-react";
import { formatProvenanceLabel } from "../../utils/metricFormatting";
import { AnimatedCounter } from "../common/AnimatedCounter";

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
  const isAvailable = value !== null && value !== undefined && value !== "";

  const formattedValue = isAvailable
    ? typeof value === "number"
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
    <div className="bg-paper-inset/40 border border-line rounded-control p-3 sm:p-3.5 shadow-xs hover:border-moss-400 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center space-x-1.5 min-w-0">
            {icon && (
              <div className="text-moss-700 flex-shrink-0">{icon}</div>
            )}
            <span className="text-xs font-mono font-semibold text-ink-muted uppercase tracking-wide truncate">
              {label}
            </span>
          </div>

          {/* Why? explainability button */}
          {(explanation || description) && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center space-x-1 text-[11px] font-medium text-ink-muted hover:text-moss-700 px-1.5 py-0.5 rounded hover:bg-moss-50 transition-colors focus:outline-none flex-shrink-0 cursor-pointer"
              aria-label={`Why this ${label} estimate?`}
              aria-expanded={isOpen}
            >
              <HelpCircle className="w-3.5 h-3.5 text-ink-faint hover:text-moss-700" />
              <span className="hidden sm:inline">Why?</span>
              {isOpen ? (
                <ChevronUp className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              )}
            </button>
          )}
        </div>

        <div className="mt-2 flex items-baseline justify-between flex-wrap gap-1.5">
          <div className="flex items-baseline space-x-1.5">
            {isAvailable ? (
              <>
                {!isNaN(Number(value)) ? (
                  <AnimatedCounter
                    value={value}
                    decimals={
                      typeof value === "string" && value.includes(".")
                        ? value.split(".")[1].length
                        : typeof value === "number" && !Number.isInteger(value)
                          ? 1
                          : 0
                    }
                    className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight"
                  />
                ) : (
                  <span className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
                    {formattedValue}
                  </span>
                )}
                {unit && (
                  <span className="text-xs font-semibold text-ink-muted">
                    {unit}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-medium text-ink-faint italic">
                Not available
              </span>
            )}
          </div>

          {badge && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-moss-100 text-moss-800 border border-moss-300 inline-flex items-center">
              {badge}
            </span>
          )}
        </div>
      </div>

      {description && !isOpen && (
        <p className="mt-1.5 text-xs text-ink-muted line-clamp-1">
          {description}
        </p>
      )}

      {/* Collapsible Explainability Drawer */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-line text-xs text-ink-muted space-y-2 bg-paper-inset/70 -mx-3 sm:-mx-3.5 -mb-3 sm:-mb-3.5 p-3 rounded-b-control">
          <div className="flex items-start space-x-1.5 text-ink leading-relaxed">
            <Info className="w-3.5 h-3.5 text-moss-700 mt-0.5 flex-shrink-0" />
            <span className="font-medium">
              {explanation ||
                description ||
                "Estimated using event details and reference assumptions."}
            </span>
          </div>

          {sourceType && (
            <div className="pt-1.5 border-t border-line flex items-center justify-between text-[11px] text-ink-muted">
              <span className="inline-flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-moss-700 flex-shrink-0" />
                <span>{provenance}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
