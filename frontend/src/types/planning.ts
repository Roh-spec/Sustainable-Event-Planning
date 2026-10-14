import { ConstraintBase, ConstraintResult } from './constraints';
import { FoodPlanRequest } from './food';
import { WastePlanRequest, WasteSourceType } from './waste';
import { ResolvedAssumption } from './assumptions';

export type PlanningObjective = 'BUDGET_FOCUSED' | 'BALANCED' | 'SUSTAINABILITY_FOCUSED';

export type MainPriority = 'SAVE_MONEY' | 'BALANCED' | 'REDUCE_WASTE';

export const PRIORITY_OBJECTIVE_MAP: Record<MainPriority, PlanningObjective> = {
  SAVE_MONEY: 'BUDGET_FOCUSED',
  BALANCED: 'BALANCED',
  REDUCE_WASTE: 'SUSTAINABILITY_FOCUSED',
};

export const PLANNING_OBJECTIVE_CONFIG: Record<
  PlanningObjective,
  { label: string; badge: string; icon: string; description: string; tagColor: string }
> = {
  BUDGET_FOCUSED: {
    label: 'Budget-Focused',
    badge: '💰 Cost-Effective',
    icon: 'Wallet',
    description: 'Prioritizes lower expenditure while satisfying hard constraints.',
    tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  BALANCED: {
    label: 'Balanced',
    badge: '⚖️ Pragmatic Equilibrium',
    icon: 'Scale',
    description: 'Strikes an optimal balance between budget constraints and eco reduction.',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  SUSTAINABILITY_FOCUSED: {
    label: 'Sustainability-Focused',
    badge: '🌱 Maximum Eco Impact',
    icon: 'Leaf',
    description: 'Minimizes measurable waste, plastics, and disposable footprints.',
    tagColor: 'bg-green-100 text-green-800 border-green-300',
  },
};

export interface PlanningModuleContext {
  food?: FoodPlanRequest | null;
  waste?: WastePlanRequest | null;
}

export interface PlanningRequest {
  event_id: number;
  budget?: string | number | null;
  constraints?: ConstraintBase[];
  planning_objectives?: PlanningObjective[];
  module_context?: PlanningModuleContext | null;
  allow_budget_increase?: boolean;
  max_approved_budget?: string | number | null;
}

export interface SustainabilityMetric {
  metric_name: string;
  value: string | number;
  unit: string;
  source_type: WasteSourceType | string;
  module: string;
  description?: string | null;
}

export interface FoodMetrics {
  estimated_servings?: number | null;
  estimated_cost?: string | number | null;
  estimated_waste_servings?: string | number | null;
  estimated_waste_kg?: string | number | null;
  veg_servings?: number | null;
  non_veg_servings?: number | null;
}

export interface WasteMetrics {
  total_packaging_items?: string | number | null;
  reusable_packaging_items?: string | number | null;
  single_use_packaging_items?: string | number | null;
  reusable_percentage?: string | number | null;
  total_plastic_items?: string | number | null;
  total_other_items?: string | number | null;
}

export interface PlanAlternative {
  plan_id: string;
  name: string;
  planning_objective: PlanningObjective;
  candidate_id: string;
  feasible: boolean;
  estimated_cost?: string | number | null;
  food_metrics?: FoodMetrics | null;
  waste_metrics?: WasteMetrics | null;
  sustainability_metrics: SustainabilityMetric[];
  constraint_result: ConstraintResult;
  assumptions_used: ResolvedAssumption[];
  tradeoffs: string[];
  explanations: string[];
}

export interface CandidateConfiguration {
  candidate_id: string;
  name: string;
  description: string;
  food_config?: FoodPlanRequest | null;
  waste_config?: WastePlanRequest | null;
  constraint_adjustments: string[];
  basis_notes: string[];
}

export interface CandidateEvaluation {
  candidate_id: string;
  name: string;
  configuration: CandidateConfiguration;
  feasible: boolean;
  total_cost?: string | number | null;
  food_metrics?: FoodMetrics | null;
  waste_metrics?: WasteMetrics | null;
  sustainability_metrics: SustainabilityMetric[];
  constraint_result: ConstraintResult;
  assumptions_used: ResolvedAssumption[];
  missing_assumptions: string[];
  explanations: string[];
}

export interface PlanningResponse {
  event_id: number;
  event_name: string;
  expected_attendees: number;
  budget?: string | number | null;
  status: 'COMPLETE' | 'PARTIAL' | 'INFEASIBLE_BUDGET' | string;
  min_feasible_budget?: string | number | null;
  budget_deficit?: string | number | null;
  plans: PlanAlternative[];
  all_evaluated_candidates: CandidateEvaluation[];
  assumptions_used: ResolvedAssumption[];
  missing_assumptions: string[];
  warnings: string[];
}
