import React from "react";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong";
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * GlassPanel Component:
 * Wraps .glass (translucent floating card) or .glass-strong (higher opacity for text/forms).
 * Includes light-edge border highlights and solid fallbacks for reduced transparency.
 *
 * Rules:
 * - Allowed on: header, live receipts, selected plan summaries, modals, hero worked example.
 * - Forbidden on: dense tables, checklist rows, timetable grids (use solid surface).
 */
export const GlassPanel: React.FC<GlassPanelProps> = ({
  variant = "default",
  children,
  className = "",
  as: Component = "div",
  ...props
}) => {
  const glassClass = variant === "strong" ? "glass-strong" : "glass";

  return (
    <Component
      className={`${glassClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
