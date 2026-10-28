import React from "react";
import { Stamp } from "./Stamp";

export interface MarginNoteProps {
  type?: "note" | "warning" | "stamp" | "editorial";
  label?: string;
  stampText?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * MarginNote Component:
 * Field-notebook style marginalia rendered with authentic technical editorial styling.
 * Rule: Maximum 1-2 annotations per page to preserve editorial restraint.
 */
export const MarginNote: React.FC<MarginNoteProps> = ({
  type = "note",
  label = "Organizer Note",
  stampText,
  children,
  className = "",
}) => {
  const isWarning = type === "warning" || type === "stamp";

  return (
    <aside
      className={`relative my-4 border-l-2 pl-3.5 py-1.5 transition-colors ${
        isWarning
          ? "border-danger-deep bg-danger-bg/50"
          : "border-moss-700 bg-moss-50/50"
      } ${className}`}
      aria-label="Margin note"
    >
      <div className="flex items-center space-x-2 mb-0.5">
        {stampText ? (
          <Stamp variant={isWarning ? "danger" : "moss"}>{stampText}</Stamp>
        ) : (
          <span
            className={`font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${
              isWarning ? "text-danger-deep" : "text-moss-800"
            }`}
          >
            {label}
          </span>
        )}
      </div>
      <div
        className={`text-xs leading-relaxed font-sans ${
          isWarning ? "text-danger-deep" : "text-ink-muted"
        }`}
      >
        {children}
      </div>
    </aside>
  );
};
