import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlanCard } from '../components/planning/PlanCard';
import { ExplainableMetric } from '../components/sustainability/ExplainableMetric';
import { InfeasibleBudgetAlert } from '../components/planning/InfeasibleBudgetAlert';
import { PlanAlternative } from '../types/planning';

describe('PlanCard & Sustainability Metrics Handling', () => {
  const mockPlan: PlanAlternative = {
    plan_id: 'plan_sustainable',
    name: 'Maximum Eco Impact Alternative',
    planning_objective: 'SUSTAINABILITY_FOCUSED',
    candidate_id: 'cand_plastic_min',
    feasible: true,
    estimated_cost: '45000',
    food_metrics: {
      estimated_waste_kg: '12.5',
      estimated_waste_servings: '35',
    },
    waste_metrics: {
      total_packaging_items: '500',
      reusable_packaging_items: '450',
      single_use_packaging_items: '50',
      reusable_percentage: '0.90',
      total_plastic_items: '0',
    },
    sustainability_metrics: [
      {
        metric_name: 'food_waste_kg',
        value: '12.5',
        unit: 'kg',
        source_type: 'ESTIMATED',
        module: 'FOOD',
      },
    ],
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
    tradeoffs: ['Costs ₹5,000 more than Budget-Focused plan but reduces single-use items by 400.'],
    explanations: ['Minimizes single-use disposables using 90% reusable tableware.'],
  };

  it('renders plan card with key measurable metrics and objective badge', () => {
    render(
      <PlanCard
        plan={mockPlan}
        eventBudget={50000}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Maximum Eco Impact Alternative')).toBeInTheDocument();
    expect(screen.getByText('₹45,000')).toBeInTheDocument();
    expect(screen.getByText(/Remaining: ₹5,000/i)).toBeInTheDocument();
    expect(screen.getByText('12.5')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Zero Plastic')).toBeInTheDocument();
    expect(screen.getByText(/Costs ₹5,000 more than Budget-Focused/i)).toBeInTheDocument();
  });

  it('CRITICAL: never converts null/unavailable metrics to zero', () => {
    // When food waste kg is null, it should display "Not available" NOT "0"
    render(
      <ExplainableMetric
        label="Food Waste"
        value={null}
        unit="kg"
      />
    );

    expect(screen.getByText('Not available')).toBeInTheDocument();
    expect(screen.queryByText('0 kg')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders InfeasibleBudgetAlert with deficit and requires explicit approval', () => {
    const handleApprove = vi.fn();
    render(
      <InfeasibleBudgetAlert
        currentBudget={1000}
        minFeasibleBudget={10000}
        budgetDeficit={9000}
        currency="INR"
        onApproveBudgetIncrease={handleApprove}
      />
    );

    expect(screen.getByText('INFEASIBLE_BUDGET')).toBeInTheDocument();
    expect(screen.getByText(/Current Budget is Insufficient/i)).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
    expect(screen.getAllByText('₹10,000').length).toBeGreaterThan(0);
    expect(screen.getByText('+₹9,000')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Approve Budget Increase/i });
    expect(submitBtn).toBeDisabled(); // Requires explicit checkbox confirmation!
  });
});
