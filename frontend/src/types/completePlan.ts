import { EventType } from "./events";
import { MealType } from "./food";
import { PlanAlternative, PlanningModuleContext } from "./planning";
import { ResolvedAssumption } from "./assumptions";

export type ActivityType =
  | "SETUP"
  | "REGISTRATION"
  | "OPENING"
  | "KEYNOTE"
  | "SESSION"
  | "WORKSHOP"
  | "COMPETITION"
  | "ACTIVITY"
  | "MEAL"
  | "BREAK"
  | "NETWORKING"
  | "AWARDS"
  | "CLOSING"
  | "CLEANUP"
  | "TEARDOWN"
  | "OTHER";

export type ChecklistPhase =
  "BEFORE_EVENT" | "EVENT_DAY_MORNING" | "DURING_EVENT" | "AFTER_EVENT";

export type ChecklistCategory =
  | "LOGISTICS"
  | "CATERING"
  | "WASTE_MANAGEMENT"
  | "AV_EQUIPMENT"
  | "COMMUNICATIONS"
  | "SAFETY";

export interface TimetableSlot {
  slot_id: string;
  day: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  title: string;
  activity_type: ActivityType;
  description?: string | null;
  is_meal: boolean;
  meal_type?: MealType | null;
  is_sustainability_action: boolean;
  is_suggestion: boolean;
}

export interface DaySchedule {
  day_number: number;
  date: string;
  start_time: string;
  end_time: string;
  total_duration_minutes: number;
  slots: TimetableSlot[];
}

export interface ScheduleConflict {
  conflict_type: string;
  description: string;
  affected_activities: string[];
  severity: "WARNING" | "ERROR" | string;
}

export interface ChecklistItem {
  task_id: string;
  title: string;
  description?: string | null;
  phase: ChecklistPhase;
  category: ChecklistCategory;
  deadline_relative: string;
  suggested_deadline_date?: string | null;
  is_sustainability_action: boolean;
  is_suggestion: boolean;
  notes?: string | null;
}

export interface ResourceItem {
  name: string;
  suggested_quantity: string;
  category: string;
  notes?: string | null;
  is_suggestion: boolean;
}

export interface FoodResourceManifest {
  estimated_servings?: number | null;
  veg_servings?: number | null;
  non_veg_servings?: number | null;
  estimated_food_waste_kg?: string | number | null;
  description?: string | null;
  provenance: string;
}

export interface TablewareResourceManifest {
  reusable_items?: string | number | null;
  single_use_items?: string | number | null;
  reusable_percentage?: string | number | null;
  description?: string | null;
  provenance: string;
}

export interface PlasticResourceManifest {
  estimated_plastic_items?: string | number | null;
  description?: string | null;
  provenance: string;
}

export interface ResourceManifest {
  food_and_catering: FoodResourceManifest;
  tableware_and_serving: TablewareResourceManifest;
  plastic_items: PlasticResourceManifest;
  suggested_equipment: ResourceItem[];
}

export interface BudgetSummary {
  total_budget?: string | number | null;
  currency: string;
  estimated_plan_cost?: string | number | null;
  food_cost?: string | number | null;
  packaging_cost?: string | number | null;
  remaining_contingency?: string | number | null;
  is_budget_feasible: boolean;
  budget_deficit?: string | number | null;
  notes?: string | null;
}

export interface SustainabilityActionItem {
  title: string;
  action_type: string;
  description: string;
  target_metric?: string | null;
  verification_step: string;
}

export interface AssumptionsAndConfirmations {
  planning_assumptions: ResolvedAssumption[];
  items_requiring_confirmation: string[];
}

export interface EventOverview {
  event_id: number;
  name: string;
  event_type: EventType | string;
  expected_attendees: number;
  duration_days: number;
  location?: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  selected_plan_name?: string | null;
  selected_plan_objective?: string | null;
  is_feasible: boolean;
}

export interface CompletePlanRequest {
  event_id: number;
  event_date: string;
  start_time: string;
  end_time: string;
  duration_days?: number | null;
  selected_plan?: PlanAlternative | null;
  selected_meal_types?: MealType[] | null;
  include_setup_cleanup?: boolean;
  module_context?: PlanningModuleContext | null;
}

export interface CompletePlanResponse {
  event_overview: EventOverview;
  daily_timetable: DaySchedule[];
  scheduling_warnings: string[];
  scheduling_conflicts: ScheduleConflict[];
  checklist: ChecklistItem[];
  resource_manifest: ResourceManifest;
  budget_summary: BudgetSummary;
  sustainability_actions: SustainabilityActionItem[];
  assumptions_and_confirmations: AssumptionsAndConfirmations;
}
