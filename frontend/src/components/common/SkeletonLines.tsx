import React from "react";

export interface SkeletonLinesProps {
  lines?: number;
  variant?: "text" | "table" | "card";
  className?: string;
}

/**
 * SkeletonLines Component:
 * Ledger ruled lines placeholder with gentle opacity pulse (transform/opacity only).
 * Frozen under prefers-reduced-motion.
 */
export const SkeletonLines: React.FC<SkeletonLinesProps> = ({
  lines = 3,
  variant = "text",
  className = "",
}) => {
  if (variant === "card") {
    return (
      <div
        className={`surface-sheet p-6 border border-line bg-paper-raised skeleton-pulse space-y-4 ${className}`}
        aria-hidden="true"
      >
        <div className="h-4 bg-line rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-3 bg-line/70 rounded w-full" />
          <div className="h-3 bg-line/70 rounded w-5/6" />
          <div className="h-3 bg-line/70 rounded w-2/3" />
        </div>
        <div className="pt-3 border-t border-line flex justify-between">
          <div className="h-4 bg-line rounded w-1/4" />
          <div className="h-4 bg-line rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div
        className={`space-y-3 skeleton-pulse ${className}`}
        aria-hidden="true"
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-line/60"
          >
            <div
              className="h-3 bg-line rounded"
              style={{ width: `${Math.max(30, 65 - i * 10)}%` }}
            />
            <div className="h-3 bg-line rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`space-y-2.5 skeleton-pulse ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-line rounded"
          style={{ width: `${Math.max(40, 100 - (i % 3) * 20)}%` }}
        />
      ))}
    </div>
  );
};
