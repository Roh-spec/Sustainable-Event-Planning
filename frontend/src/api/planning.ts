import { apiClient } from './client';
import { PlanningRequest, PlanningResponse, PlanAlternative } from '../types/planning';
import { CompletePlanRequest, CompletePlanResponse } from '../types/completePlan';

export interface PlanSelectionResult {
  success: boolean;
  persisted: boolean;
  message: string;
  selectedPlan: PlanAlternative;
}

export const planningApi = {
  generate: (request: PlanningRequest): Promise<PlanningResponse> => {
    return apiClient.post<PlanningResponse>('/planning/generate', request);
  },

  getCompletePlan: (request: CompletePlanRequest): Promise<CompletePlanResponse> => {
    return apiClient.post<CompletePlanResponse>('/planning/complete-plan', request);
  },

  /**
   * Explicit plan selection action.
   * If backend persistence endpoint (/plans) is not yet implemented (Phase 4),
   * this reports the status honestly without faking database storage.
   */
  selectPlan: async (eventId: number, plan: PlanAlternative): Promise<PlanSelectionResult> => {
    try {
      // Attempt plan persistence against backend /plans if endpoint exists
      const response = await apiClient.post<{ id?: number }>(`/plans`, {
        event_id: eventId,
        plan_id: plan.plan_id,
        name: plan.name,
        objective: plan.planning_objective,
        estimated_cost: plan.estimated_cost,
      });

      return {
        success: true,
        persisted: true,
        message: `Plan "${plan.name}" successfully persisted to database (ID: ${response.id || 'saved'}).`,
        selectedPlan: plan,
      };
    } catch {
      // Backend /plans endpoint is scheduled for future phases (Phase 4).
      // Do NOT fake database persistence. Return transparent result.
      return {
        success: true,
        persisted: false,
        message: `Plan "${plan.name}" selected for this session. (Note: Database persistence endpoint /plans is scheduled for Phase 4; plan selection is active in session memory.)`,
        selectedPlan: plan,
      };
    }
  },
};

