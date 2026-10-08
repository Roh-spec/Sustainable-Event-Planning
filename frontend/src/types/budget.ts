export interface BudgetBase {
  total_budget: string | number;
  currency: string;
  status?: string | null;
}

export interface BudgetCreate extends BudgetBase {}

export interface BudgetResponse extends BudgetBase {
  id: number;
  event_id: number;
}
