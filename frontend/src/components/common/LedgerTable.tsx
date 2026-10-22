import React from "react";

export interface LedgerRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  delta?: string;
  deltaType?: "moss" | "clay" | "neutral";
  isTotal?: boolean;
  sublabel?: string;
  className?: string;
}

export const LedgerRow: React.FC<LedgerRowProps> = ({
  label,
  value,
  unit,
  delta,
  deltaType = "neutral",
  isTotal = false,
  sublabel,
  className = "",
}) => {
  const deltaColor =
    deltaType === "moss"
      ? "text-moss-700"
      : deltaType === "clay"
      ? "text-clay-700"
      : "text-ink-muted";

  return (
    <div
      className={`group flex items-baseline justify-between py-2.5 transition-colors ${
        isTotal
          ? "double-rule-top double-rule-bottom font-semibold mt-2 pt-3 pb-3 text-ink"
          : "border-b border-line/60 hover:bg-paper-inset/40 px-1"
      } ${className}`}
    >
      {/* Left: label and optional sublabel */}
      <div className="flex flex-col min-w-0 pr-3">
        <span
          className={`truncate ${
            isTotal ? "text-base font-semibold text-ink" : "text-sm text-ink font-medium"
          }`}
        >
          {label}
        </span>
        {sublabel && (
          <span className="text-[11px] font-mono text-ink-muted tracking-tight">
            {sublabel}
          </span>
        )}
      </div>

      {/* Dotted leader line */}
      {!isTotal && (
        <div className="flex-1 border-b border-dotted border-line-strong/70 mx-2 self-center translate-y-[2px]" />
      )}

      {/* Right: value, unit, and optional delta */}
      <div className="flex items-baseline space-x-2 text-right pl-2 flex-shrink-0">
        {delta && (
          <span className={`text-xs font-mono font-medium ${deltaColor}`}>
            {delta}
          </span>
        )}
        <span
          className={`font-mono tabular-nums ${
            isTotal ? "text-lg font-bold text-ink" : "text-sm font-semibold text-ink"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-ink-muted">{unit}</span>
        )}
      </div>
    </div>
  );
};

export interface LedgerTableProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  title,
  subtitle,
  children,
  className = "",
  badge,
}) => {
  return (
    <div
      className={`surface-sheet p-5 sm:p-6 bg-paper-raised border border-line ${className}`}
    >
      {(title || badge) && (
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-line">
          <div>
            {title && (
              <h3 className="font-display text-lg font-semibold text-ink">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-ink-muted font-sans mt-0.5">{subtitle}</p>
            )}
          </div>
          {badge && (
            <span className="font-mono text-[11px] font-semibold uppercase px-2 py-0.5 border border-line-strong rounded-control text-ink-muted bg-paper-inset/60">
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
};
