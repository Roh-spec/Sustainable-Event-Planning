import React from "react";

interface SectionHeadingProps {
  kicker?: string;
  title: string;
  note?: string;
  className?: string;
  align?: "left" | "center";
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  kicker,
  title,
  note,
  className = "",
  align = "left",
}) => {
  return (
    <div className={`${align === "center" ? "text-center" : "text-left"} ${className}`}>
      {kicker && (
        <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-moss-700 mb-1">
          {kicker}
        </span>
      )}
      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
        {title}
      </h2>
      {note && (
        <p className="mt-1 text-sm text-ink-muted font-normal max-w-2xl">
          {note}
        </p>
      )}
    </div>
  );
};
