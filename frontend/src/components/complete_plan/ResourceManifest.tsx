import React from "react";
import {
  PackageCheck,
  UtensilsCrossed,
  Sparkles,
  Recycle,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { ResourceManifest as ResourceManifestType } from "../../types/completePlan";

interface ResourceManifestProps {
  manifest: ResourceManifestType;
}

const formatEstimate = (
  val: string | number | null | undefined,
  unit: string = "",
): string => {
  if (val === null || val === undefined || val === "") {
    return "— Not estimated";
  }
  const numeric = typeof val === "number" ? val : Number(val);
  if (isNaN(numeric)) {
    return String(val);
  }
  return unit
    ? `${numeric.toLocaleString()} ${unit}`
    : numeric.toLocaleString();
};

export const ResourceManifest: React.FC<ResourceManifestProps> = ({
  manifest,
}) => {
  const food = manifest?.food_and_catering;
  const tableware = manifest?.tableware_and_serving;
  const plastic = manifest?.plastic_items;
  const equipment = manifest?.suggested_equipment || [];

  return (
    <div className="surface-sheet p-5 sm:p-8 mb-8 border border-line">
      {/* Header */}
      <div className="pb-6 mb-6 border-b border-line">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-paper-inset text-moss-800 text-xs font-semibold tracking-wide uppercase mb-2 border border-line">
          <PackageCheck className="w-3.5 h-3.5 text-moss-600" />
          <span>Operational Resources</span>
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Resource & Material Requirements
        </h2>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          Detailed estimates for catering, tableware, and plastics, separated
          from suggested equipment requiring confirmation.
        </p>
      </div>

      {/* 3 Metric Groups for Quantities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Food & Catering */}
        <div className="p-5 rounded-sheet bg-clay-50/60 border border-clay-200 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center space-x-2 text-clay-900 font-bold text-sm mb-3">
              <UtensilsCrossed className="w-4 h-4 text-clay-700" />
              <span>Catering & Food Portions</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-clay-200/60">
                <span className="text-ink-muted">Total Servings:</span>
                <span className="font-mono font-bold text-ink">
                  {formatEstimate(food?.estimated_servings, "portions")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-clay-200/60">
                <span className="text-ink-muted">Vegetarian Portions:</span>
                <span className="font-mono font-semibold text-ink">
                  {formatEstimate(food?.veg_servings, "portions")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-clay-200/60">
                <span className="text-ink-muted">Non-Veg Portions:</span>
                <span className="font-mono font-semibold text-ink">
                  {formatEstimate(food?.non_veg_servings, "portions")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-ink-muted">Expected Food Waste:</span>
                <span className="font-mono font-bold text-clay-700">
                  {formatEstimate(food?.estimated_food_waste_kg, "kg")}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-clay-200/60 text-[11px] text-clay-800/80 italic">
            Provenance:{" "}
            {food?.provenance || "Calculated from planning assumptions"}
          </div>
        </div>

        {/* Tableware & Serving Items */}
        <div className="p-5 rounded-sheet bg-moss-50/60 border border-moss-200 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center space-x-2 text-moss-900 font-bold text-sm mb-3">
              <Recycle className="w-4 h-4 text-moss-700" />
              <span>Tableware & Serving Items</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-moss-200/60">
                <span className="text-ink-muted">Reusable Items:</span>
                <span className="font-mono font-bold text-moss-700">
                  {formatEstimate(tableware?.reusable_items, "items")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-moss-200/60">
                <span className="text-ink-muted">Single-use Items:</span>
                <span className="font-mono font-semibold text-ink">
                  {formatEstimate(tableware?.single_use_items, "items")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-ink-muted">Reusable Ratio:</span>
                <span className="font-mono font-bold text-moss-800">
                  {tableware?.reusable_percentage !== null &&
                  tableware?.reusable_percentage !== undefined &&
                  tableware?.reusable_percentage !== ""
                    ? `${Math.round(Number(tableware.reusable_percentage))}%`
                    : "— Not estimated"}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-moss-200/60 text-[11px] text-moss-800/80 italic">
            Provenance:{" "}
            {tableware?.provenance || "Calculated from planning assumptions"}
          </div>
        </div>

        {/* Plastic Items */}
        <div className="p-5 rounded-sheet bg-paper-inset/40 border border-line flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center space-x-2 text-ink font-bold text-sm mb-3">
              <Trash2 className="w-4 h-4 text-ink-muted" />
              <span>Single-use Plastics</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-line/60">
                <span className="text-ink-muted">Plastic Items:</span>
                <span className="font-mono font-bold text-ink">
                  {formatEstimate(plastic?.estimated_plastic_items, "items")}
                </span>
              </div>
              {plastic?.description && (
                <p className="text-[11px] text-ink-muted py-1 leading-relaxed">
                  {plastic.description}
                </p>
              )}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-line/60 text-[11px] text-ink-muted italic">
            Provenance:{" "}
            {plastic?.provenance || "Calculated from planning assumptions"}
          </div>
        </div>
      </div>

      {/* Suggested Equipment Section (Strictly Separated as Suggestions) */}
      <div className="pt-4 border-t border-line">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-moss-600" />
            <h3 className="font-serif text-sm sm:text-base font-bold text-ink">
              Suggested Equipment & Facility Stations (Requires Venue
              Confirmation)
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-paper-inset text-ink-muted text-[10px] font-bold uppercase font-mono border border-line">
            {equipment.length} suggestions
          </span>
        </div>

        <div className="mb-4 p-3.5 rounded-xl bg-clay-50 border border-clay-300 text-xs text-clay-950 flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-clay-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-clay-900">
              Confirmation Required:
            </strong>{" "}
            The equipment and stations listed below are recommendations based on
            your selected plan. They are <strong>not pre-booked</strong> or
            guaranteed. Please verify availability with your campus or venue
            coordinator.
          </div>
        </div>

        {equipment.length === 0 ? (
          <p className="text-xs text-ink-muted italic py-2">
            No specific facility equipment suggested for this plan.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map((eq, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-line bg-paper-raised hover:border-moss-400 transition-all text-xs space-y-1.5 shadow-xs card-hover"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif font-bold text-ink text-sm">
                    {eq.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-paper-inset text-ink-muted font-bold text-[10px] uppercase tracking-wider flex-shrink-0 border border-line">
                    {eq.category.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-moss-700 font-mono font-bold">
                  Quantity: {eq.suggested_quantity}
                </div>
                {eq.notes && (
                  <p className="text-ink-muted text-[11px] leading-relaxed">
                    {eq.notes}
                  </p>
                )}
                <div className="pt-1 flex items-center space-x-1 text-[10px] text-clay-700 font-semibold">
                  <span>• Unconfirmed suggestion</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
