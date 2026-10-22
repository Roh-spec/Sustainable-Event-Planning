import React from "react";
import { GlassPanel } from "../common/GlassPanel";
import { Stamp } from "../common/Stamp";
import { MarginNote } from "../common/MarginNote";
import { AnimatedCounter } from "../common/AnimatedCounter";

export interface HomeWorkedExampleProps {
  className?: string;
}

/**
 * HomeWorkedExample:
 * Handcrafted worked case study of a 150-person hackathon.
 * Demonstrates physical units (kg surplus averted, item counts, ₹ spend)
 * inside a floating GlassPanel over the living landscape backdrop.
 * Wording is strictly conditional ("would eliminate", "would be averted").
 */
export const HomeWorkedExample: React.FC<HomeWorkedExampleProps> = ({
  className = "",
}) => {
  return (
    <GlassPanel
      variant="strong"
      className={`p-6 relative overflow-hidden ${className}`}
    >
      {/* Header with Case Study Title and Stamp */}
      <div className="flex items-start justify-between border-b border-line pb-3 mb-4">
        <div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-moss-700 block">
            Worked Case Study
          </span>
          <h3 className="font-display text-xl font-semibold text-ink">
            150-Person Hackathon
          </h3>
        </div>
        <Stamp variant="faint" className="font-mono">
          Worked Example
        </Stamp>
      </div>

      {/* Hero Metric Anchor */}
      <div className="bg-paper p-4 rounded-control border border-line/70 mb-4">
        <div className="flex items-baseline space-x-1.5">
          <span className="font-display text-display-xl text-moss-700 font-bold tabular-nums">
            −<AnimatedCounter value={26} duration={900} />
          </span>
          <span className="font-display text-2xl text-ink font-semibold">kg</span>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          Food surplus that would be averted with portion adjustments
        </p>
      </div>

      {/* Before vs After Ledger Comparison */}
      <div className="space-y-1 font-mono text-xs">
        <div className="flex justify-between pb-1.5 text-ink-muted font-bold uppercase border-b border-line text-[10px] tracking-wider">
          <span>Metric</span>
          <div className="flex space-x-6 text-right">
            <span className="w-16">Lean Plan</span>
            <span className="w-20 text-moss-800">Low-Waste</span>
          </div>
        </div>

        <div className="flex justify-between items-baseline py-1.5 border-b border-line/40">
          <span className="text-ink">Food Surplus</span>
          <div className="flex space-x-6 text-right tabular-nums">
            <span className="w-16 text-ink-muted">34 kg</span>
            <span className="w-20 font-bold text-moss-800">8 kg (−26)</span>
          </div>
        </div>

        <div className="flex justify-between items-baseline py-1.5 border-b border-line/40">
          <span className="text-ink">Single-Use Disposables</span>
          <div className="flex space-x-6 text-right tabular-nums">
            <span className="w-16 text-ink-muted">620 items</span>
            <span className="w-20 font-bold text-moss-800">90 items</span>
          </div>
        </div>

        <div className="flex justify-between items-baseline py-2 double-rule-top double-rule-bottom font-semibold">
          <span className="text-ink">Total Spend</span>
          <div className="flex space-x-6 text-right tabular-nums">
            <span className="w-16 text-ink">₹42,500</span>
            <span className="w-20 text-ink font-bold">₹46,800</span>
          </div>
        </div>

        <div className="flex justify-between items-baseline pt-1.5 text-[11px] text-ink-muted">
          <span>Budget Ceiling</span>
          <span className="font-bold text-ink tabular-nums">
            ₹50,000 (Within limit)
          </span>
        </div>
      </div>

      {/* Conditional Organizer Note */}
      <MarginNote type="note" label="Organizer Note" className="mt-4">
        With ₹4,300 allocated toward washable thalis and compostable bin liners,
        this hackathon would eliminate 530 disposables without breaking the ceiling.
      </MarginNote>
    </GlassPanel>
  );
};
