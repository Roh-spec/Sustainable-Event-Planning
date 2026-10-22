import React, { useState } from "react";
import {
  FileText,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
} from "lucide-react";
import { AssumptionsAndConfirmations } from "../../types/completePlan";
import {
  formatAssumptionKey,
  formatAssumptionValue,
  formatProvenanceLabel,
} from "../../utils/metricFormatting";

interface AssumptionsDisclosureProps {
  assumptions: AssumptionsAndConfirmations;
}

export const AssumptionsDisclosure: React.FC<AssumptionsDisclosureProps> = ({
  assumptions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const planningAssumptions = assumptions?.planning_assumptions || [];
  const confirmations = assumptions?.items_requiring_confirmation || [];

  return (
    <div className="surface-sheet p-5 sm:p-8 mb-8 border border-line">
      {/* Header */}
      <div className="pb-6 mb-6 border-b border-line">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-paper-inset text-moss-800 text-xs font-semibold tracking-wide uppercase mb-2 border border-line">
          <Info className="w-3.5 h-3.5 text-moss-600" />
          <span>Transparency & Grounding</span>
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Assumptions & Organizer Confirmations
        </h2>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          Review the planning assumptions used to calculate estimates and items
          requiring confirmation with your venue or vendors.
        </p>
      </div>

      {/* Items Requiring Confirmation */}
      {confirmations.length > 0 && (
        <div className="mb-6 p-5 rounded-sheet bg-clay-50/70 border border-clay-200 text-clay-950">
          <div className="flex items-center space-x-2 font-bold text-sm text-clay-900 mb-2">
            <ShieldAlert className="w-4 h-4 text-clay-700 flex-shrink-0" />
            <span>Items Requiring Organizer Confirmation</span>
          </div>
          <p className="text-xs text-clay-800 mb-3 leading-relaxed">
            Please confirm the following operational requirements directly with
            your venue, caterer, or campus facilities team:
          </p>
          <ul className="space-y-2">
            {confirmations.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start space-x-2.5 text-xs text-ink bg-paper-raised p-2.5 rounded-control border border-clay-200/60"
              >
                <CheckCircle className="w-4 h-4 text-clay-700 flex-shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assumptions Accordion */}
      <div className="border border-line rounded-control overflow-hidden">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-4 bg-paper-inset/40 hover:bg-paper-inset/70 flex items-center justify-between text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-moss-600" />
            <span className="font-serif font-bold text-xs sm:text-sm text-ink">
              Planning Assumptions & Calculation Factors (
              {planningAssumptions.length} reference parameters)
            </span>
          </div>
          <div className="flex items-center space-x-2 text-ink-muted text-xs font-semibold">
            <span>{isExpanded ? "Hide Details" : "View Assumptions"}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-5 space-y-4 bg-paper-raised border-t border-line">
            <p className="text-xs text-ink-muted leading-relaxed">
              Estimates are computed using campus sustainability benchmarks and
              standard service ratios. All technical terms are translated into
              plain language below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {planningAssumptions.map((assump, idx) => {
                const param =
                  assump.parameter || (assump as any).parameter_key || "";
                const val =
                  assump.value !== undefined
                    ? assump.value
                    : (assump as any).resolved_value;
                const friendlyTitle =
                  assump.explanation ||
                  (param ? formatAssumptionKey(param) : "Planning Parameter");
                const friendlyValue = formatAssumptionValue(
                  val,
                  assump.unit,
                  param,
                );
                const provenance = formatProvenanceLabel(assump.source_type);

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-control border border-line bg-paper-inset/30 space-y-1 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-ink">
                        {friendlyTitle}
                      </span>
                      <span className="font-mono font-bold text-moss-800 bg-moss-50 px-2 py-0.5 rounded-control border border-moss-200 flex-shrink-0 tabular-nums">
                        {friendlyValue}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted">{provenance}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] text-ink-muted italic">
              Note: Assumptions are verified across institutional catering
              baselines. Actual values will depend on final attendee turnout and
              local service conditions.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
