import { FoodPlanRequest } from "./food";
import { ResolvedAssumption } from "./assumptions";

export type CalculationBasis =
  "PER_PERSON" | "PER_MEAL" | "PER_EVENT" | "CUSTOM";

export type PackagingItemType =
  "PLATE" | "CUP" | "SPOON" | "FORK" | "GLASS" | "OTHER";

export const PACKAGING_TYPE_OPTIONS: {
  value: PackagingItemType;
  label: string;
}[] = [
  { value: "PLATE", label: "Plate" },
  { value: "CUP", label: "Cup" },
  { value: "SPOON", label: "Spoon" },
  { value: "FORK", label: "Fork" },
  { value: "GLASS", label: "Glass" },
  { value: "OTHER", label: "Other Item" },
];

export type PlasticItemType =
  "WATER_BOTTLE" | "PLASTIC_BAG" | "WRAPPER" | "PLASTIC_CUP" | "OTHER";

export const PLASTIC_TYPE_OPTIONS: { value: PlasticItemType; label: string }[] =
  [
    { value: "WATER_BOTTLE", label: "Water Bottle" },
    { value: "PLASTIC_BAG", label: "Plastic Bag" },
    { value: "WRAPPER", label: "Wrapper" },
    { value: "PLASTIC_CUP", label: "Plastic Cup" },
    { value: "OTHER", label: "Other Plastic" },
  ];

export type OtherWasteCategory =
  | "DECORATIONS"
  | "BROKEN_ITEMS"
  | "MIXED_WASTE"
  | "FOOD_CONTAINERS"
  | "OTHER"
  | "CUSTOM";

export const OTHER_WASTE_OPTIONS: {
  value: OtherWasteCategory;
  label: string;
}[] = [
  { value: "DECORATIONS", label: "Decorations" },
  { value: "BROKEN_ITEMS", label: "Broken Items" },
  { value: "MIXED_WASTE", label: "Mixed Waste" },
  { value: "FOOD_CONTAINERS", label: "Food Containers" },
  { value: "OTHER", label: "Other" },
];

export type WasteSourceType =
  "USER_PROVIDED" | "ESTIMATED" | "REFERENCE" | "ACTUAL" | "ML_PREDICTED";

export interface FoodWasteInput {
  food_plan_request?: FoodPlanRequest | null;
  estimated_food_waste_servings?: string | number | null;
  estimated_food_waste_kg?: string | number | null;
  user_override_servings?: string | number | null;
}

export interface PackagingItemInput {
  item_type: PackagingItemType;
  custom_name?: string | null;
  calculation_basis: CalculationBasis;
  units_per_basis?: string | number | null;
  meals_count?: number | null;
  user_total_quantity?: string | number | null;
  user_reusable_quantity?: string | number | null;
  user_single_use_quantity?: string | number | null;
}

export interface PlasticItemInput {
  item_type: PlasticItemType;
  custom_name?: string | null;
  calculation_basis: CalculationBasis;
  units_per_basis?: string | number | null;
  meals_count?: number | null;
  user_override_quantity?: string | number | null;
  participation_rate?: string | number | null;
}

export interface OtherWasteItemInput {
  name: string;
  category: OtherWasteCategory;
  calculation_basis: CalculationBasis;
  quantity?: string | number | null;
  unit: string;
  units_per_basis?: string | number | null;
}

export interface WastePlanRequest {
  event_id: number;
  attendee_count?: number | null;
  meals_count?: number | null;
  food_waste?: FoodWasteInput | null;
  packaging_items: PackagingItemInput[];
  plastic_items: PlasticItemInput[];
  other_waste_items: OtherWasteItemInput[];
}

export interface FoodWasteResult {
  estimated_servings?: string | number | null;
  estimated_kg?: string | number | null;
  user_override_servings?: string | number | null;
  planning_servings?: string | number | null;
  planning_source?: WasteSourceType | null;
  explanation: string;
}

export interface PackagingItemResult {
  item_name: string;
  item_type: PackagingItemType;
  calculation_basis: CalculationBasis;
  total_quantity?: string | number | null;
  reusable_quantity?: string | number | null;
  single_use_quantity?: string | number | null;
  is_split_resolved: boolean;
  source_type?: WasteSourceType | null;
  explanation: string;
}

export interface PackagingWasteSummary {
  total_items?: string | number | null;
  total_reusable_items?: string | number | null;
  total_single_use_items?: string | number | null;
  reusable_percentage?: string | number | null;
  items: PackagingItemResult[];
}

export interface PlasticItemResult {
  item_name: string;
  item_type: PlasticItemType;
  calculation_basis: CalculationBasis;
  estimated_quantity?: string | number | null;
  user_override_quantity?: string | number | null;
  planning_quantity?: string | number | null;
  source_type?: WasteSourceType | null;
  explanation: string;
}

export interface PlasticWasteSummary {
  total_planning_items?: string | number | null;
  items: PlasticItemResult[];
}

export interface OtherWasteItemResult {
  name: string;
  category: OtherWasteCategory;
  calculation_basis: CalculationBasis;
  quantity?: string | number | null;
  unit: string;
  source_type?: WasteSourceType | null;
  explanation: string;
}

export interface OtherWasteSummary {
  total_items?: string | number | null;
  items: OtherWasteItemResult[];
}

export interface WasteRecommendation {
  code: string;
  title: string;
  description: string;
  reason: string;
  impact: string;
}

export interface WastePlanResponse {
  event_id: number;
  event_name: string;
  event_type: string;
  expected_attendees: number;
  status: string;
  food_waste?: FoodWasteResult | null;
  packaging_waste: PackagingWasteSummary;
  plastic_waste: PlasticWasteSummary;
  other_waste: OtherWasteSummary;
  recommendations: WasteRecommendation[];
  assumptions_used: ResolvedAssumption[];
  missing_assumptions: string[];
  warnings: string[];
}
