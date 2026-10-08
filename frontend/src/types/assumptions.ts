export type AssumptionSourceType =
  | 'USER_PROVIDED'
  | 'REFERENCE'
  | 'ASSUMED'
  | 'ACTUAL'
  | 'ML_PREDICTED';

export type AssumptionScope = 'GLOBAL' | 'EVENT';

export interface ResolvedAssumption {
  parameter: string;
  value?: string | null;
  unit?: string | null;
  source_type?: AssumptionSourceType | null;
  category?: string | null;
  confidence?: string | number | null;
  reference_notes?: string | null;
  scope?: AssumptionScope | null;
  is_resolved: boolean;
  explanation?: string | null;
}
