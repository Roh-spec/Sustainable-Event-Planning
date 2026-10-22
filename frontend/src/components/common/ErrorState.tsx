import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Stamp } from "./Stamp";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorState Component:
 * Field-station discrepancy notice rendered on dotgrid with clay stamp and retry action.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Ledger Discrepancy",
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div
      role="alert"
      className={`surface-sheet dotgrid p-8 sm:p-10 border border-clay-300/80 bg-paper-raised flex flex-col items-center text-center relative overflow-hidden ${className}`}
    >
      <div className="mb-3">
        <Stamp variant="clay">DISCREPANCY</Stamp>
      </div>

      <div className="w-12 h-12 mb-3 rounded-full bg-clay-50 border border-clay-300 flex items-center justify-center text-clay-700">
        <AlertCircle className="w-6 h-6 stroke-[1.75]" />
      </div>

      <h3 className="font-display text-lg font-semibold text-ink mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-ink-muted max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-ghost text-xs inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
