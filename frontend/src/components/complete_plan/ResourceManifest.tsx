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
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-8 mb-8">
      {/* Header */}
      <div className="pb-6 mb-6 border-b border-slate-100">
        <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2 border border-emerald-200">
          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Operational Resources</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Resource & Material Requirements
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Detailed estimates for catering, tableware, and plastics, separated
          from suggested equipment requiring confirmation.
        </p>
      </div>

      {/* 3 Metric Groups for Quantities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Food & Catering */}
        <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-sm mb-3">
              <UtensilsCrossed className="w-4 h-4 text-amber-700" />
              <span>Catering & Food Portions</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-amber-100">
                <span className="text-slate-600">Total Servings:</span>
                <span className="font-extrabold text-slate-900">
                  {formatEstimate(food?.estimated_servings, "portions")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-amber-100">
                <span className="text-slate-600">Vegetarian Portions:</span>
                <span className="font-bold text-slate-900">
                  {formatEstimate(food?.veg_servings, "portions")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-amber-100">
                <span className="text-slate-600">Non-Veg Portions:</span>
                <span className="font-bold text-slate-900">
                  {formatEstimate(food?.non_veg_servings, "portions")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">Expected Food Waste:</span>
                <span className="font-bold text-amber-800">
                  {formatEstimate(food?.estimated_food_waste_kg, "kg")}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-amber-100 text-[11px] text-amber-900/80 italic">
            Provenance:{" "}
            {food?.provenance || "Calculated from planning assumptions"}
          </div>
        </div>

        {/* Tableware & Serving Items */}
        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-950 font-extrabold text-sm mb-3">
              <Recycle className="w-4 h-4 text-emerald-700" />
              <span>Tableware & Serving Items</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                <span className="text-slate-600">Reusable Items:</span>
                <span className="font-extrabold text-emerald-800">
                  {formatEstimate(tableware?.reusable_items, "items")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                <span className="text-slate-600">Single-use Items:</span>
                <span className="font-bold text-slate-900">
                  {formatEstimate(tableware?.single_use_items, "items")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">Reusable Ratio:</span>
                <span className="font-bold text-emerald-900">
                  {tableware?.reusable_percentage !== null &&
                  tableware?.reusable_percentage !== undefined &&
                  tableware?.reusable_percentage !== ""
                    ? `${Math.round(Number(tableware.reusable_percentage))}%`
                    : "— Not estimated"}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-emerald-100 text-[11px] text-emerald-900/80 italic">
            Provenance:{" "}
            {tableware?.provenance || "Calculated from planning assumptions"}
          </div>
        </div>

        {/* Plastic Items */}
        <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-teal-950 font-extrabold text-sm mb-3">
              <Trash2 className="w-4 h-4 text-teal-700" />
              <span>Single-use Plastics</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-teal-100">
                <span className="text-slate-600">Plastic Items:</span>
                <span className="font-extrabold text-teal-900">
                  {formatEstimate(plastic?.estimated_plastic_items, "items")}
                </span>
              </div>
              {plastic?.description && (
                <p className="text-[11px] text-slate-600 py-1">
                  {plastic.description}
                </p>
              )}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-teal-100 text-[11px] text-teal-900/80 italic">
            Provenance:{" "}
            {plastic?.provenance || "Calculated from planning assumptions"}
          </div>
        </div>
      </div>

      {/* Suggested Equipment Section (Strictly Separated as Suggestions) */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Suggested Equipment & Facility Stations (Requires Venue
              Confirmation)
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
            {equipment.length} suggestions
          </span>
        </div>

        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Confirmation Required:</strong>{" "}
            The equipment and stations listed below are recommendations based on
            your selected plan. They are <strong>not pre-booked</strong> or
            guaranteed. Please verify availability with your campus or venue
            coordinator.
          </div>
        </div>

        {equipment.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No specific facility equipment suggested for this plan.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map((eq, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 transition-all text-xs space-y-1.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {eq.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider flex-shrink-0">
                    {eq.category.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-emerald-700 font-extrabold">
                  Quantity: {eq.suggested_quantity}
                </div>
                {eq.notes && (
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    {eq.notes}
                  </p>
                )}
                <div className="pt-1 flex items-center space-x-1 text-[10px] text-amber-700 font-semibold">
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
