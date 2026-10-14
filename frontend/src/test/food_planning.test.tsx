import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { FoodPlanningPage } from '../pages/FoodPlanningPage';
import { PlanningWizardProvider, usePlanningWizard } from '../context/PlanningWizardContext';
import { foodApi } from '../api/food';
import { FoodPlanResponse } from '../types/food';

vi.mock('../api/food', () => ({
  foodApi: {
    planFood: vi.fn(),
  },
}));

const mockEvent = {
  id: 42,
  name: 'Campus Green Tech Fair',
  event_type: 'EXHIBITION',
  expected_attendees: 200,
  duration_days: 1,
  location: 'Main Quadrangle',
  budget: { id: 1, event_id: 42, total_budget: '60000', currency: 'INR' },
};

const mockCalculationSuccessResponse: FoodPlanResponse = {
  event_id: 42,
  event_name: 'Campus Green Tech Fair',
  event_type: 'EXHIBITION',
  expected_attendees: 200,
  status: 'COMPLETE',
  meal_plans: [
    {
      meal_type: 'LUNCH',
      name: 'Lunch',
      day: 1,
      dietary_preference: 'MIXED',
      attendee_count: 200,
      participation_rate_used: '0.85',
      participation_source: 'ASSUMPTION (DEFAULT_BENCHMARK)',
      estimated_servings: 170,
      veg_servings: 119,
      non_veg_servings: 51,
      unit_cost: '120.00',
      total_cost: '20400.00',
      cost_source: 'ASSUMPTION (DEFAULT_BENCHMARK)',
      waste_servings: '20.40',
      waste_kg: '8.16',
    },
  ],
  total_estimated_servings: 170,
  total_veg_servings: 119,
  total_non_veg_servings: 51,
  cost_summary: {
    estimated_total_cost: '20400.00',
    cost_status: 'ESTIMATED',
    pricing_approach: 'ASSUMPTION_BASED',
    cost_per_attendee: '102.00',
    breakdown_by_meal: { Lunch: '20400.00' },
    food_budget: '25000.00',
    remaining_budget: '4600.00',
    is_over_budget: false,
    variance_amount: '-4600.00',
  },
  waste_summary: {
    waste_status: 'COMPLETE',
    estimated_waste_servings: '20.40',
    estimated_waste_kg: '8.16',
    waste_percentage_used: '0.12',
    serving_weight_kg_used: '0.40',
    waste_percentage_source: 'ASSUMPTION (DEFAULT_BENCHMARK)',
    serving_weight_source: 'ASSUMPTION (DEFAULT_BENCHMARK)',
  },
  constraints_evaluation: [],
  recommendations: [
    {
      code: 'REC_FOOD_BUFFER_CALIBRATION',
      title: 'Calibrate Catering Buffer',
      description: 'Align order count with expected 85% attendance to prevent surplus food waste.',
      reason: 'Participation rates typically range between 80-85%.',
      impact: 'Reduces food waste by up to 15%.',
    },
  ],
  assumptions_used: [
    {
      parameter: 'meal_participation_rate_lunch',
      value: '0.85',
      unit: 'ratio',
      source_type: 'REFERENCE',
      explanation: 'Campus dining benchmark for lunchtime events',
      is_resolved: true,
    },
    {
      parameter: 'meal_cost_per_serving_lunch',
      value: '120.00',
      unit: 'INR',
      source_type: 'REFERENCE',
      explanation: 'Campus caterer standard rate',
      is_resolved: true,
    },
  ],
  missing_assumptions: [],
  warnings: [],
};

const mockMissingWeightResponse: FoodPlanResponse = {
  ...mockCalculationSuccessResponse,
  waste_summary: {
    waste_status: 'SERVINGS_ONLY',
    estimated_waste_servings: '20.40',
    estimated_waste_kg: null,
    waste_percentage_used: '0.12',
    serving_weight_kg_used: null,
    waste_percentage_source: 'ASSUMPTION',
    serving_weight_source: null,
  },
  missing_assumptions: ['food_serving_weight_kg_default'],
};

