import React from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { WastePlanResponse } from "../../../types/waste";
import {
  getHumanReadableParameter,
  formatSourceType,
  formatAssumptionValue,
} from "./wastePlanningHelpers";

export interface WasteExplainableSectionProps {
  response: WastePlanResponse;
  isOpen: boolean;
  onToggle: () => void;
  expectedAttendees: number | string;
}

export const WasteExplainableSection: React.FC<WasteExplainableSectionProps> = ({
  response,
  isOpen,
  onToggle,
  expectedAttendees,
}) => {
  return (
    <div className="space-y-6">
      {/* Collapsible Section: "How we estimated it" */}
      <div className="border border-line rounded-sheet overflow-hidden bg-paper-inset/20">
        <button
          type="button"
          onClick={onToggle}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-paper-inset/40 transition-colors focus:outline-none cursor-pointer"
          aria-expanded={isOpen}
        >
          <div>
            <h3 className="font-semibold text-ink text-sm sm:text-base">
              How we estimated it
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Review the reference benchmarks and calculation details used for
              your estimates.
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-paper-raised border border-line flex items-center justify-center text-ink flex-shrink-0 ml-3">
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="p-4 sm:p-6 border-t border-line bg-paper-raised space-y-4">
            <p className="text-xs text-ink-muted">
              Calculations apply verified campus reference rates based on your
              event size ({expectedAttendees} attendees) and selected
              categories:
            </p>

            <div className="space-y-2.5">
              {response.assumptions_used.length > 0 ? (
                response.assumptions_used.map((assump, idx) => {
                  const label = getHumanReadableParameter(assump.parameter);
                  const source = formatSourceType(assump.source_type);
                  const val = formatAssumptionValue(
                    assump.parameter,
                    assump.value,
                    assump.unit,
                  );
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-control border border-line bg-paper-inset/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">
                          {label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-paper-raised border border-line text-ink-muted text-[10px] font-semibold">
                          {source.label}
                        </span>
                      </div>
                      <div className="text-ink-muted font-mono">
                        Configured Rate:{" "}
                        <strong className="text-ink font-semibold">
                          {val}
                        </strong>
                      </div>
                      {(assump.reference_notes || assump.explanation) && (
                        <p className="text-[11px] text-ink-muted italic mt-0.5 font-sans">
                          {assump.reference_notes || assump.explanation}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-ink-faint italic">
                  No assumptions were needed or recorded.
                </p>
              )}
            </div>

            {response.missing_assumptions.length > 0 && (
              <div className="p-3.5 rounded-control bg-clay-50 border border-clay-200 text-xs text-clay-900 space-y-1">
                <strong>Missing Parameters:</strong>
                <p>
                  The following reference parameters were not configured in the
                  system:
                </p>
                <ul className="list-disc list-inside text-[11px] pl-1">
                  {response.missing_assumptions.map((m, i) => (
                    <li key={i}>{getHumanReadableParameter(m)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Required Disclaimer */}
      <div className="p-4 rounded-sheet bg-paper-inset/40 border border-line text-xs text-ink-muted flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-ink-faint mt-0.5 flex-shrink-0" />
        <div>
          <strong className="text-ink">Notice on Estimations:</strong> These figures are
          estimates based on available assumptions. Actual waste may vary
          depending on event activities and attendee behavior.
        </div>
      </div>
    </div>
  );
};
