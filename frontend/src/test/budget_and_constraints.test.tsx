import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { BudgetPage } from '../pages/BudgetPage';
import { ConstraintsPage } from '../pages/ConstraintsPage';
import { PlanningWizardProvider, usePlanningWizard } from '../context/PlanningWizardContext';
import { planningApi } from '../api/planning';

vi.mock('../api/planning', () => ({
  planningApi: {
    generate: vi.fn(),
    selectPlan: vi.fn(),
  },
}));

describe('Budget and Event Preferences (Constraints) Steps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // --------------------------------------------------------------------------
  // Step 2: Budget Page Tests
  // --------------------------------------------------------------------------
  it('renders budget input with default currency INR without policy card or limit banner', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <BudgetPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const budgetInput = screen.getByLabelText(/Your Maximum Budget/i);
    expect(budgetInput).toBeInTheDocument();
    expect(screen.queryByText(/Zero-Silent Budget Inflation Policy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Current maximum limit is configured at/i)).not.toBeInTheDocument();
  });

  it('rejects negative budget input', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <BudgetPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const budgetInput = screen.getByLabelText(/Your Maximum Budget/i);
    fireEvent.change(budgetInput, { target: { value: '-500' } });

    const submitBtn = screen.getByRole('button', { name: /Continue to Constraints/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/valid non-negative budget/i);
  });

  // --------------------------------------------------------------------------
  // Step 3: Event Preferences (ConstraintsPage) Redesign Tests
  // --------------------------------------------------------------------------
  it('renders Event Preferences page with correct heading, subtitle, and priority cards', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <ConstraintsPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // 1. Heading and Subtitle
    expect(screen.getByRole('heading', { name: 'Event Preferences', level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText("Tell us what matters most. We'll use your preferences to create suitable event plans.")
    ).toBeInTheDocument();

    // 2. Three Priority Cards
    expect(screen.getByText('Save Money')).toBeInTheDocument();
    expect(screen.getByText('Keep event costs as low as possible.')).toBeInTheDocument();

    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('Balance affordability and sustainability.')).toBeInTheDocument();

    expect(screen.getByText('Reduce Waste')).toBeInTheDocument();
    expect(screen.getByText('Prioritize waste reduction and reusable items.')).toBeInTheDocument();

    // 3. Default selection is Balanced
    const balancedBtn = screen.getByRole('radio', { name: /Balanced/i });
    const saveMoneyBtn = screen.getByRole('radio', { name: /Save Money/i });
    const reduceWasteBtn = screen.getByRole('radio', { name: /Reduce Waste/i });

    expect(balancedBtn).toHaveAttribute('aria-checked', 'true');
    expect(saveMoneyBtn).toHaveAttribute('aria-checked', 'false');
    expect(reduceWasteBtn).toHaveAttribute('aria-checked', 'false');

    // 4. Hide internal enum names and advanced configuration from UI
    expect(screen.queryByText('Domain Category')).not.toBeInTheDocument();
    expect(screen.queryByText('Enforcement Level')).not.toBeInTheDocument();
  });

  it('handles single-priority selection across the three priority cards', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <ConstraintsPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const saveMoneyBtn = screen.getByRole('radio', { name: /Save Money/i });
    const balancedBtn = screen.getByRole('radio', { name: /Balanced/i });
    const reduceWasteBtn = screen.getByRole('radio', { name: /Reduce Waste/i });

    // Select "Save Money"
    fireEvent.click(saveMoneyBtn);
    expect(saveMoneyBtn).toHaveAttribute('aria-checked', 'true');
    expect(balancedBtn).toHaveAttribute('aria-checked', 'false');
    expect(reduceWasteBtn).toHaveAttribute('aria-checked', 'false');

    // Select "Reduce Waste"
    fireEvent.click(reduceWasteBtn);
    expect(reduceWasteBtn).toHaveAttribute('aria-checked', 'true');
    expect(saveMoneyBtn).toHaveAttribute('aria-checked', 'false');
    expect(balancedBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('allows adding and removing special requirements with user-friendly labels (Must Have, Avoid, Would Be Nice)', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <ConstraintsPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Open "Add Preference" form
    const addBtn = screen.getByRole('button', { name: /Add Preference/i });
    fireEvent.click(addBtn);

    // Form inputs should be visible
    const descInput = screen.getByLabelText(/Short Description/i);
    expect(descInput).toBeInTheDocument();

    // Friendly labels: Must Have, Avoid, Would Be Nice
    expect(screen.getByRole('button', { name: /Must Have/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Avoid/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Would Be Nice/i })).toBeInTheDocument();

    // 1. Add an "Avoid" (NOT_ALLOWED) preference
    fireEvent.change(descInput, { target: { value: 'No single-use plastic water bottles' } });
    fireEvent.click(screen.getByRole('button', { name: /Avoid/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save Preference/i }));

    // Verify item is rendered with "Avoid" badge
    expect(screen.getByText('No single-use plastic water bottles')).toBeInTheDocument();
    expect(screen.getByText('Avoid')).toBeInTheDocument();

    // 2. Add a "Must Have" (REQUIRED) preference
    fireEvent.click(screen.getByRole('button', { name: /Add Preference/i }));
    const descInput2 = screen.getByLabelText(/Short Description/i);
    fireEvent.change(descInput2, { target: { value: 'Vegetarian meals mandatory' } });
    fireEvent.click(screen.getByRole('button', { name: /Must Have/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save Preference/i }));

    expect(screen.getByText('Vegetarian meals mandatory')).toBeInTheDocument();
    expect(screen.getByText('Must Have')).toBeInTheDocument();

    // 3. Remove a preference
    const removeButtons = screen.getAllByRole('button', { name: /Remove preference/i });
    expect(removeButtons.length).toBe(2);

    fireEvent.click(removeButtons[0]);
    expect(screen.queryByText('No single-use plastic water bottles')).not.toBeInTheDocument();
    expect(screen.getByText('Vegetarian meals mandatory')).toBeInTheDocument();
  });

  it('allows users to skip and continue without adding any preferences', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <ConstraintsPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Empty state text is present
    expect(screen.getByText(/No special requirements added yet/i)).toBeInTheDocument();

    // "Continue to Food Planning" button can be clicked without validation error
    const continueBtn = screen.getByRole('button', { name: /Continue to Food Planning/i });
    expect(continueBtn).toBeInTheDocument();
    fireEvent.click(continueBtn);

    // No error alert is triggered
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('preserves existing saved constraints including FLEXIBLE without discarding them', () => {
    // Simulate saved constraints in session storage
    sessionStorage.setItem(
      'wizard_constraints',
      JSON.stringify([
        {
          category: 'WASTE',
          description: 'Decoration items scalable by planner',
          constraint_type: 'FLEXIBLE',
          value: 'DECORATION_SCALING',
        },
        {
          category: 'FOOD',
          description: 'Prefer organic fruit options',
          constraint_type: 'PREFERRED',
        },
      ])
    );

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <ConstraintsPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Both saved constraints must be rendered
    expect(screen.getByText('Decoration items scalable by planner')).toBeInTheDocument();
    expect(screen.getByText('Flexible')).toBeInTheDocument();

    expect(screen.getByText('Prefer organic fruit options')).toBeInTheDocument();
    expect(screen.getByText('Would Be Nice')).toBeInTheDocument();
  });

  it('correctly maps main priority to planning_objectives in planning request and does not treat it as a hard constraint', async () => {
    (planningApi.generate as any).mockResolvedValueOnce({
      event_id: 1,
      event_name: 'Tech Fest',
      expected_attendees: 100,
      status: 'COMPLETE',
      plans: [],
      all_evaluated_candidates: [],
      assumptions_used: [],
      missing_assumptions: [],
      warnings: [],
    });

    sessionStorage.setItem(
      'wizard_event',
      JSON.stringify({
        id: 1,
        name: 'Tech Fest',
        event_type: 'TECH_FEST',
        expected_attendees: 100,
        duration_days: 1,
      })
    );

    const IntegrationTestComponent = () => {
      const { setPriority, addConstraint, generatePlans } = usePlanningWizard();
      return (
        <div>
          <button onClick={() => setPriority('SAVE_MONEY')}>Select Save Money</button>
          <button
            onClick={() =>
              addConstraint({
                category: 'FOOD',
                description: 'Vegan dessert options',
                constraint_type: 'REQUIRED',
              })
            }
          >
            Add Requirement
          </button>
          <button onClick={() => generatePlans()}>Trigger Generate</button>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <IntegrationTestComponent />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Set priority to SAVE_MONEY and add a special requirement
    fireEvent.click(screen.getByText('Select Save Money'));
    fireEvent.click(screen.getByText('Add Requirement'));
    fireEvent.click(screen.getByText('Trigger Generate'));

    await waitFor(() => {
      expect(planningApi.generate).toHaveBeenCalledTimes(1);
    });

    const calledPayload = (planningApi.generate as any).mock.calls[0][0];

    // 1. Priority is mapped to planning_objectives
    expect(calledPayload.planning_objectives).toEqual(['BUDGET_FOCUSED']);

    // 2. Entered preferences are passed into the planning engine
    expect(calledPayload.constraints).toEqual([
      expect.objectContaining({
        category: 'FOOD',
        description: 'Vegan dessert options',
        constraint_type: 'REQUIRED',
      }),
    ]);

    // 3. Priority is NOT treated as a hard constraint in constraints array
    expect(
      calledPayload.constraints.every(
        (c: any) => !c.description.includes('Save Money') && c.category !== 'PRIORITY'
      )
    ).toBe(true);
  });
});
