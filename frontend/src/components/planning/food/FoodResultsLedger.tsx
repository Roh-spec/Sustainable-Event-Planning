import React from "react";
import { FoodPlanResponse } from "../../../types/food";
import { LedgerTable, LedgerRow } from "../../common/LedgerTable";
import { MarginNote } from "../../common/MarginNote";
import { AnimatedCounter } from "../../common/AnimatedCounter";

interface FoodResultsLedgerProps {
  response: FoodPlanResponse;
  currency?: string;
  totalBudget?: string;
}

export const FoodResultsLedger: React.FC<FoodResultsLedgerProps> = ({
  response,
  currency = "INR",
  totalBudget,
}) => {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : "€";
  const cost = Number(response.cost_summary?.estimated_total_cost) || 0;
  const wasteKg = Number(response.waste_summary?.estimated_waste_kg) || 0;
  const wasteServings = Number(response.waste_summary?.estimated_waste_servings) || 0;
  const ceiling = parseFloat(totalBudget || "") || 0;
  const isOverBudget = response.cost_summary?.is_over_budget || (ceiling > 0 && cost > ceiling);
  const variance = ceiling - cost;

  return (
    <div className="space-y-6 pt-6 border-t border-line">
      <div>
        <span className="label-kicker block mb-1">Catering Calculation Ledger</span>
        <h3 className="font-display text-2xl font-semibold text-ink">
          Domain Calculation Results
        </h3>
        <p className="text-xs text-ink-muted font-sans mt-0.5">
          Engine verified numbers based on attendance benchmarks and portion formulas.
        </p>
      </div>

      {/* Top 3 Metric Summary Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="surface-sheet p-4 bg-paper-raised border border-line">
          <span className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-1">
            Total Catering Cost
          </span>
          <div className="flex items-baseline space-x-1 font-mono text-2xl font-bold text-ink tabular-nums">
            <span>{symbol}</span>
            <AnimatedCounter value={cost} duration={600} />
          </div>
          <span className="text-[10px] text-ink-muted block mt-1">
            {response.cost_summary?.pricing_approach === "UNIT_RATE_OVERRIDE" ? "Based on custom caterer rate" : "Calculated from meal rates"}
          </span>
        </div>

        <div className="surface-sheet p-4 bg-paper-raised border border-line">
          <span className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-1">
            Projected Surplus Waste
          </span>
          <div className="flex items-baseline space-x-1 font-mono text-2xl font-bold text-moss-800 tabular-nums">
            <AnimatedCounter value={Math.round(wasteKg)} duration={600} />
            <span className="text-sm font-sans font-normal ml-0.5">kg</span>
          </div>
          <span className="text-[10px] text-ink-muted block mt-1">
            ~{wasteServings} buffer portions not consumed
          </span>
        </div>

        <div className="surface-sheet p-4 bg-paper-raised border border-line">
          <span className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-1">
            Total Meal Portions
          </span>
          <div className="flex items-baseline space-x-1 font-mono text-2xl font-bold text-ink tabular-nums">
            <AnimatedCounter value={response.total_estimated_servings} duration={600} />
            <span className="text-sm font-sans font-normal ml-0.5">servings</span>
          </div>
          <span className="text-[10px] text-ink-muted block mt-1">
            {response.total_veg_servings} veg · {response.total_non_veg_servings} non-veg
          </span>
        </div>
      </div>

      {/* Over budget stamp warning */}
      {isOverBudget && (
        <div className="p-4 bg-clay-50 border-l-2 border-clay-700 rounded-control flex items-center justify-between">
          <div>
            <span className="stamp-clay mb-1 inline-block">
              {symbol}{Math.abs(variance).toLocaleString()} OVER CEILING
            </span>
            <p className="text-xs text-clay-900 mt-1 font-sans">
              Catering expenditure exceeds your configured maximum budget limit.
            </p>
          </div>
        </div>
      )}

      {/* Per-meal itemized ledger */}
      <LedgerTable
        title="Meal Schedule Breakdown"
        subtitle="Individual service volumes, attendance multipliers, and cost projections"
      >
        {response.meal_plans.map((mp, idx) => (
          <LedgerRow
            key={idx}
            label={`${mp.name || mp.meal_type} (Day ${mp.day})`}
            sublabel={`${mp.estimated_servings || 0} portions (${mp.veg_servings || 0} veg, ${mp.non_veg_servings || 0} non-veg) · ${mp.waste_kg ? mp.waste_kg + ' kg surplus' : ''}`}
            value={mp.total_cost ? `${symbol}${Number(mp.total_cost).toLocaleString()}` : '—'}
          />
        ))}

        <LedgerRow
          isTotal
          label="Total Food Catering Expenditure"
          value={`${symbol}${cost.toLocaleString()}`}
          delta={isOverBudget ? `Over limit by ${symbol}${Math.abs(variance).toLocaleString()}` : `Within limit: ${symbol}${variance.toLocaleString()} remaining`}
          deltaType={isOverBudget ? "clay" : "moss"}
        />
      </LedgerTable>

      {/* Recommendations as MarginNotes */}
      {response.recommendations && response.recommendations.length > 0 && (
        <div className="space-y-3">
          <span className="label-kicker block">Catering Editorial Directives</span>
          {response.recommendations.map((rec) => (
            <MarginNote key={rec.code} type="note" label={rec.title}>
              <p className="font-semibold text-ink text-xs mb-0.5">{rec.description}</p>
              <p className="text-ink-muted text-[11px]">{rec.reason} {rec.impact && `· Impact: ${rec.impact}`}</p>
            </MarginNote>
          ))}
        </div>
      )}
    </div>
  );
};
