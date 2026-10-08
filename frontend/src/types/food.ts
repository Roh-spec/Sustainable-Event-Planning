import { ResolvedAssumption } from './assumptions';

export type MealType =
  | 'BREAKFAST'
  | 'LUNCH'
  | 'DINNER'
  | 'SNACKS'
  | 'HIGH_TEA'
  | 'REFRESHMENTS';

export const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACKS', label: 'Snacks' },
  { value: 'HIGH_TEA', label: 'High Tea' },
  { value: 'REFRESHMENTS', label: 'Refreshments' },
];

export type DietaryPreference = 'VEGETARIAN' | 'NON_VEGETARIAN' | 'MIXED';

export const DIETARY_PREFERENCE_OPTIONS: { value: DietaryPreference; label: string }[] = [
  { value: 'MIXED', label: 'Mixed (Vegetarian + Non-Vegetarian)' },
  { value: 'VEGETARIAN', label: 'Vegetarian Only' },
  { value: 'NON_VEGETARIAN', label: 'Non-Vegetarian' },
];

export type FoodPricingUnit = 'PER_PERSON' | 'PER_SERVING' | 'TOTAL';

export interface MealInput {
  meal_type: MealType;
  name?: string | null;
  day: number;
  dietary_preference?: DietaryPreference | null;
  attendee_count?: number | null;
  user_participation_rate?: string | number | null;
  user_servings?: number | null;
  user_unit_cost?: string | number | null;
  user_total_cost?: string | number | null;
}

export interface FoodPlanRequest {
  event_id: number;
  meals: MealInput[];
  default_dietary_preference?: DietaryPreference;
  food_budget?: string | number | null;
  known_total_cost?: string | number | null;
  known_unit_cost?: string | number | null;
  cost_pricing_unit?: FoodPricingUnit | null;
  vegetarian_ratio?: string | number | null;
}

export interface MealPlanResult {
  meal_type: MealType;
  name: string;
  day: number;
  dietary_preference: DietaryPreference;
  attendee_count: number;
  participation_rate_used?: string | number | null;
  participation_source: string;
  estimated_servings?: number | null;
  veg_servings?: number | null;
  non_veg_servings?: number | null;
  unit_cost?: string | number | null;
  total_cost?: string | number | null;
  cost_source: string;
  waste_servings?: string | number | null;
  waste_kg?: string | number | null;
}

export interface FoodCostSummary {
  estimated_total_cost?: string | number | null;
  cost_status: string;
  pricing_approach: string;
  cost_per_attendee?: string | number | null;
  breakdown_by_meal: Record<string, string | number | null>;
  food_budget?: string | number | null;
  remaining_budget?: string | number | null;
  is_over_budget?: boolean | null;
  variance_amount?: string | number | null;
}

export interface FoodWasteSummary {
  waste_status: 'COMPLETE' | 'SERVINGS_ONLY' | 'UNAVAILABLE' | string;
  estimated_waste_servings?: string | number | null;
  estimated_waste_kg?: string | number | null;
  waste_percentage_used?: string | number | null;
  serving_weight_kg_used?: string | number | null;
  waste_percentage_source?: string | null;
  serving_weight_source?: string | null;
}

export interface FoodConstraintEvaluation {
  constraint_id?: number | null;
  category: string;
  constraint_type: string;
  description: string;
  status: string;
  message: string;
}

export interface FoodRecommendation {
  code: string;
  title: string;
  description: string;
  reason: string;
  impact: string;
}

export interface FoodPlanResponse {
  event_id: number;
  event_name: string;
  event_type: string;
  expected_attendees: number;
  status: string;
  meal_plans: MealPlanResult[];
  total_estimated_servings?: number | null;
  total_veg_servings?: number | null;
  total_non_veg_servings?: number | null;
  cost_summary: FoodCostSummary;
  waste_summary: FoodWasteSummary;
  constraints_evaluation: FoodConstraintEvaluation[];
  recommendations: FoodRecommendation[];
  assumptions_used: ResolvedAssumption[];
  missing_assumptions: string[];
  warnings: string[];
}
