import React from "react";
import { Coffee, Utensils, Moon, Cookie, CupSoda } from "lucide-react";
import { CupIcon } from "../../icons";
import { MealType } from "../../../types/food";

export interface MealOptionMeta {
  type: MealType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const SUPPORTED_MEAL_OPTIONS: MealOptionMeta[] = [
  {
    type: "BREAKFAST",
    label: "Breakfast",
    description: "Morning tea, coffee & breakfast items",
    icon: <Coffee className="w-5 h-5 text-amber-600" />,
  },
  {
    type: "LUNCH",
    label: "Lunch",
    description: "Midday meal for attendees",
    icon: <Utensils className="w-5 h-5 text-emerald-600" />,
  },
  {
    type: "DINNER",
    label: "Dinner",
    description: "Evening dinner service",
    icon: <Moon className="w-5 h-5 text-indigo-600" />,
  },
  {
    type: "SNACKS",
    label: "Snacks",
    description: "Finger foods & break snacks",
    icon: <Cookie className="w-5 h-5 text-orange-600" />,
  },
  {
    type: "HIGH_TEA",
    label: "High Tea",
    description: "Afternoon tea & light savories",
    icon: <CupSoda className="w-5 h-5 text-rose-600" />,
  },
  {
    type: "REFRESHMENTS",
    label: "Refreshments",
    description: "Beverages, water & light snacks",
    icon: <CupIcon className="w-5 h-5 text-moss-700" />,
  },
];

export const PARAMETER_LABEL_MAP: Record<string, string> = {
  meal_participation_rate_lunch: "Lunch attendance rate",
  meal_participation_rate_breakfast: "Breakfast attendance rate",
  meal_participation_rate_dinner: "Dinner attendance rate",
  meal_participation_rate_snacks: "Snacks attendance rate",
  meal_participation_rate_high_tea: "High tea attendance rate",
  meal_participation_rate_refreshments: "Refreshments attendance rate",
  meal_participation_rate_default: "Default meal attendance rate",
  meal_cost_per_serving_lunch: "Lunch cost per portion",
  meal_cost_per_serving_breakfast: "Breakfast cost per portion",
  meal_cost_per_serving_dinner: "Dinner cost per portion",
  meal_cost_per_serving_snacks: "Snacks cost per portion",
  meal_cost_per_serving_high_tea: "High tea cost per portion",
  meal_cost_per_serving_refreshments: "Refreshments cost per portion",
  meal_cost_per_serving_default: "Default cost per portion",
  food_waste_percentage: "Food waste rate",
  food_serving_weight_kg_default: "Average portion weight",
  food_serving_weight_kg_lunch: "Lunch portion weight",
  food_serving_weight_kg_breakfast: "Breakfast portion weight",
  food_serving_weight_kg_dinner: "Dinner portion weight",
  food_serving_weight_kg_snacks: "Snacks portion weight",
  food_serving_weight_kg_high_tea: "High tea portion weight",
  food_serving_weight_kg_refreshments: "Refreshments portion weight",
  vegetarian_ratio: "Vegetarian portion ratio",
  food_participation_attrition_buffer_rate: "Catering buffer rate",
};

export const getHumanReadableParameter = (param: string): string => {
  if (PARAMETER_LABEL_MAP[param]) {
    return PARAMETER_LABEL_MAP[param];
  }
  return param
    .replace(/^meal_/, "")
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
    return { label: "Reference benchmark", isUser: false };
  }
  if (s.includes("ACTUAL")) {
    return { label: "Campus historical data", isUser: false };
  }
  if (s.includes("ML") || s.includes("MODEL")) {
    return { label: "Model estimate", isUser: false };
  }
  return { label: "Configured estimate", isUser: false };
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
    if (unit?.toUpperCase().includes("INR")) {
      return `₹${num.toLocaleString()}`;
    }
    if (unit?.toLowerCase().includes("kg")) {
      return `${num.toFixed(2)} kg / serving`;
    }
  }
  return unit ? `${value} ${unit}` : value;
};
