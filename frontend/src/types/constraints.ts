export type ConstraintType =
  "REQUIRED" | "PREFERRED" | "NOT_ALLOWED" | "FLEXIBLE";

export interface ConstraintBase {
  category: string;
  description: string;
  constraint_type: ConstraintType;
  value?: string | null;
}

export interface ConstraintCreate extends ConstraintBase {}

export interface ConstraintResponse extends ConstraintBase {
  id: number;
  event_id: number;
}

export interface ConstraintViolation {
  constraint_id?: number | null;
  category: string;
  constraint_type: ConstraintType;
  description: string;
  reason: string;
}

export interface ConstraintRelaxation {
  constraint_id?: number | null;
  category: string;
  constraint_type: ConstraintType;
  description: string;
  relaxation_reason: string;
  impact?: string;
}

export interface ConstraintResult {
  feasible: boolean;
  required_satisfied: boolean;
  not_allowed_satisfied: boolean;
  preferred_satisfied: boolean;
  budget_satisfied: boolean;
  flexible_adjustments: string[];
  violations: ConstraintViolation[];
  relaxed_constraints: ConstraintRelaxation[];
}

export const CONSTRAINT_TYPE_CONFIG: Record<
  ConstraintType,
  { label: string; explanation: string; badgeColor: string; pillColor: string }
> = {
  REQUIRED: {
    label: "Required",
    explanation: "Must be strictly satisfied by the planner.",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    pillColor: "bg-emerald-500",
  },
  PREFERRED: {
    label: "Preferred",
    explanation: "Try to satisfy when possible; can be relaxed if needed.",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    pillColor: "bg-blue-500",
  },
  NOT_ALLOWED: {
    label: "Not Allowed",
    explanation: "Must never be violated under any circumstances.",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    pillColor: "bg-rose-500",
  },
  FLEXIBLE: {
    label: "Flexible",
    explanation: "Can be freely calibrated and adjusted by the planner.",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    pillColor: "bg-amber-500",
  },
};
