import React from "react";

export interface MarginNoteProps {
  type?: "note" | "warning" | "stamp" | "editorial";
  label?: string;
  stampText?: string;
  children: React.ReactNode;
  className?: string;
}

export const MarginNote: React.FC<MarginNoteProps> = ({
  type = "note",
  label = "note",
  stampText,
  children,
  className = "",
}) => {
  const isWarning = type === "warning" || type === "stamp";

  return (
    <aside
      className={`relative my-4 border-l-2 pl-4 py-1.5 transition-colors ${
        isWarning
          ? "border-clay-700 bg-clay-50/50"
          : "border-moss-700 bg-moss-50/40"
      } ${className}`}
    >
      <div className="flex items-center space-x-2 mb-1">
        {stampText ? (
          <span className="stamp-clay">{stampText}</span>
        ) : (
          <span
            className={`font-handwriting text-lg font-semibold tracking-wide ${
              isWarning ? "text-clay-800" : "text-moss-800"
            }`}
          >
            {label} ✍
          </span>
        )}
      </div>
      <div
        className={`text-xs leading-relaxed ${
          isWarning ? "text-clay-900" : "text-ink-muted"
        }`}
      >
        {children}
      </div>
    </aside>
  );
};
