import {
  PackagingItemInput,
  PlasticItemInput,
  OtherWasteItemInput,
} from "../../../types/waste";

// Human-readable labels for backend assumption parameters
export const PARAMETER_LABEL_MAP: Record<string, string> = {
  packaging_plate_per_person: "Plates needed per attendee",
  packaging_cup_per_person: "Cups needed per attendee",
  packaging_spoon_per_person: "Spoons needed per attendee",
  packaging_fork_per_person: "Forks needed per attendee",
  packaging_glass_per_person: "Glasses needed per attendee",
  packaging_other_per_person: "Other packaging per attendee",
  packaging_plate_per_meal: "Plates needed per meal",
  packaging_cup_per_meal: "Cups needed per meal",
  packaging_spoon_per_meal: "Spoons needed per meal",
  packaging_fork_per_meal: "Forks needed per meal",
  packaging_glass_per_meal: "Glasses needed per meal",
  packaging_plate_per_event: "Plates needed per event",
  packaging_cup_per_event: "Cups needed per event",
  reusable_ratio_plate: "Reusable plates ratio",
  reusable_ratio_cup: "Reusable cups ratio",
  reusable_ratio_spoon: "Reusable spoons ratio",
  reusable_ratio_fork: "Reusable forks ratio",
  reusable_ratio_glass: "Reusable glasses ratio",
  reusable_ratio_other: "Reusable packaging ratio",
  single_use_ratio_plate: "Single-use plates ratio",
  single_use_ratio_cup: "Single-use cups ratio",
  single_use_ratio_spoon: "Single-use spoons ratio",
  single_use_ratio_fork: "Single-use forks ratio",
  single_use_ratio_glass: "Single-use glasses ratio",
  plastic_water_bottle_per_person: "Water bottles per attendee",
  plastic_plastic_bag_per_person: "Plastic bags per attendee",
  plastic_wrapper_per_person: "Wrappers per attendee",
  plastic_plastic_cup_per_person: "Plastic cups per attendee",
  plastic_other_per_person: "Other plastic items per attendee",
  plastic_water_bottle_per_meal: "Water bottles per meal",
  food_waste_percentage: "Food waste rate",
  food_serving_weight_kg_default: "Average meal portion weight",
  other_decorations_per_event: "Decorations needed per event",
  decorations_per_event: "Decorations needed per event",
  other_containers_per_event: "Food containers needed per event",
  containers_per_event: "Food containers needed per event",
};

export const getHumanReadableParameter = (param: string): string => {
  if (PARAMETER_LABEL_MAP[param]) {
    return PARAMETER_LABEL_MAP[param];
  }
  return param
    .replace(/^packaging_|^plastic_|^other_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const formatSourceType = (
  sourceType?: string | null,
): { label: string; isUser: boolean } => {
  if (!sourceType) return { label: "Configured estimate", isUser: false };
  const s = sourceType.toUpperCase();
  if (s === "USER_PROVIDED" || s.includes("USER")) {
    return { label: "Your entered value", isUser: true };
  }
  if (s.includes("REFERENCE")) {
    return { label: "Campus reference benchmark", isUser: false };
  }
  if (s.includes("ACTUAL")) {
    return { label: "Historical event measurement", isUser: false };
  }
  if (s.includes("ML") || s.includes("MODEL")) {
    return { label: "Model estimate", isUser: false };
  }
  return { label: "Configured benchmark estimate", isUser: false };
};

export const formatAssumptionValue = (
  param: string,
  value?: string | null,
  unit?: string | null,
): string => {
  if (value == null || value === "") return "Not set";
  const num = Number(value);
  if (!isNaN(num)) {
    if (
      unit === "ratio" ||
      param.includes("rate") ||
      param.includes("percentage") ||
      param.includes("ratio")
    ) {
      const pct = num <= 1 ? Math.round(num * 100) : Math.round(num);
      return `${pct}%`;
    }
    if (unit) {
      return `${num} ${unit}`;
    }
    return String(num);
  }
  return String(value);
};

export const DEFAULT_DISPOSABLE_ITEMS: PackagingItemInput[] = [
  { item_type: "PLATE", calculation_basis: "PER_PERSON" },
  { item_type: "CUP", calculation_basis: "PER_PERSON" },
];

export const DEFAULT_PLASTIC_ITEMS: PlasticItemInput[] = [
  { item_type: "WATER_BOTTLE", calculation_basis: "PER_PERSON" },
];

export const DEFAULT_OTHER_ITEMS: OtherWasteItemInput[] = [
  {
    name: "Decorations",
    category: "DECORATIONS",
    calculation_basis: "PER_EVENT",
    unit: "items",
  },
  {
    name: "Containers",
    category: "FOOD_CONTAINERS",
    calculation_basis: "PER_EVENT",
    unit: "items",
  },
];
