import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PlansPage } from '../pages/PlansPage';
import { PlanningWizardProvider } from '../context/PlanningWizardContext';
import { planningApi } from '../api/planning';

vi.mock('../api/planning', () => ({
  planningApi: {
    generate: vi.fn(),
    selectPlan: vi.fn(),
  },
}));

describe('PlansPage Plan Selection Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  const mockPlanningResponse = {
    event_id: 1,
    event_name: 'Sustainable College Fest',
    expected_attendees: 150,
    budget: '50000',
    status: 'COMPLETE',
    plans: [
      {
        plan_id: 'plan_balanced',
        name: 'Balanced Pragmatic Alternative',
        planning_objective: 'BALANCED',
        candidate_id: 'cand_balanced',
        feasible: true,
        estimated_cost: '40000',
        food_metrics: {
          estimated_waste_kg: '15.0',
          estimated_waste_servings: '40',
        },
        waste_metrics: {
          total_packaging_items: '400',
          reusable_packaging_items: '300',
          single_use_packaging_items: '100',
          reusable_percentage: '0.75',
          total_plastic_items: '0',
        },
        sustainability_metrics: [],
        constraint_result: {
          feasible: true,
          required_satisfied: true,
          not_allowed_satisfied: true,
          preferred_satisfied: true,
          budget_satisfied: true,
          flexible_adjustments: [],
          violations: [],
          relaxed_constraints: [],
        },
        assumptions_used: [],
        tradeoffs: ['Saves ₹10,000 compared to sustainability-focused plan.'],
        explanations: ['Optimal trade-off between cost and waste.'],
      },
    ],
    all_evaluated_candidates: [],
    assumptions_used: [],
    missing_assumptions: [],
    warnings: [],
  };

  it('opens confirmation modal and executes explicit plan selection', async () => {
    sessionStorage.setItem('wizard_event', JSON.stringify({ id: 1, name: 'Sustainable College Fest', event_type: 'TECH_FEST', expected_attendees: 150, duration_days: 1 }));
    sessionStorage.setItem('wizard_planning_response', JSON.stringify(mockPlanningResponse));

    (planningApi.selectPlan as any).mockResolvedValueOnce({
      success: true,
      persisted: false,
      message: 'Plan selected for this session.',
      selectedPlan: mockPlanningResponse.plans[0],
    });

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <PlansPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Balanced Pragmatic Alternative')).toBeInTheDocument();

    const selectBtn = screen.getByRole('button', { name: /Select this Plan/i });
    fireEvent.click(selectBtn);

    // Modal should be visible
    expect(screen.getByText(/Plan Selection Confirmation/i)).toBeInTheDocument();
    expect(screen.getByText(/explicitly selecting the/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm Plan Selection/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(planningApi.selectPlan).toHaveBeenCalledWith(1, expect.objectContaining({
        plan_id: 'plan_balanced',
      }));
    });
  });
});
