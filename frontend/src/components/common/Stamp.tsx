import React from "react";

export interface StampProps {
  variant?: "clay" | "moss" | "faint" | "danger";
  children: React.ReactNode;
  thump?: boolean;
  className?: string;
}

/**
 * Stamp Component:
 * Ledger verification stamp with slight angle and authentic field-station ink styling.
 * Used for status indicators (e.g., RECOMMENDED, OVER BUDGET, DEFICIT, VERIFIED).
 */
export const Stamp: React.FC<StampProps> = ({
  variant = "moss",
  children,
  thump = false,
  className = "",
}) => {
  const variantClass =
    variant === "danger"
      ? "stamp-danger"
      : variant === "clay"
      ? "stamp-clay"
      : variant === "faint"
      ? "stamp-faint"
      : "stamp-moss";

  const thumpClass = thump ? "stamp-thump" : "";

  return (
    <span
      className={`${variantClass} ${thumpClass} ${className}`}
      role="status"
    >
      {children}
    </span>
  );
};
