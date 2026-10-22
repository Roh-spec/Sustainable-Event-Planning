import React from "react";

export interface ToggleOption<T extends string | number> {
  value: T;
  label: string;
  sublabel?: string;
}

export interface SegmentedToggleProps<T extends string | number> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

/**
 * SegmentedToggle Component:
 * Sliding segmented switch with mechanical feedback, high contrast active state,
 * and keyboard radio-group semantics.
 */
export function SegmentedToggle<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className = "",
}: SegmentedToggleProps<T>): React.ReactElement {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-moss-800 font-mono block">
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-label={label || "Segmented option selector"}
        className="inline-flex p-1 rounded-control bg-paper-inset border border-line gap-1 max-w-full overflow-x-auto"
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={`flex items-baseline gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss-700 ${
                isSelected
                  ? "bg-paper-raised text-ink font-semibold shadow-subtle border border-line"
                  : "text-ink-muted hover:text-ink hover:bg-paper-raised/50 border border-transparent"
              }`}
            >
              <span>{option.label}</span>
              {option.sublabel && (
                <span className="font-mono text-[10px] text-ink-faint">
                  {option.sublabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