describe('Food Planning Page (Step 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('wizard_event', JSON.stringify(mockEvent));
  });

  // 1. Page heading and introductory text
  it('renders page heading, introductory text, and read-only event context', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Plan Your Event Food')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Choose the meals you want to serve\. We'll estimate the food quantity, cost, and possible food waste for your event\./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/200 Expected Attendees/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Day Event/i)).toBeInTheDocument();
  });

  // 2. Meal selection and validation
  it('renders supported meal options and validates at least one meal is selected before calculating', async () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Section A heading
    expect(screen.getByText('Which meals will you serve?')).toBeInTheDocument();

    // Check all supported meals are displayed
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Snacks')).toBeInTheDocument();
    expect(screen.getByText('High Tea')).toBeInTheDocument();
    expect(screen.getByText('Refreshments')).toBeInTheDocument();

    // Unselect Lunch (which defaults to selected)
    const lunchButton = screen.getByRole('button', { name: /Lunch/i });
    fireEvent.click(lunchButton);

    // Try calculating with 0 meals
    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    expect(
      screen.getByText(/Please select at least one meal to serve before calculating estimates/i)
    ).toBeInTheDocument();
    expect(foodApi.planFood).not.toHaveBeenCalled();

    // Re-select Breakfast and Dinner
    const breakfastButton = screen.getByRole('button', { name: /Breakfast/i });
    const dinnerButton = screen.getByRole('button', { name: /Dinner/i });
    fireEvent.click(breakfastButton);
    fireEvent.click(dinnerButton);

    expect(breakfastButton).toHaveAttribute('aria-pressed', 'true');
    expect(dinnerButton).toHaveAttribute('aria-pressed', 'true');
  });

  // 3. Dietary preference selection and request mapping
  it('allows choosing Vegetarian only, Non-vegetarian only, or Both options with vegetarian ratio', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('What food options will you offer?')).toBeInTheDocument();

    const vegButton = screen.getByRole('button', { name: /^Vegetarian only/i });
    const nonVegButton = screen.getByRole('button', { name: /^Non-vegetarian only/i });
    const bothButton = screen.getByRole('button', { name: /^Both options/i });

    expect(vegButton).toBeInTheDocument();
    expect(nonVegButton).toBeInTheDocument();
    expect(bothButton).toBeInTheDocument();

    // Select Vegetarian only
    fireEvent.click(vegButton);
    expect(vegButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByLabelText(/Vegetarian Portion Ratio/i)).not.toBeInTheDocument();

    // Select Both options
    fireEvent.click(bothButton);
    expect(bothButton).toHaveAttribute('aria-pressed', 'true');

    // Ratio slider should be visible
    const slider = screen.getByLabelText(/Vegetarian Portion Ratio/i);
    expect(slider).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: '0.80' } });
    expect(screen.getByText(/80% Vegetarian • 20% Non-Vegetarian/i)).toBeInTheDocument();
  });

  // 4. Optional food-budget selection
  it('supports Estimate it for me vs entering a dedicated food budget', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByText("What's your food budget?")).toBeInTheDocument();

    const estimateModeBtn = screen.getByRole('button', { name: /Estimate it for me/i });
    const enterModeBtn = screen.getByRole('button', { name: /I'll enter my food budget/i });

    expect(estimateModeBtn).toBeInTheDocument();
    expect(enterModeBtn).toBeInTheDocument();

    // Initially estimate mode is active
    expect(estimateModeBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByLabelText(/Food Budget Amount/i)).not.toBeInTheDocument();

    // Switch to entering food budget
    fireEvent.click(enterModeBtn);
    expect(enterModeBtn).toHaveAttribute('aria-pressed', 'true');

    const budgetInput = screen.getByLabelText(/Food Budget Amount/i);
    expect(budgetInput).toBeInTheDocument();
    fireEvent.change(budgetInput, { target: { value: '35000' } });
    expect(budgetInput).toHaveValue(35000);
  });

  // 5. Optional customization controls
  it('keeps customization collapsed by default and allows expanding supported options', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const customizeAccordion = screen.getByRole('button', {
      name: /Adjust your food estimates \(Optional\)/i,
    });
    expect(customizeAccordion).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Do you already have a caterer's price\?/i)).not.toBeInTheDocument();

    // Expand
    fireEvent.click(customizeAccordion);
    expect(customizeAccordion).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Do you already have a caterer's price\?/i)).toBeInTheDocument();
    expect(screen.getByText(/How many people will eat\?/i)).toBeInTheDocument();
  });

  // 6. Explicit calculation trigger & loading state
  it('calculates food estimates only when clicking the button and displays loading state', async () => {
    let resolveApi: (value: any) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    (foodApi.planFood as any).mockReturnValue(apiPromise);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Initial state shows pre-calculation notice
    expect(
      screen.getByText(/Select your meals and calculate to see your food estimates\./i)
    ).toBeInTheDocument();
    expect(foodApi.planFood).not.toHaveBeenCalled();

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    expect(screen.getByText(/Calculating food estimates…/i)).toBeInTheDocument();
    expect(calcBtn).toBeDisabled();
    expect(foodApi.planFood).toHaveBeenCalledTimes(1);

    // Resolve API call
    resolveApi!(mockCalculationSuccessResponse);

    await waitFor(() => {
      expect(screen.queryByText(/Calculating food estimates…/i)).not.toBeInTheDocument();
    });
  });

  // 7. Error handling
  it('displays user-friendly error banner if API calculation fails', async () => {
    (foodApi.planFood as any).mockRejectedValue(new Error('Network error connecting to food service'));

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Network error connecting to food service/i)
      ).toBeInTheDocument();
    });
  });

  // 8. Correct rendering of metrics (Servings, Cost, Waste)
  it('renders real calculated servings, cost, and waste figures accurately', async () => {
    (foodApi.planFood as any).mockResolvedValue(mockCalculationSuccessResponse);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(screen.getByText('170 portions')).toBeInTheDocument();
      expect(screen.getByText('₹20,400')).toBeInTheDocument();
      expect(screen.getByText('20.40 servings')).toBeInTheDocument();
      expect(screen.getByText('~8.16 kg estimated mass')).toBeInTheDocument();
      expect(screen.getByText(/Within allocated food budget/i)).toBeInTheDocument();
      expect(screen.getByText('Calibrate Catering Buffer:')).toBeInTheDocument();
    });
  });

  // 9. No fake zero values for unavailable waste kg
  it('explains unavailable waste kg without displaying misleading zero values', async () => {
    (foodApi.planFood as any).mockResolvedValue(mockMissingWeightResponse);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(screen.getByText('20.40 servings')).toBeInTheDocument();
      expect(screen.queryByText('0 kg')).not.toBeInTheDocument();
      expect(
        screen.getByText(
          /Food waste in kilograms hasn't been estimated because a serving-weight assumption is unavailable\./i
        )
      ).toBeInTheDocument();
    });
  });

  // 10. Human-readable explainable estimates panel
  it('expands "How we calculated your food estimates" and shows 4 readable cards with formulas and human labels', async () => {
    (foodApi.planFood as any).mockResolvedValue(mockCalculationSuccessResponse);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(screen.getByText('How we calculated your food estimates')).toBeInTheDocument();
    });

    const explainBtn = screen.getByRole('button', { name: /How we calculated your food estimates/i });
    expect(explainBtn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(explainBtn);
    expect(explainBtn).toHaveAttribute('aria-expanded', 'true');

    // 4 readable cards must be present
    expect(screen.getByText('Estimated food servings')).toBeInTheDocument();
    expect(screen.getByText('Estimated food cost')).toBeInTheDocument();
    expect(screen.getByText('Expected food waste')).toBeInTheDocument();
    expect(screen.getByText('Assumptions and data sources')).toBeInTheDocument();

    // Check readable formulas
    expect(screen.getByText(/200 attendees × 85% attendance = 170 portions/i)).toBeInTheDocument();
    expect(screen.getByText(/170 portions × ₹120\.00 = ₹20,400/i)).toBeInTheDocument();
    expect(screen.getByText(/170 portions × 12% surplus = 20\.40 servings/i)).toBeInTheDocument();
    expect(screen.getByText(/20\.40 servings × 0\.40 kg\/serving = 8\.16 kg waste mass/i)).toBeInTheDocument();

    // Check human-readable parameter labels
    expect(screen.getByText('Lunch attendance rate')).toBeInTheDocument();
    expect(screen.getByText('Lunch cost per portion')).toBeInTheDocument();

    // Check human-readable source badge
    expect(screen.getAllByText('Reference benchmark').length).toBeGreaterThan(0);

    // Check food waste disclaimer note
    expect(
      screen.getByText(
        /These figures are estimates based on configured assumptions\. Actual food waste may vary depending on the menu, serving sizes, and attendee consumption\./i
      )
    ).toBeInTheDocument();

    // CRITICAL: Raw internal parameters and enum names must NOT be exposed to the user
    expect(screen.queryByText('meal_participation_rate_lunch')).not.toBeInTheDocument();
    expect(screen.queryByText(/Provenance: REFERENCE/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Provenance: ASSUMED/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Calculations are performed deterministically/i)).not.toBeInTheDocument();
  });

  it('distinguishes user-provided quotes from configured assumptions in the explanation', async () => {
    const userQuoteResponse: FoodPlanResponse = {
      ...mockCalculationSuccessResponse,
      cost_summary: {
        ...mockCalculationSuccessResponse.cost_summary,
        pricing_approach: 'USER_PROVIDED_TOTAL',
        estimated_total_cost: '25000.00',
      },
      assumptions_used: [
        {
          parameter: 'meal_participation_rate_lunch',
          value: '0.90',
          unit: 'ratio',
          source_type: 'USER_PROVIDED',
          explanation: 'Your custom attendance estimate',
          is_resolved: true,
        },
      ],
    };

    (foodApi.planFood as any).mockResolvedValue(userQuoteResponse);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(screen.getByText('How we calculated your food estimates')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /How we calculated your food estimates/i }));

    // User quote explanation in cost card
    expect(
      screen.getByText(/Cost is based on your specified total catering contract quote of/i)
    ).toBeInTheDocument();

    // User provided badge
    expect(screen.getByText('Your entered value')).toBeInTheDocument();
  });

  // 11. Navigation buttons
  it('renders Back to Constraints and Continue to Waste Planning navigation', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /Back to Constraints/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to Waste Planning/i })).toBeInTheDocument();
  });

  // 12. Preservation of state across navigation
  it('preserves food form state in PlanningWizardContext across steps', () => {
    const TestNavigationConsumer = () => {
      const { foodConfig, setFoodConfig } = usePlanningWizard();
      return (
        <div>
          <span data-testid="diet-pref">{foodConfig.default_dietary_preference}</span>
          <span data-testid="budget-mode">{foodConfig.budgetMode}</span>
          <span data-testid="meals-count">{foodConfig.meals.length}</span>
          <button
            type="button"
            onClick={() =>
              setFoodConfig((prev) => ({
                ...prev,
                default_dietary_preference: 'VEGETARIAN',
                budgetMode: 'ENTER',
                food_budget: '40000',
              }))
            }
          >
            Modify Food State
          </button>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <TestNavigationConsumer />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('diet-pref')).toHaveTextContent('MIXED');
    expect(screen.getByTestId('budget-mode')).toHaveTextContent('ESTIMATE');

    fireEvent.click(screen.getByRole('button', { name: /Modify Food State/i }));

    expect(screen.getByTestId('diet-pref')).toHaveTextContent('VEGETARIAN');
    expect(screen.getByTestId('budget-mode')).toHaveTextContent('ENTER');
  });

  // Requirement 1: A 100-attendee event with 100% meal participation yields 100 servings
  it('calculates 100 servings for a 100-attendee event with 100% meal participation', async () => {
    const event100 = { ...mockEvent, id: 100, expected_attendees: 100 };
    sessionStorage.setItem('wizard_event_id', '100');
    sessionStorage.setItem('wizard_event', JSON.stringify(event100));

    const response100: FoodPlanResponse = {
      ...mockCalculationSuccessResponse,
      expected_attendees: 100,
      total_estimated_servings: 100,
      total_veg_servings: 70,
      total_non_veg_servings: 30,
      meal_plans: [
        {
          ...mockCalculationSuccessResponse.meal_plans[0],
          attendee_count: 100,
          participation_rate_used: '1.0',
          estimated_servings: 100,
          veg_servings: 70,
          non_veg_servings: 30,
        },
      ],
    };
    (foodApi.planFood as any).mockResolvedValue(response100);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Expand optional customization and enter 100% participation
    fireEvent.click(screen.getByRole('button', { name: /Adjust your food estimates \(Optional\)/i }));
    const rateInput = screen.getByLabelText(/Attendance rate:/i);
    fireEvent.change(rateInput, { target: { value: '100' } });

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(foodApi.planFood).toHaveBeenCalledWith(
        expect.objectContaining({
          meals: expect.arrayContaining([
            expect.objectContaining({
              user_participation_rate: 1.0,
            }),
          ]),
        })
      );
      expect(screen.getByText('100 portions')).toBeInTheDocument();
    });
  });

  // Requirement 2: A 100-attendee event with 60% participation yields 60 servings
  it('calculates 60 servings for a 100-attendee event with 60% participation', async () => {
    const event100 = { ...mockEvent, id: 100, expected_attendees: 100 };
    sessionStorage.setItem('wizard_event_id', '100');
    sessionStorage.setItem('wizard_event', JSON.stringify(event100));

    const response60: FoodPlanResponse = {
      ...mockCalculationSuccessResponse,
      expected_attendees: 100,
      total_estimated_servings: 60,
      total_veg_servings: 18,
      total_non_veg_servings: 42,
      meal_plans: [
        {
          ...mockCalculationSuccessResponse.meal_plans[0],
          attendee_count: 100,
          participation_rate_used: '0.60',
          estimated_servings: 60,
          veg_servings: 18,
          non_veg_servings: 42,
        },
      ],
    };
    (foodApi.planFood as any).mockResolvedValue(response60);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Expand optional customization and enter 60% participation
    fireEvent.click(screen.getByRole('button', { name: /Adjust your food estimates \(Optional\)/i }));
    const rateInput = screen.getByLabelText(/Attendance rate:/i);
    fireEvent.change(rateInput, { target: { value: '60' } });

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(foodApi.planFood).toHaveBeenCalledWith(
        expect.objectContaining({
          meals: expect.arrayContaining([
            expect.objectContaining({
              user_participation_rate: 0.6,
            }),
          ]),
        })
      );
      expect(screen.getByText('60 portions')).toBeInTheDocument();
    });
  });

  // Requirement 3: A 60-serving mixed-diet meal with a 30% vegetarian ratio yields 18 vegetarian and 42 non-vegetarian servings
  it('yields 18 vegetarian and 42 non-vegetarian servings for a 60-serving mixed-diet with 30% veg ratio', async () => {
    const response60Mixed30: FoodPlanResponse = {
      ...mockCalculationSuccessResponse,
      expected_attendees: 100,
      total_estimated_servings: 60,
      total_veg_servings: 18,
      total_non_veg_servings: 42,
      meal_plans: [
        {
          ...mockCalculationSuccessResponse.meal_plans[0],
          name: 'Main Lunch',
          attendee_count: 100,
          participation_rate_used: '0.60',
          estimated_servings: 60,
          veg_servings: 18,
          non_veg_servings: 42,
        },
      ],
    };
    (foodApi.planFood as any).mockResolvedValue(response60Mixed30);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Mixed diet with 30% veg slider
    const bothButton = screen.getByRole('button', { name: /^Both options/i });
    fireEvent.click(bothButton);
    const slider = screen.getByLabelText(/Vegetarian Portion Ratio/i);
    fireEvent.change(slider, { target: { value: '0.30' } });

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(foodApi.planFood).toHaveBeenCalledWith(
        expect.objectContaining({
          default_dietary_preference: 'MIXED',
          vegetarian_ratio: 0.3,
        })
      );
      expect(screen.getByText('60 portions')).toBeInTheDocument();
      expect(screen.getByText(/18 veg/i)).toBeInTheDocument();
      expect(screen.getByText(/42 non-veg/i)).toBeInTheDocument();
    });
  });

  // Requirement 4: Headcount and participation values displayed in the UI match those sent to the Food endpoint
  it('ensures headcount and participation values in UI match those sent to Food endpoint', async () => {
    (foodApi.planFood as any).mockResolvedValue(mockCalculationSuccessResponse);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Adjust your food estimates \(Optional\)/i }));

    const attendanceInput = screen.getByLabelText(/Expected meal attendance:/i);
    const rateInput = screen.getByLabelText(/Attendance rate:/i);

    fireEvent.change(attendanceInput, { target: { value: '120' } });
    fireEvent.change(rateInput, { target: { value: '75' } });

    expect(attendanceInput).toHaveValue(120);
    expect(rateInput).toHaveValue(75);

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(foodApi.planFood).toHaveBeenCalledWith(
        expect.objectContaining({
          meals: expect.arrayContaining([
            expect.objectContaining({
              attendee_count: 120,
              user_participation_rate: 0.75,
            }),
          ]),
        })
      );
    });
  });

  // Requirement 5: New events do not accidentally inherit stale customization values
  it('does not inherit stale customization values when a different event is loaded', async () => {
    // Setup stale session storage from an old event 99
    sessionStorage.setItem('wizard_event_id', '99');
    sessionStorage.setItem('wizard_event', JSON.stringify({ id: 99, name: 'Old Tech Fest', event_type: 'TECH_FEST', expected_attendees: 150 }));
    sessionStorage.setItem(
      'wizard_food_config',
      JSON.stringify({
        meals: [
          {
            meal_type: 'LUNCH',
            attendee_count: 150,
            user_participation_rate: 0.35,
          },
        ],
        known_unit_cost: '250',
        costApproach: 'UNIT',
      })
    );

    // Mock API for event 42
    const { eventsApi } = await import('../api/events');
    vi.spyOn(eventsApi, 'getById').mockResolvedValue(mockEvent as any);

    const TestComponent = () => {
      const { loadEvent } = usePlanningWizard();
      return (
        <div>
          <button type="button" onClick={() => loadEvent(42)}>Load Event 42</button>
          <FoodPlanningPage />
        </div>
      );
    };

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <TestComponent />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    // Click to load event 42
    fireEvent.click(screen.getByRole('button', { name: /Load Event 42/i }));

    await waitFor(() => {
      expect(screen.getByText(/200 Expected Attendees/i)).toBeInTheDocument();
    });

    // Expand customization: stale 150 headcount and 0.35 rate should be cleared!
    fireEvent.click(screen.getByRole('button', { name: /Adjust your food estimates \(Optional\)/i }));
    const attendanceInput = screen.getByLabelText(/Expected meal attendance:/i);
    const rateInput = screen.getByLabelText(/Attendance rate:/i);

    expect(attendanceInput).toHaveValue(null);
    expect(rateInput).toHaveValue(null);
  });

  // Requirement 6: The optional customization section works when expanded and collapsed
  it('toggles optional customization section expansion and collapse cleanly', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    const accordionBtn = screen.getByRole('button', {
      name: /Adjust your food estimates \(Optional\)/i,
    });
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('How many people will eat?')).not.toBeInTheDocument();

    // Expand
    fireEvent.click(accordionBtn);
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('How many people will eat?')).toBeInTheDocument();
    expect(screen.getByText("Do you already have a caterer's price?")).toBeInTheDocument();

    // Collapse
    fireEvent.click(accordionBtn);
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('How many people will eat?')).not.toBeInTheDocument();
  });

  // Requirement 7: The three catering-price modes display only relevant fields and send correct request properties
  it('handles the three catering-price modes and sends non-conflicting properties', async () => {
    (foodApi.planFood as any).mockResolvedValue(mockCalculationSuccessResponse);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Adjust your food estimates \(Optional\)/i }));

    const unitChoice = screen.getByRole('button', { name: /Price per person or serving/i });
    const totalChoice = screen.getByRole('button', { name: /Total catering price/i });

    // Mode 1: Use an estimate (default)
    expect(screen.queryByLabelText(/Price per person or serving/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Total catering price/i)).not.toBeInTheDocument();

    // Mode 2: Price per person or serving
    fireEvent.click(unitChoice);
    expect(screen.getByLabelText(/Price per person or serving/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Total catering price/i)).not.toBeInTheDocument();

    const unitInput = screen.getByPlaceholderText(/e\.g\. 150/i);
    fireEvent.change(unitInput, { target: { value: '180' } });
    const unitSelect = screen.getByRole('combobox', { name: /Pricing unit/i });
    fireEvent.change(unitSelect, { target: { value: 'PER_SERVING' } });

    const calcBtn = screen.getByRole('button', { name: /Calculate Food Estimates/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(foodApi.planFood).toHaveBeenCalledWith(
        expect.objectContaining({
          known_unit_cost: 180,
          cost_pricing_unit: 'PER_SERVING',
          known_total_cost: undefined,
        })
      );
    });

    // Mode 3: Total catering price
    fireEvent.click(totalChoice);
    expect(screen.getByLabelText(/Total catering price/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Price per person or serving/i)).not.toBeInTheDocument();

    const totalInput = screen.getByPlaceholderText(/e\.g\. 25000/i);
    fireEvent.change(totalInput, { target: { value: '45000' } });

    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(foodApi.planFood).toHaveBeenCalledWith(
        expect.objectContaining({
          known_total_cost: 45000,
          known_unit_cost: undefined,
          cost_pricing_unit: undefined,
        })
      );
    });
  });

  // Requirement 8: The "Configured in Step 1 (Read-only)" label is absent
  it('does not display "Configured in Step 1 (Read-only)" label while retaining attendee and duration details', () => {
    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <FoodPlanningPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.queryByText(/Configured in Step 1 \(Read-only\)/i)).not.toBeInTheDocument();
    expect(screen.getByText(/200 Expected Attendees/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Day Event/i)).toBeInTheDocument();
  });
});
