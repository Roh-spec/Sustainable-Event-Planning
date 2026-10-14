/**
 * Sustainability Metric Formatting Utilities
 *
 * Provides contract-compliant, mathematically sound formatting for
 * sustainability indicators, currency, packaging metrics, plain-language
 * assumption translation, and friendly provenance labels.
 */

import { WasteMetrics } from "../types/planning";

/**
 * Formats currency values in Indian Rupees (INR) or specified currency.
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  currency: string = "INR",
): string => {
  if (amount === null || amount === undefined || amount === "") {
    return "Not estimated";
  }
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(numeric)) {
    return "Not estimated";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

/**
 * Derives and formats the reusable packaging percentage safely.
 *
 * Backend contract:
 * - Waste calculator calculates: (total_reusable / total_packaging) * 100 (Decimal, 0 to 100).
 * - Or numerator and denominator may be provided directly.
 *
 * Defect prevention:
 * - Never multiplies an already-calculated 0-100 percentage by 100 (which previously caused 40% -> 4000%).
 * - If only raw ratio (0 to 1) is passed (e.g. from legacy mocks), scales once by 100.
 * - If valid numerator and denominator exist, derives mathematically: (reusable / total) * 100.
 * - Rejects invalid percentages (> 100% or < 0%).
 * - If data is insufficient to compute a valid percentage, returns undefined so the UI
 *   can display item counts without an invalid or fabricated percentage badge.
 */
export const formatReusablePercentage = (
  metrics?: WasteMetrics | null,
): string | undefined => {
  if (!metrics) return undefined;

  const reusable =
    metrics.reusable_packaging_items !== null &&
    metrics.reusable_packaging_items !== undefined &&
    metrics.reusable_packaging_items !== ""
      ? Number(metrics.reusable_packaging_items)
      : null;

  const total =
    metrics.total_packaging_items !== null &&
    metrics.total_packaging_items !== undefined &&
    metrics.total_packaging_items !== ""
      ? Number(metrics.total_packaging_items)
      : null;

  // 1. If valid numerator and denominator are available, compute directly
  if (
    reusable !== null &&
    !isNaN(reusable) &&
    total !== null &&
    !isNaN(total) &&
    total > 0
  ) {
    const computed = (reusable / total) * 100;
    if (computed >= 0 && computed <= 100) {
      return `${Math.round(computed)}%`;
    }
  }

  // 2. Fall back to reusable_percentage field if present
  if (
    metrics.reusable_percentage !== null &&
    metrics.reusable_percentage !== undefined &&
    metrics.reusable_percentage !== ""
  ) {
    const raw = Number(metrics.reusable_percentage);
    if (!isNaN(raw)) {
      // Backend returns 0 to 100 (e.g. 40.0 for 40%)
      if (raw > 1 && raw <= 100) {
        return `${Math.round(raw)}%`;
      }
      // Legacy ratio or decimal mock (0 to 1.0, e.g. 0.75 for 75%)
      if (raw >= 0 && raw <= 1) {
        return `${Math.round(raw * 100)}%`;
      }
    }
  }

  return undefined;
};

/**
 * Known parameter dictionary mapping technical backend keys to plain-language descriptions.
 */
const KNOWN_ASSUMPTION_TITLES: Record<string, string> = {
  food_waste_percentage: "Expected leftover food",
  food_serving_weight_kg_default: "Assumed serving weight",
  food_servings_per_attendee: "Food servings per attendee",
  catering_service_style: "Catering service style",
  packaging_plate_per_person: "Plates estimated per attendee",
  packaging_cup_per_person: "Cups estimated per attendee",
  packaging_spoon_per_person: "Spoons estimated per attendee",
  packaging_fork_per_person: "Forks estimated per attendee",
  packaging_glass_per_person: "Glasses estimated per attendee",
  packaging_other_per_person: "Packaging estimated per attendee",
  reusable_ratio_plate: "Estimated share of reusable plates",
  reusable_ratio_cup: "Estimated share of reusable cups",
  reusable_ratio_spoon: "Estimated share of reusable spoons",
  reusable_ratio_fork: "Estimated share of reusable forks",
  reusable_ratio_glass: "Estimated share of reusable glasses",
  reusable_ratio_other: "Estimated share of reusable packaging",
  plastic_water_bottle_per_person: "Plastic bottles estimated per attendee",
  plastic_soda_bottle_per_person: "Beverage bottles estimated per attendee",
  plastic_cup_per_person: "Plastic cups estimated per attendee",
  plastic_straw_per_person: "Plastic straws estimated per attendee",
  cost_per_serving_inr: "Assumed meal cost per attendee",
  other_decorations_per_event: "Decorations needed per event",
  decorations_per_event: "Decorations needed per event",
  other_containers_per_event: "Food containers needed per event",
  containers_per_event: "Food containers needed per event",
};

/**
 * Translates backend assumption parameter keys into human-readable descriptions.
 */
export const formatAssumptionKey = (key?: string | null): string => {
  if (!key) return "Planning Factor";
  if (KNOWN_ASSUMPTION_TITLES[key]) {
    return KNOWN_ASSUMPTION_TITLES[key];
  }
  // Generic fallback: snake_case to readable sentence
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Formats assumption values into friendly, readable text with units.
 * Converts ratios into percentages, kg into weights, and per-person rates cleanly.
 */
export const formatAssumptionValue = (
  value?: string | number | null,
  unit?: string | null,
  parameter?: string,
): string => {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }
  const num = typeof value === "number" ? value : Number(value);
  const isNumeric = !isNaN(num);
  const param = parameter || "";
  const u = (unit || "").toLowerCase();

  // 1. Ratios and Percentages
  if (
    u === "ratio" ||
    u === "percentage" ||
    param.includes("_ratio") ||
    param.includes("_percentage")
  ) {
    if (isNumeric) {
      if (num <= 1) {
        return `${Math.round(num * 100)}%`;
      }
      return `${Math.round(num)}%`;
    }
  }

  // 2. Weights in kilograms
  if (u === "kg" || u === "kg/serving" || param.includes("_kg")) {
    if (isNumeric) {
      return `${num} kg`;
    }
  }

  // 3. Per-person item counts
  if (
    u === "items/person" ||
    u === "per_person" ||
    param.includes("_per_person") ||
    param.includes("_per_attendee")
  ) {
    if (isNumeric) {
      return `${num} per attendee`;
    }
  }

  // 4. Currency
  if (u === "inr" || u === "inr/serving") {
    if (isNumeric) {
      return `₹${num.toLocaleString()}`;
    }
  }

  // 5. Fallback clean display
  if (unit && u !== "ratio" && u !== "items/person" && u !== "per_person") {
    return `${value} ${unit}`;
  }

  return `${value}`;
};

/**
 * Honest, human-readable provenance labels.
 * Never outputs raw technical enums like ASSUMED or DEFAULT.
 */
export const formatProvenanceLabel = (sourceType?: string | null): string => {
  if (!sourceType) return "Estimated from planning assumptions";
  const upper = sourceType.toUpperCase();

  if (upper.includes("USER") || upper.includes("ORGANIZER")) {
    return "Based on your input";
  }
  if (
    upper.includes("MEASURED") ||
    upper.includes("EMPIRICAL") ||
    upper.includes("HISTORICAL")
  ) {
    return "Based on previous event measurements";
  }
  return "Estimated from planning assumptions";
};
