import React from "react";
import { Recycle } from "lucide-react";
import { WastePlanResponse } from "../../../types/waste";
import { AnimatedCounter } from "../../common/AnimatedCounter";
import { WasteItemRow } from "./WasteItemRow";

export interface WasteResultsSectionProps {
  response: WastePlanResponse;
  isFoodSelected: boolean;
  isDisposableSelected: boolean;
  isPlasticSelected: boolean;
  isOtherSelected: boolean;
}

export const WasteResultsSection: React.FC<WasteResultsSectionProps> = ({
  response,
  isFoodSelected,
  isDisposableSelected,
  isPlasticSelected,
  isOtherSelected,
}) => {
  return (
    <div className="space-y-6 pt-6 border-t border-line">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Estimated Event Waste
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Summary of waste estimates based on your selected categories.
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider ${
            response.status === "COMPLETE"
              ? "bg-moss-100 text-moss-800 border border-moss-300"
              : response.status === "PARTIAL"
                ? "bg-paper-inset text-ink border border-line"
                : "bg-clay-100 text-clay-900 border border-clay-300"
          }`}
        >
          {response.status === "COMPLETE"
            ? "Complete Estimate"
            : response.status === "PARTIAL"
              ? "Partial Estimate"
              : "Estimate Blocked"}
        </span>
      </div>

      {/* Results Cards for Selected Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Food Waste Metric */}
        {isFoodSelected && (
          <div className="p-4 rounded-sheet bg-paper-raised border border-line shadow-subtle">
            <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wide block">
              Food Waste
            </span>
            <div className="mt-2 font-mono tabular-nums">
              {response.food_waste?.planning_servings != null ? (
                <div>
                  <AnimatedCounter
                    className="text-2xl font-display font-bold text-ink"
                    value={Number(response.food_waste.planning_servings)}
                  />
                  <span className="text-xs font-semibold text-ink-muted ml-1 font-sans">
                    servings
                  </span>
                  {response.food_waste.estimated_kg != null && (
                    <AnimatedCounter
                      className="block text-xs font-medium text-moss-700 mt-1 font-mono"
                      prefix="Approx. "
                      value={Number(response.food_waste.estimated_kg)}
                      suffix=" kg"
                      decimals={1}
                    />
                  )}
                </div>
              ) : (
                <span className="text-xs text-ink-faint italic font-sans">
                  Estimate unavailable
                </span>
              )}
            </div>
          </div>
        )}

        {/* Disposable Items Metric */}
        {isDisposableSelected && (
          <div className="p-4 rounded-sheet bg-paper-raised border border-line shadow-subtle">
            <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wide block">
              Disposable Items
            </span>
            <div className="mt-2 font-mono tabular-nums">
              {response.packaging_waste.total_items != null ? (
                <div>
                  <AnimatedCounter
                    className="text-2xl font-display font-bold text-ink"
                    value={Number(response.packaging_waste.total_items)}
                  />
                  <span className="text-xs font-semibold text-ink-muted ml-1 font-sans">
                    items
                  </span>
                  {response.packaging_waste.reusable_percentage != null && (
                    <span className="block text-xs font-bold text-moss-700 mt-1">
                      <AnimatedCounter
                        value={Number(
                          response.packaging_waste.reusable_percentage,
                        )}
                        suffix="% reusable"
                        decimals={0}
                      />
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-ink-faint italic font-sans">
                  Estimate unavailable
                </span>
              )}
            </div>
          </div>
        )}

        {/* Plastic Waste Metric */}
        {isPlasticSelected && (
          <div className="p-4 rounded-sheet bg-paper-raised border border-line shadow-subtle">
            <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wide block">
              Plastic Waste
            </span>
            <div className="mt-2 font-mono tabular-nums">
              {response.plastic_waste.total_planning_items != null ? (
                <div>
                  <AnimatedCounter
                    className="text-2xl font-display font-bold text-ink"
                    value={Number(
                      response.plastic_waste.total_planning_items,
                    )}
                  />
                  <span className="text-xs font-semibold text-ink-muted ml-1 font-sans">
                    items
                  </span>
                </div>
              ) : (
                <span className="text-xs text-ink-faint italic font-sans">
                  Estimate unavailable
                </span>
              )}
            </div>
          </div>
        )}

        {/* Other Waste Metric */}
        {isOtherSelected && (
          <div className="p-4 rounded-sheet bg-paper-raised border border-line shadow-subtle">
            <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wide block">
              Other Waste
            </span>
            <div className="mt-2 font-mono tabular-nums">
              {response.other_waste.total_items != null ? (
                <div>
                  <AnimatedCounter
                    className="text-2xl font-display font-bold text-ink"
                    value={Number(response.other_waste.total_items)}
                  />
                  <span className="text-xs font-semibold text-ink-muted ml-1 font-sans">
                    items
                  </span>
                </div>
              ) : (
                <span className="text-xs text-ink-faint italic font-sans">
                  Estimate unavailable
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Itemized Waste Breakdown using WasteItemRow */}
      {((response.packaging_waste?.items &&
        response.packaging_waste.items.length > 0) ||
        (response.plastic_waste?.items &&
          response.plastic_waste.items.length > 0) ||
        (response.other_waste?.items &&
          response.other_waste.items.length > 0)) && (
        <div className="pt-4 border-t border-line space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-kicker block">Itemized Item Ledger</span>
              <h3 className="font-display text-base font-semibold text-ink">
                Disposables & Packaging Items
              </h3>
            </div>
            <span className="text-xs font-mono text-ink-muted">
              Physical units & reusable split
            </span>
          </div>

          <div className="bg-paper-raised border border-line rounded-sheet p-3 space-y-1">
            {response.packaging_waste?.items?.map((item, idx) => (
              <WasteItemRow
                key={`pkg-${idx}`}
                name={item.item_name}
                itemType={item.item_type}
                totalQuantity={Number(item.total_quantity) || 0}
                reusableQuantity={Number(item.reusable_quantity) || 0}
                singleUseQuantity={Number(item.single_use_quantity) || 0}
                explanation={item.explanation}
              />
            ))}

            {response.plastic_waste?.items?.map((item, idx) => (
              <WasteItemRow
                key={`plastic-${idx}`}
                name={item.item_name}
                itemType={item.item_type}
                totalQuantity={
                  Number(item.planning_quantity ?? item.estimated_quantity) || 0
                }
                singleUseQuantity={
                  Number(item.planning_quantity ?? item.estimated_quantity) || 0
                }
                explanation={item.explanation}
              />
            ))}

            {response.other_waste?.items?.map((item, idx) => (
              <WasteItemRow
                key={`other-${idx}`}
                name={item.name}
                itemType={item.category}
                totalQuantity={Number(item.quantity) || 0}
                unit={item.unit}
                explanation={item.explanation}
              />
            ))}
          </div>
        </div>
      )}

      {/* Waste Reduction Recommendations */}
      {response.recommendations.length > 0 && (
        <div className="p-5 rounded-sheet border border-line bg-paper-inset/30 space-y-3">
          <div className="flex items-center space-x-2">
            <Recycle className="w-4 h-4 text-moss-700" />
            <h3 className="text-sm font-semibold text-ink">
              Waste Reduction Recommendations
            </h3>
          </div>

          <div className="space-y-2.5">
            {response.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3.5 rounded-control bg-paper-raised border border-line text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <strong className="font-semibold text-ink">
                    {rec.title}
                  </strong>
                  <span className="px-2 py-0.5 rounded-full bg-moss-100 text-moss-800 text-[10px] font-bold border border-moss-200 font-mono">
                    {rec.impact}
                  </span>
                </div>
                <p className="text-ink-muted">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
