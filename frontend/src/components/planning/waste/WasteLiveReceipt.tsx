import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { AnimatedCounter } from "../../common/AnimatedCounter";
import { LedgerRow } from "../../common/LedgerTable";
import { GlassPanel } from "../../common/GlassPanel";

interface WasteLiveReceiptProps {
  totalItems: number;
  totalSingleUse: number;
  totalReusable: number;
  reusablePercent: number;
  foodWasteKg: number;
  isCalculated: boolean;
}

export const WasteLiveReceipt: React.FC<WasteLiveReceiptProps> = ({
  totalItems,
  totalSingleUse,
  totalReusable,
  reusablePercent,
  foodWasteKg,
  isCalculated,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  return (
    <>
      {/* Desktop Sticky Column with Glass Styling */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <GlassPanel variant="strong" className="sticky top-20 p-5 space-y-4 shadow-subtle">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <span className="label-kicker">Live Waste Ledger</span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-control bg-paper-inset text-ink-muted border border-line/60">
              {isCalculated ? "Engine Verified" : "Live Estimate"}
            </span>
          </div>

          <div aria-live="polite" className="space-y-3 font-mono text-xs">
            {/* Total items tally */}
            <div className="bg-paper/90 p-3 rounded-control border border-line/60">
              <span className="text-[11px] text-ink-muted uppercase block mb-0.5">
                Total Planned Items
              </span>
              <div className="flex items-baseline space-x-1 text-ink font-bold text-2xl font-mono tabular-nums">
                <AnimatedCounter value={totalItems} duration={500} />
                <span className="text-sm font-sans font-normal ml-0.5">items</span>
              </div>
              <span className="text-[10px] text-ink-muted mt-0.5 block font-sans">
                Packaging dishware and plastic disposables
              </span>
            </div>

            {/* Reusable vs Single-Use split */}
            <div className="bg-paper/90 p-3 rounded-control border border-line/60 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-ink-muted uppercase">
                  Reusable Ratio
                </span>
                <span className="font-bold text-moss-800 text-sm tabular-nums">
                  {reusablePercent}% reusable
                </span>
              </div>

              {/* Ruled split bar */}
              <div className="h-2 w-full bg-paper-inset border border-line-strong flex overflow-hidden">
                <div
                  className="h-full bg-moss-700 transition-all duration-300"
                  style={{ width: `${reusablePercent}%` }}
                />
                <div
                  className="h-full bg-clay-700 transition-all duration-300"
                  style={{ width: `${100 - reusablePercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-ink-muted pt-0.5">
                <span className="text-moss-800 font-semibold">{totalReusable} reusable</span>
                <span className="text-clay-800 font-semibold">{totalSingleUse} single-use</span>
              </div>
            </div>

            {/* Food waste mass */}
            {foodWasteKg > 0 && (
              <div className="bg-paper/90 p-3 rounded-control border border-line/60">
                <span className="text-[11px] text-ink-muted uppercase block mb-0.5">
                  Solid Food Waste
                </span>
                <div className="flex items-baseline space-x-1 text-moss-800 font-bold text-2xl font-mono tabular-nums">
                  <AnimatedCounter value={Math.round(foodWasteKg)} duration={500} />
                  <span className="text-sm font-sans font-normal ml-0.5">kg</span>
                </div>
                <span className="text-[10px] text-ink-muted mt-0.5 block font-sans">
                  From scheduled meals & catering buffers
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-ink-muted leading-relaxed font-sans pt-1 border-t border-line/50">
            Every item eliminated saves direct disposal weight and haulage costs.
          </p>
        </GlassPanel>
      </aside>

      {/* Mobile Expanding Glass Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-strong border-t border-line shadow-modal">
        <button
          type="button"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none"
          aria-expanded={mobileExpanded}
        >
          <div aria-live="polite" className="flex items-baseline space-x-3 font-mono text-xs">
            <span className="font-bold text-ink">
              <AnimatedCounter value={totalItems} duration={400} /> items
            </span>
            <span className="text-ink-muted">·</span>
            <span className="text-moss-800 font-bold">
              {reusablePercent}% reusable
            </span>
          </div>

          <div className="flex items-center space-x-1 text-xs font-mono text-ink-muted">
            <span>{mobileExpanded ? "Hide" : "Details"}</span>
            {mobileExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        {mobileExpanded && (
          <div className="p-4 pt-1 border-t border-line space-y-2 font-mono text-xs bg-paper/95">
            <LedgerRow
              label="Total Planned Items"
              value={`${totalItems} items`}
            />
            <LedgerRow
              label="Washable Reusables"
              value={`${totalReusable} items (${reusablePercent}%)`}
              deltaType="moss"
            />
            <LedgerRow
              label="Single-Use Disposables"
              value={`${totalSingleUse} items`}
              deltaType="clay"
            />
            {foodWasteKg > 0 && (
              <LedgerRow
                isTotal
                label="Food Waste Mass"
                value={`${foodWasteKg} kg`}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
};
