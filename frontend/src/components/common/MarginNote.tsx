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
 * Field-notebook style marginalia rendered in Caveat handwriting with pen mark or stamp.
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
      className={`relative my-4 border-l-2 pl-4 py-2 transition-colors ${
        isWarning
          ? "border-clay-700 bg-clay-50/50"
          : "border-moss-700 bg-moss-50/40"
      } ${className}`}
      aria-label="Margin note"
    >
      <div className="flex items-center space-x-2 mb-1">
        {stampText ? (
          <Stamp variant={isWarning ? "clay" : "moss"}>{stampText}</Stamp>
        ) : (
          <span
            className={`font-handwriting text-xl font-semibold tracking-wide ${
              isWarning ? "text-clay-700" : "text-moss-800"
            }`}
          >
            {label} ✍
          </span>
        )}
      </div>
      <div
        className={`text-xs leading-relaxed font-sans ${
          isWarning ? "text-ink" : "text-ink-muted"
        }`}
      >
        {children}
      </div>
    </aside>
  );
};
