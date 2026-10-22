import React from "react";

export type PreferencePriority = "MUST_HAVE" | "AVOID" | "WOULD_BE_NICE" | "FLEXIBLE" | string;

interface PreferenceTagProps {
  priority: PreferencePriority;
  label?: string;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md";
}

export const PreferenceTag: React.FC<PreferenceTagProps> = ({
  priority,
  label,
  onRemove,
  className = "",
  size = "sm",
}) => {
  const norm = priority.toUpperCase().replace(/\s+/g, "_");

  // Pattern distinction as required:
  // MUST_HAVE: solid border, moss color
  // AVOID: solid double/thick border, clay color
  // WOULD_BE_NICE: dashed border, moss-faint
  // FLEXIBLE: dotted border, ink-muted
  let styleClasses = "border border-solid border-line text-ink bg-paper-inset/40";
  let displayLabel = label;

  if (norm === "MUST_HAVE" || norm === "MUST HAVE" || norm === "REQUIRED") {
    styleClasses = "border border-solid border-moss-700 text-moss-800 bg-moss-50";
    displayLabel = displayLabel || "Must Have";
  } else if (norm === "AVOID" || norm === "NOT_ALLOWED") {
    styleClasses = "border-2 border-solid border-clay-700 text-clay-800 bg-clay-50";
    displayLabel = displayLabel || "Avoid";
  } else if (norm === "WOULD_BE_NICE" || norm === "WOULD BE NICE" || norm === "PREFERRED") {
    styleClasses = "border border-dashed border-moss-700 text-moss-800 bg-moss-50/60";
    displayLabel = displayLabel || "Would Be Nice";
  } else if (norm === "FLEXIBLE") {
    styleClasses = "border border-dotted border-line-strong text-ink-muted bg-paper-raised";
    displayLabel = displayLabel || "Flexible";
  } else {
    displayLabel = displayLabel || priority;
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2.5 py-0.5"
      : "text-xs px-3 py-1";

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full font-mono uppercase font-semibold tracking-wider ${sizeClasses} ${styleClasses} ${className}`}
    >
      <span>{displayLabel}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:opacity-75 focus:outline-none"
          aria-label={`Remove ${displayLabel}`}
        >
          ×
        </button>
      )}
    </span>
  );
};
