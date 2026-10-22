import React from "react";

export interface ReceiptItem {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sublabel?: string;
  delta?: string;
  deltaType?: "moss" | "clay" | "neutral";
}

export interface ReceiptProps {
  title?: string;
  receiptNumber?: string;
  timestamp?: string;
  items?: ReceiptItem[];
  children?: React.ReactNode;
  summaryRow?: React.ReactNode;
  glass?: boolean;
  className?: string;
}

/**
 * Receipt Component:
 * Field register checkout summary with monospace item lines, double-ruled total,
 * physical unit precision, and a physical torn-edge SVG bottom.
 */
export const Receipt: React.FC<ReceiptProps> = ({
  title = "FIELD ESTIMATE RECEIPT",
  receiptNumber,
  timestamp,
  items,
  children,
  summaryRow,
  glass = true,
  className = "",
}) => {
  const containerClass = glass
    ? "glass text-ink"
    : "bg-paper-raised border border-line text-ink";

  return (
    <div className={`relative flex flex-col ${containerClass} ${className}`}>
      {/* Receipt Header */}
      <div className="p-4 sm:p-5 border-b border-line/70">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.18em] text-moss-700 block">
              {title}
            </span>
            {receiptNumber && (
              <span className="font-mono text-xs text-ink-muted">
                REC-{receiptNumber}
              </span>
            )}
          </div>
          {timestamp && (
            <span className="font-mono text-[11px] text-ink-muted tabular-nums">
              {timestamp}
            </span>
          )}
        </div>
      </div>

      {/* Receipt Line Items */}
      <div className="p-4 sm:p-5 space-y-2.5 flex-1">
        {items &&
          items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-baseline justify-between py-1 border-b border-dotted border-line-strong/50 text-xs font-mono"
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="truncate text-ink font-medium">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[10px] text-ink-muted">
                    {item.sublabel}
                  </span>
                )}
              </div>
              <div className="flex items-baseline space-x-1.5 flex-shrink-0 text-right">
                {item.delta && (
                  <span
                    className={`text-[11px] ${
                      item.deltaType === "moss"
                        ? "text-moss-700"
                        : item.deltaType === "clay"
                        ? "text-clay-700"
                        : "text-ink-muted"
                    }`}
                  >
                    {item.delta}
                  </span>
                )}
                <span className="tabular-nums font-semibold text-ink">
                  {item.value}
                </span>
                {item.unit && (
                  <span className="text-ink-muted text-[11px]">{item.unit}</span>
                )}
              </div>
            </div>
          ))}

        {children}

        {/* Double-Ruled Summary / Total */}
        {summaryRow && (
          <div className="pt-3 mt-3 double-rule-top double-rule-bottom">
            {summaryRow}
          </div>
        )}
      </div>

      {/* Authentic Torn-Edge SVG Bottom */}
      <div
        className="w-full h-3 overflow-hidden text-paper-raised pointer-events-none -mb-3 z-10"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 120 10"
          preserveAspectRatio="none"
          className="w-full h-full fill-current stroke-line"
          strokeWidth="0.5"
        >
          <path d="M 0,0 L 5,7 L 10,1 L 15,6 L 20,2 L 25,7 L 30,1 L 35,6 L 40,2 L 45,7 L 50,1 L 55,6 L 60,2 L 65,7 L 70,1 L 75,6 L 80,2 L 85,7 L 90,1 L 95,6 L 100,2 L 105,7 L 110,1 L 115,6 L 120,0 L 120,0 L 0,0 Z" />
        </svg>
      </div>
    </div>
  );
};
