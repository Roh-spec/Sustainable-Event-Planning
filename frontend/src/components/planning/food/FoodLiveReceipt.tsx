import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { AnimatedCounter } from "../../common/AnimatedCounter";
import { LedgerRow } from "../../common/LedgerTable";
import { Stamp } from "../../common/Stamp";
import { GlassPanel } from "../../common/GlassPanel";

interface FoodLiveReceiptProps {
  totalCost: number;
  surplusKg: number;
  surplusServings: number;
  remainingBudget: number;
  isOverBudget: boolean;
  mealCount: number;
  attendees: number;
  currency?: string;
  isCalculated: boolean;
}

export const FoodLiveReceipt: React.FC<FoodLiveReceiptProps> = ({
  totalCost,
  surplusKg,
  surplusServings,
  remainingBudget,
  isOverBudget,
  mealCount,
  attendees,
  currency = "INR",
  isCalculated,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : "€";
  const deficitAmount = Math.abs(remainingBudget);

  return (
    <>
      {/* Desktop Sticky Column with Glass Styling */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <GlassPanel variant="strong" className="sticky top-20 p-5 space-y-4 shadow-subtle">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <span className="label-kicker">Live Catering Ledger</span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-control bg-paper-inset text-ink-muted border border-line/60">
              {isCalculated ? "Engine Verified" : "Live Estimate"}
            </span>
          </div>

          <div aria-live="polite" className="space-y-3 font-mono text-xs">
            {/* Projected Cost */}
            <div className="bg-paper/90 p-3 rounded-control border border-line/60">
              <span className="text-[11px] text-ink-muted uppercase block mb-0.5">
                Projected Catering Cost
              </span>
              <div className="flex items-baseline space-x-1 text-ink font-bold text-2xl font-mono tabular-nums">
                <span>{symbol}</span>
                <AnimatedCounter value={totalCost} duration={500} />
              </div>
              <span className="text-[10px] text-ink-muted mt-0.5 block font-sans">
                {mealCount} meal(s) · {attendees} attendees
              </span>
            </div>

            {/* Projected Surplus Waste */}
            <div className="bg-paper/90 p-3 rounded-control border border-line/60">
              <span className="text-[11px] text-ink-muted uppercase block mb-0.5">
                Projected Food Surplus
              </span>
              <div className="flex items-baseline space-x-1 text-moss-800 font-bold text-2xl font-mono tabular-nums">
                <AnimatedCounter value={Math.round(surplusKg)} duration={500} />
                <span className="text-sm font-sans font-normal ml-0.5">kg</span>
              </div>
              <span className="text-[10px] text-ink-muted mt-0.5 block font-sans">
                ~{surplusServings} unserved buffer portions
              </span>
            </div>

            {/* Budget Balance */}
            <div className="pt-2 border-t border-line/70">
              <div className="flex justify-between items-baseline py-1">
                <span className="text-ink-muted">Budget Balance</span>
                <span
                  className={`font-bold tabular-nums ${
                    isOverBudget ? "text-clay-800" : "text-moss-800"
                  }`}
                >
                  {isOverBudget ? `\u2212${symbol}${deficitAmount.toLocaleString()}` : `${symbol}${remainingBudget.toLocaleString()}`}
                </span>
              </div>

              {isOverBudget && (
                <div className="mt-2 text-center">
                  <Stamp variant="clay" thump>
                    {symbol}{deficitAmount.toLocaleString()} over ceiling
                  </Stamp>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-ink-muted leading-relaxed font-sans pt-1 border-t border-line/50">
            Physical calculations update automatically as you adjust meals, portions, and caterer pricing.
          </p>
        </GlassPanel>
      </aside>

      {/* Mobile Expanding Glass Bottom Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-line shadow-modal">
        {/* Toggle Bar */}
        <button
          type="button"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none"
          aria-expanded={mobileExpanded}
        >
          <div aria-live="polite" className="flex items-baseline space-x-3 font-mono text-xs">
            <span className="font-bold text-ink">
              {symbol}
              <AnimatedCounter value={totalCost} duration={400} />
            </span>
            <span className="text-ink-muted">·</span>
            <span className="text-moss-800 font-bold">
              <AnimatedCounter value={Math.round(surplusKg)} duration={400} /> kg surplus
            </span>
          </div>

          <div className="flex items-center space-x-1 text-xs font-mono text-ink-muted">
            <span>{mobileExpanded ? "Hide" : "Details"}</span>
            {mobileExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        {/* Expanded Drawer */}
        {mobileExpanded && (
          <div className="p-4 pt-1 border-t border-line space-y-2 font-mono text-xs bg-paper/95">
            <LedgerRow
              label="Catering Spend"
              value={`${symbol}${totalCost.toLocaleString()}`}
            />
            <LedgerRow
              label="Projected Surplus"
              value={`${surplusKg} kg (${surplusServings} portions)`}
            />
            <LedgerRow
              isTotal
              label="Remaining Ceiling"
              value={`${isOverBudget ? "\u2212" : ""}${symbol}${deficitAmount.toLocaleString()}`}
              deltaType={isOverBudget ? "clay" : "moss"}
            />
            {isOverBudget && (
              <div className="pt-2 text-center">
                <Stamp variant="clay" thump>
                  {symbol}{deficitAmount.toLocaleString()} over ceiling
                </Stamp>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
