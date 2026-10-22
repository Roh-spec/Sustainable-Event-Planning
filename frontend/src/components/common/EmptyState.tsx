import React from "react";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState Component:
 * Field notebook empty registry illustration rendered on a dotgrid background.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className = "",
}) => {
  return (
    <div
      className={`surface-sheet dotgrid p-8 sm:p-12 text-center border border-line flex flex-col items-center justify-center relative overflow-hidden ${className}`}
    >
      {/* Icon or Default Field Ledger Line Art */}
      <div className="w-16 h-16 mb-4 flex items-center justify-center text-moss-700 bg-paper-raised rounded-sheet border border-line shadow-subtle p-3">
        {icon || (
          <svg
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            aria-hidden="true"
          >
            <rect x="5" y="4" width="22" height="24" rx="2" />
            <line x1="10" y1="10" x2="22" y2="10" />
            <line x1="10" y1="15" x2="18" y2="15" />
            <line x1="10" y1="20" x2="15" y2="20" />
            <circle cx="21" cy="21" r="3.5" strokeDasharray="1.5 2" />
          </svg>
        )}
      </div>

      <h3 className="font-display text-xl font-semibold text-ink mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-ink-muted max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};
