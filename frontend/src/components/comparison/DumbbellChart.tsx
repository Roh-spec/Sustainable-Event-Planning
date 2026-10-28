import React from "react";

export interface DumbbellChartProps {
  spendRatio: number; // 0-100 representation of budget ceiling utilization
  diversionRatio: number; // 0-100 representation of circularity / diversion
  deltaLabel?: string;
  isOverBudget?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * DumbbellChart Component:
 * Inline SVG dumbbell chart plotting spend vs. circularity trade-offs.
 * Clay circle represents spend/cost burden (costs more).
 * Moss circle represents circularity / waste diversion (less waste).
 * The connecting bar and delta label highlight the exact trade-off.
 */
export const DumbbellChart: React.FC<DumbbellChartProps> = ({
  spendRatio,
  diversionRatio,
  deltaLabel,
  isOverBudget = false,
  compact = false,
  className = "",
}) => {
  // Clamp coordinates within viewBox (300 x 42 for normal, 280 x 32 for compact)
  const clampedSpend = Math.max(0, Math.min(100, spendRatio));
  const clampedCirc = Math.max(0, Math.min(100, diversionRatio));

  // Map 0-100 to SVG x coordinates
  // Range: 28 to 272 (normal) or 24 to 256 (compact)
  const x1 = Math.round(28 + (clampedSpend / 100) * 244);
  const x2 = Math.round(28 + (clampedCirc / 100) * 244);
  const y = compact ? 12 : 14;

  return (
    <div className={`w-full ${className}`}>
      <svg
        viewBox={compact ? "0 0 280 32" : "0 0 300 42"}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`Trade-off chart: Spend at ${clampedSpend}%, Circularity at ${clampedCirc}%`}
      >
        {/* Background dashed guideline axis */}
        <line
          x1={compact ? "14" : "18"}
          y1={y}
          x2={compact ? "266" : "282"}
          y2={y}
          className="stroke-line"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* Connecting dumbbell line between the two endpoints */}
        <line
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          className="stroke-ink-muted"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Spend endpoint (Danger if over ceiling, Clay if within budget) */}
        <circle
          cx={x1}
          cy={y}
          r={compact ? "4.5" : "5.5"}
          className={`${isOverBudget ? "fill-danger-deep" : "fill-clay-700"} stroke-paper-raised`}
          strokeWidth="2"
        />

        {/* Circularity endpoint (Moss = less waste) */}
        <circle
          cx={x2}
          cy={y}
          r={compact ? "4.5" : "5.5"}
          className="fill-moss-700 stroke-paper-raised"
          strokeWidth="2"
        />

        {/* Delta / Trade-off Label */}
        {deltaLabel && (
          <text
            x={compact ? "140" : "150"}
            y={compact ? "28" : "33"}
            textAnchor="middle"
            fontSize={compact ? "8.5" : "9.5"}
            fontFamily="JetBrains Mono, monospace"
            className="fill-ink-muted font-medium tabular-nums"
          >
            {deltaLabel}
          </text>
        )}
      </svg>

      {/* Legend summary row */}
      {!compact && (
        <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted pt-1 border-t border-line/40 mt-1">
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${isOverBudget ? "bg-danger-deep" : "bg-clay-700"} flex-shrink-0`}
              aria-hidden="true"
            />
            <span className={isOverBudget ? "text-danger-deep font-semibold" : ""}>
              Spend ({clampedSpend}%{isOverBudget ? " over ceiling" : ""})
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full bg-moss-700 flex-shrink-0"
              aria-hidden="true"
            />
            <span>
              Circularity ({clampedCirc}%)
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
