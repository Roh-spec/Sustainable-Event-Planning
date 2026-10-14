import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PlanCard } from '../components/planning/PlanCard';
import { ExplainableMetric } from '../components/sustainability/ExplainableMetric';
import { InfeasibleBudgetAlert } from '../components/planning/InfeasibleBudgetAlert';
import { PlansPage } from '../pages/PlansPage';
import { PlanningWizardProvider } from '../context/PlanningWizardContext';
import { PlanAlternative } from '../types/planning';
import {
  formatReusablePercentage,
  formatCurrency,
  formatAssumptionKey,
  formatAssumptionValue,
  formatProvenanceLabel,
} from '../utils/metricFormatting';

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
      reusable_percentage: '90.0',
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
    assumptions_used: [
      {
        parameter: 'food_waste_percentage',
        value: '0.15',
        unit: 'ratio',
        source_type: 'DEFAULT',
      },
      {
        parameter: 'packaging_plate_per_person',
        value: '1.0',
        unit: 'items/person',
        source_type: 'CAMPUS_BENCHMARK',
      },
    ],
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
    expect(screen.getByText('All preferences satisfied')).toBeInTheDocument();
  });

  it('CRITICAL DEFECT FIX: formats 40 reusable items as 40% and NEVER 4000%', () => {
    // 40 reusable items out of 100 total items with backend reusable_percentage: '40.0'
    const planWith40Reusable: PlanAlternative = {
      ...mockPlan,
      waste_metrics: {
        total_packaging_items: '100',
        reusable_packaging_items: '40',
        single_use_packaging_items: '60',
        reusable_percentage: '40.0',
        total_plastic_items: '20',
      },
    };

    render(
      <PlanCard
        plan={planWith40Reusable}
        eventBudget={50000}
        onSelect={vi.fn()}
      />
    );

    // Verify 40% badge is shown
    expect(screen.getByText('40%')).toBeInTheDocument();
    // Verify 4000% is strictly NOT in the document
    expect(screen.queryByText(/4000%/i)).not.toBeInTheDocument();
  });

  it('displays plain-language explanations when clicking Why on metrics', () => {
    render(
      <PlanCard
        plan={mockPlan}
        eventBudget={50000}
        onSelect={vi.fn()}
      />
    );

    // Open Why? on Food Waste
    const foodWhyBtn = screen.getByRole('button', { name: /Why this Food Waste estimate\?/i });
    fireEvent.click(foodWhyBtn);
    expect(
      screen.getByText(/We estimate how much food may be left uneaten based on the planned meals and expected leftovers/i)
    ).toBeInTheDocument();

    // Open Why? on Reusable Items
    const reusableWhyBtn = screen.getByRole('button', { name: /Why this Reusable Items estimate\?/i });
    fireEvent.click(reusableWhyBtn);
    expect(
      screen.getByText(/These are serving items expected to be reusable, helping reduce disposable waste/i)
    ).toBeInTheDocument();

    // Open Why? on Single-Use Items
    const singleUseWhyBtn = screen.getByRole('button', { name: /Why this Single-Use Items estimate\?/i });
    fireEvent.click(singleUseWhyBtn);
    expect(
      screen.getByText(/These are disposable serving items expected to be used during the event/i)
    ).toBeInTheDocument();

    // Open Why? on Plastic Items
    const plasticWhyBtn = screen.getByRole('button', { name: /Why this Plastic Items estimate\?/i });
    fireEvent.click(plasticWhyBtn);
    expect(
      screen.getByText(/We estimate plastic items such as bottles or cups based on the event size and available assumptions/i)
    ).toBeInTheDocument();
  });

  it('translates technical parameters and hides raw keys in What we based this estimate on section', () => {
    render(
      <PlanCard
        plan={mockPlan}
        eventBudget={50000}
        onSelect={vi.fn()}
      />
    );

    // Open details
    const viewDetailsBtn = screen.getByRole('button', { name: /View Details/i });
    fireEvent.click(viewDetailsBtn);

    // Section title
    expect(screen.getByText(/What we based this estimate on:/i)).toBeInTheDocument();

    // Human-readable titles must be present
    expect(screen.getByText('Expected leftover food')).toBeInTheDocument();
    expect(screen.getByText('Plates estimated per attendee')).toBeInTheDocument();

    // Formatted values (0.15 ratio -> 15%, 1.0 items/person -> 1 per attendee)
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('1 per attendee')).toBeInTheDocument();

    // Friendly provenance label must appear, raw enums must NOT appear
    expect(screen.getAllByText('Estimated from planning assumptions').length).toBeGreaterThan(0);
    expect(screen.queryByText('DEFAULT')).not.toBeInTheDocument();
    expect(screen.queryByText('CAMPUS_BENCHMARK')).not.toBeInTheDocument();
    expect(screen.queryByText('items/person')).not.toBeInTheDocument();
    expect(screen.queryByText('food_waste_percentage')).not.toBeInTheDocument();
    expect(screen.queryByText('packaging_plate_per_person')).not.toBeInTheDocument();
  });

  it('renders A preference we couldn\'t fully meet section only when soft constraints are relaxed', () => {
    // 1. With NO relaxed constraints: section should NOT appear
    const { unmount } = render(
      <PlanCard
        plan={mockPlan}
        eventBudget={50000}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /View Details/i }));
    expect(screen.queryByText(/A preference we couldn't fully meet/i)).not.toBeInTheDocument();
    unmount();

    // 2. WITH relaxed constraints: section MUST appear with original preference and reason
    const planWithRelaxations: PlanAlternative = {
      ...mockPlan,
      constraint_result: {
        feasible: true,
        required_satisfied: true,
        not_allowed_satisfied: true,
        preferred_satisfied: false,
        budget_satisfied: true,
        flexible_adjustments: [],
        violations: [],
        relaxed_constraints: [
          {
            description: 'reusable plates and cups',
            relaxation_reason: 'This plan still includes some disposable items because the planner balanced your preference with your budget.',
          },
        ],
      },
    };

    render(
      <PlanCard
        plan={planWithRelaxations}
        eventBudget={50000}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Feasible (1 relaxed)')).toBeInTheDocument();

    // Open details
    fireEvent.click(screen.getByRole('button', { name: /View Details/i }));
    expect(screen.getByText(/A preference we couldn't fully meet/i)).toBeInTheDocument();
    expect(screen.getByText(/reusable plates and cups/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This plan still includes some disposable items because the planner balanced your preference with your budget./i)
    ).toBeInTheDocument();
  });

  it('verifies plain-language formatting helper functions', () => {
    // Parameter title mapping
    expect(formatAssumptionKey('food_waste_percentage')).toBe('Expected leftover food');
    expect(formatAssumptionKey('food_serving_weight_kg_default')).toBe('Assumed serving weight');
    expect(formatAssumptionKey('packaging_plate_per_person')).toBe('Plates estimated per attendee');
    expect(formatAssumptionKey('reusable_ratio_plate')).toBe('Estimated share of reusable plates');
    expect(formatAssumptionKey('plastic_water_bottle_per_person')).toBe('Plastic bottles estimated per attendee');
    expect(formatAssumptionKey('custom_unknown_key')).toBe('Custom Unknown Key');

    // Value formatting
    expect(formatAssumptionValue('0.15', 'ratio', 'food_waste_percentage')).toBe('15%');
    expect(formatAssumptionValue('0.35', 'kg', 'food_serving_weight_kg_default')).toBe('0.35 kg');
    expect(formatAssumptionValue('1.5', 'items/person', 'packaging_plate_per_person')).toBe('1.5 per attendee');
    expect(formatAssumptionValue('250', 'INR', 'cost_per_serving_inr')).toBe('₹250');

    // Provenance formatting
    expect(formatProvenanceLabel('USER')).toBe('Based on your input');
    expect(formatProvenanceLabel('ORGANIZER_OVERRIDE')).toBe('Based on your input');
    expect(formatProvenanceLabel('MEASURED')).toBe('Based on previous event measurements');
    expect(formatProvenanceLabel('EMPIRICAL')).toBe('Based on previous event measurements');
    expect(formatProvenanceLabel('DEFAULT')).toBe('Estimated from planning assumptions');
    expect(formatProvenanceLabel('ASSUMED')).toBe('Estimated from planning assumptions');
    expect(formatProvenanceLabel(null)).toBe('Estimated from planning assumptions');
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
    expect(submitBtn).toBeDisabled();
  });
});

describe('PlansPage Multi-Plan Grid Rendering', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  const basePlan: PlanAlternative = {
    plan_id: 'plan_1',
    name: 'Cost-Effective Plan',
    planning_objective: 'BUDGET_FOCUSED',
    candidate_id: 'cand_1',
    feasible: true,
    estimated_cost: '30000',
    food_metrics: { estimated_waste_kg: '18.0', estimated_waste_servings: '50' },
    waste_metrics: {
      total_packaging_items: '200',
      reusable_packaging_items: '50',
      single_use_packaging_items: '150',
      reusable_percentage: '25.0',
      total_plastic_items: '50',
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
    tradeoffs: [],
    explanations: ['Lowest financial cost alternative.'],
  };

  const createPlanningResponse = (plans: PlanAlternative[]) => ({
    event_id: 1,
    event_name: 'Tech Symposium',
    expected_attendees: 100,
    budget: '50000',
    status: 'COMPLETE',
    plans,
    all_evaluated_candidates: [],
    assumptions_used: [],
    missing_assumptions: [],
    warnings: [],
  });

  it('renders single plan with new heading, absence of subtitle, and NO comparison button', () => {
    sessionStorage.setItem('wizard_event', JSON.stringify({ id: 1, name: 'Tech Symposium', expected_attendees: 100 }));
    sessionStorage.setItem('wizard_planning_response', JSON.stringify(createPlanningResponse([basePlan])));

    const { container } = render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <PlansPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // New heading must be present
    expect(screen.getByText('Your Sustainable Event Plan')).toBeInTheDocument();

    // Old heading & subtitle must NOT be present
    expect(screen.queryByText('Recommended Event Plan Alternatives')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/The Planning Engine evaluated candidate variations/i)
    ).not.toBeInTheDocument();

    // Single plan details
    expect(screen.getByText('Cost-Effective Plan')).toBeInTheDocument();
    expect(screen.getByText('₹30,000')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();

    // Comparison button must be HIDDEN when exactly one plan exists
    expect(screen.queryByText(/Compare Plans Side-by-Side/i)).not.toBeInTheDocument();

    // Layout should use balanced wider card (max-w-3xl mx-auto)
    expect(container.querySelector('.max-w-3xl')).toBeInTheDocument();
  });

  it('renders two plans in a balanced two-column grid with comparison button visible', () => {
    const twoPlans: PlanAlternative[] = [
      basePlan,
      {
        ...basePlan,
        plan_id: 'plan_2',
        name: 'Balanced Pragmatic Plan',
        planning_objective: 'BALANCED',
        estimated_cost: '38000',
        waste_metrics: {
          total_packaging_items: '200',
          reusable_packaging_items: '150',
          single_use_packaging_items: '50',
          reusable_percentage: '75.0',
          total_plastic_items: '20',
        },
      },
    ];

    sessionStorage.setItem('wizard_event', JSON.stringify({ id: 1, name: 'Tech Symposium', expected_attendees: 100 }));
    sessionStorage.setItem('wizard_planning_response', JSON.stringify(createPlanningResponse(twoPlans)));

    const { container } = render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <PlansPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Cost-Effective Plan')).toBeInTheDocument();
    expect(screen.getByText('Balanced Pragmatic Plan')).toBeInTheDocument();

    // Comparison action MUST be visible when 2 plans exist
    expect(screen.getAllByText(/Compare Plans Side-by-Side/i).length).toBeGreaterThan(0);

    // Layout should use 2-column grid
    expect(container.querySelector('.md\\:grid-cols-2')).toBeInTheDocument();
  });

  it('renders three plan alternatives in balanced equal-width grid with compare button', () => {
    const threePlans: PlanAlternative[] = [
      basePlan,
      {
        ...basePlan,
        plan_id: 'plan_2',
        name: 'Balanced Pragmatic Plan',
        planning_objective: 'BALANCED',
        estimated_cost: '38000',
        waste_metrics: {
          total_packaging_items: '200',
          reusable_packaging_items: '150',
          single_use_packaging_items: '50',
          reusable_percentage: '75.0',
          total_plastic_items: '20',
        },
      },
      {
        ...basePlan,
        plan_id: 'plan_3',
        name: 'Maximum Eco Impact Plan',
        planning_objective: 'SUSTAINABILITY_FOCUSED',
        estimated_cost: '44000',
        waste_metrics: {
          total_packaging_items: '200',
          reusable_packaging_items: '200',
          single_use_packaging_items: '0',
          reusable_percentage: '100.0',
          total_plastic_items: '0',
        },
      },
    ];

    sessionStorage.setItem('wizard_event', JSON.stringify({ id: 1, name: 'Tech Symposium', expected_attendees: 100 }));
    sessionStorage.setItem('wizard_planning_response', JSON.stringify(createPlanningResponse(threePlans)));

    const { container } = render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <PlansPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Cost-Effective Plan')).toBeInTheDocument();
    expect(screen.getByText('Balanced Pragmatic Plan')).toBeInTheDocument();
    expect(screen.getByText('Maximum Eco Impact Plan')).toBeInTheDocument();

    // Comparison action MUST be visible when 3 plans exist
    expect(screen.getAllByText(/Compare Plans Side-by-Side/i).length).toBeGreaterThan(0);

    // Layout should use 3-column grid
    expect(container.querySelector('.lg\\:grid-cols-3')).toBeInTheDocument();
  });

  it('renders empty state when no plans are returned with no comparison button and retry action', () => {
    sessionStorage.setItem('wizard_event', JSON.stringify({ id: 1, name: 'Tech Symposium', expected_attendees: 100 }));
    sessionStorage.setItem('wizard_planning_response', JSON.stringify(createPlanningResponse([])));

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <PlansPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Empty state should be visible
    expect(screen.getByText('No Feasible Plans Generated')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry Generation/i })).toBeInTheDocument();

    // Comparison button must NOT be visible
    expect(screen.queryByText(/Compare Plans Side-by-Side/i)).not.toBeInTheDocument();
  });

  it('renders compact selected plan banner without overwhelming screen space', () => {
    sessionStorage.setItem('wizard_event', JSON.stringify({ id: 1, name: 'Tech Symposium', expected_attendees: 100 }));
    sessionStorage.setItem('wizard_planning_response', JSON.stringify(createPlanningResponse([basePlan])));
    sessionStorage.setItem('wizard_selected_plan', JSON.stringify(basePlan));

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <PlansPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Active Selection:/i)).toBeInTheDocument();
    expect(screen.getAllByText('Cost-Effective Plan').length).toBe(2);
    expect(screen.getByText('Selected Plan')).toBeInTheDocument();
  });
});
