import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { CompletePlanPage } from '../pages/CompletePlanPage';
import { TimingWindowBar } from '../components/complete_plan/TimingWindowBar';
import { EventTimetable } from '../components/complete_plan/EventTimetable';
import { ExecutionChecklist } from '../components/complete_plan/ExecutionChecklist';
import { ResourceManifest } from '../components/complete_plan/ResourceManifest';
import { PlanBudgetSummary } from '../components/complete_plan/PlanBudgetSummary';
import { SustainabilityActionsList } from '../components/complete_plan/SustainabilityActionsList';
import { AssumptionsDisclosure } from '../components/complete_plan/AssumptionsDisclosure';
import { PlanningWizardProvider } from '../context/PlanningWizardContext';
import { planningApi } from '../api/planning';
import { CompletePlanResponse } from '../types/completePlan';

vi.mock('../api/planning', () => ({
  planningApi: {
    generate: vi.fn(),
    selectPlan: vi.fn(),
    getCompletePlan: vi.fn(),
  },
}));

describe('Complete Event Plan (Phase 3 Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  const mockPlanAlternative = {
    plan_id: 'plan_max_reusable',
    name: 'Maximum Reusable Alternative',
    planning_objective: 'SUSTAINABILITY_FOCUSED',
    candidate_id: 'cand_max_reusable',
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
      reusable_percentage: '90',
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
    tradeoffs: ['High upfront reusable hire cost.'],
    explanations: ['90% reduction in disposable waste.'],
  };

  const mockCompletePlanResponse: CompletePlanResponse = {
    event_overview: {
      event_id: 1,
      name: 'Green Tech Symposium',
      event_type: 'CONFERENCE',
      expected_attendees: 200,
      duration_days: 1,
      location: 'Main Auditorium',
      event_date: '2026-11-15',
      start_time: '09:00',
      end_time: '17:00',
      selected_plan_name: 'Maximum Reusable Alternative',
      selected_plan_objective: 'SUSTAINABILITY_FOCUSED',
      is_feasible: true,
    },
    daily_timetable: [
      {
        day_number: 1,
        date: '2026-11-15',
        start_time: '09:00',
        end_time: '17:00',
        total_duration_minutes: 480,
        slots: [
          {
            slot_id: 'slot_1',
            day: 1,
            start_time: '09:00',
            end_time: '10:00',
            duration_minutes: 60,
            title: 'Sustainable Venue Setup',
            activity_type: 'SETUP',
            description: 'Unpack dishware and setup water stations',
            is_meal: false,
            is_sustainability_action: true,
            is_suggestion: true,
          },
          {
            slot_id: 'slot_2',
            day: 1,
            start_time: '13:00',
            end_time: '14:00',
            duration_minutes: 60,
            title: 'Networking Lunch',
            activity_type: 'MEAL',
            description: 'Organic buffet with reusable plates',
            is_meal: true,
            meal_type: 'LUNCH',
            is_sustainability_action: false,
            is_suggestion: false,
          },
        ],
      },
    ],
    scheduling_warnings: ['Tight transition buffer before lunch.'],
    scheduling_conflicts: [
      {
        conflict_type: 'BUFFER_TIGHT',
        description: 'Less than 15 minutes buffer between session and lunch',
        affected_activities: ['Keynote Session', 'Networking Lunch'],
        severity: 'WARNING',
      },
    ],
    checklist: [
      {
        task_id: 'task_1',
        title: 'Confirm Dishwashing Station',
        description: 'Ensure hot water supply for 450 reusable plates',
        phase: 'BEFORE_EVENT',
        category: 'WASTE_MANAGEMENT',
        deadline_relative: 'T-7 days',
        is_sustainability_action: true,
        is_suggestion: true,
      },
      {
        task_id: 'task_2',
        title: 'Morning Waste Briefing',
        description: 'Brief student volunteers on bin sorting',
        phase: 'EVENT_DAY_MORNING',
        category: 'COMMUNICATIONS',
        deadline_relative: '08:30 AM',
        is_sustainability_action: true,
        is_suggestion: false,
      },
    ],
    resource_manifest: {
      food_and_catering: {
        estimated_servings: 200,
        veg_servings: 140,
        non_veg_servings: 60,
        estimated_food_waste_kg: '12.5',
        provenance: 'Calculated from food module assumptions',
      },
      tableware_and_serving: {
        reusable_items: '450',
        single_use_items: '50',
        reusable_percentage: '90',
        provenance: 'Calculated from waste packaging options',
      },
      plastic_items: {
        estimated_plastic_items: '0',
        description: 'Eliminated through campus water refill stations',
        provenance: 'Plastic reduction commitment',
      },
      suggested_equipment: [
        {
          name: '3-Stream Waste Sorting Stations',
          suggested_quantity: '4 stations',
          category: 'WASTE_MANAGEMENT',
          notes: 'Place near dining area',
          is_suggestion: true,
        },
      ],
    },
    budget_summary: {
      total_budget: '50000',
      currency: 'INR',
      estimated_plan_cost: '45000',
      food_cost: '35000',
      packaging_cost: '10000',
      remaining_contingency: '5000',
      is_budget_feasible: true,
      budget_deficit: null,
      notes: 'Feasible within allocated INR 50,000 budget.',
    },
    sustainability_actions: [
      {
        title: 'Eliminate Disposable Tableware',
        action_type: 'REUSABLE_PACKAGING',
        description: 'Serve all meals on washable stainless steel plates.',
        target_metric: '90% reusable tableware',
        verification_step: 'Inspect catering area prior to meal service.',
      },
    ],
    assumptions_and_confirmations: {
      planning_assumptions: [
        {
          parameter: 'food_waste_percentage',
          value: '0.15',
          unit: 'ratio',
          source_type: 'DEFAULT',
          explanation: 'Expected leftover food',
          is_resolved: true,
        },
      ],
      items_requiring_confirmation: [
        'Confirm venue dishwashing facilities with campus maintenance.',
      ],
    },
  };

  it('renders empty state when no plan has been selected in Step 6', () => {
    sessionStorage.setItem(
      'wizard_event',
      JSON.stringify({ id: 1, name: 'Green Tech Symposium', event_type: 'CONFERENCE', expected_attendees: 200, duration_days: 1 })
    );

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <CompletePlanPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/No Sustainable Plan Selected Yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Step 6/i })).toBeInTheDocument();
  });

  it('validates timing form before submitting: rejects end time earlier than start time', () => {
    const handleGenerate = vi.fn();
    render(
      <TimingWindowBar
        eventDate="2026-11-15"
        startTime="17:00"
        endTime="09:00"
        durationDays={1}
        isGenerating={false}
        hasPlan={false}
        onTimingChange={vi.fn()}
        onGenerate={handleGenerate}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Generate Complete Event Plan/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/must be strictly after start time/i);
    expect(handleGenerate).not.toHaveBeenCalled();
  });

  it('validates timing form: requires valid event date', () => {
    const handleGenerate = vi.fn();
    render(
      <TimingWindowBar
        eventDate=""
        startTime="09:00"
        endTime="17:00"
        durationDays={1}
        isGenerating={false}
        hasPlan={false}
        onTimingChange={vi.fn()}
        onGenerate={handleGenerate}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Generate Complete Event Plan/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/Please select a valid event date/i);
    expect(handleGenerate).not.toHaveBeenCalled();
  });

  it('submits valid complete plan request with selected plan and event ID', async () => {
    sessionStorage.setItem(
      'wizard_event',
      JSON.stringify({ id: 1, name: 'Green Tech Symposium', event_type: 'CONFERENCE', expected_attendees: 200, duration_days: 1 })
    );
    sessionStorage.setItem('wizard_selected_plan', JSON.stringify(mockPlanAlternative));
    sessionStorage.setItem(
      'wizard_timing_config',
      JSON.stringify({ eventDate: '2026-11-15', startTime: '09:00', endTime: '17:00' })
    );

    (planningApi.getCompletePlan as any).mockResolvedValueOnce(mockCompletePlanResponse);

    render(
      <BrowserRouter>
        <PlanningWizardProvider>
          <CompletePlanPage />
        </PlanningWizardProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Ready to Generate Your Complete Event Plan/i)).toBeInTheDocument();

    const generateBtn = screen.getByRole('button', { name: /Generate Complete Event Plan/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(planningApi.getCompletePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: 1,
          selected_plan: expect.objectContaining({
            plan_id: 'plan_max_reusable',
          }),
          start_time: '09:00',
          end_time: '17:00',
        })
      );
    });

    // Dashboard sections should now render
    await waitFor(() => {
      expect(screen.getByText('Event Timetable')).toBeInTheDocument();
      expect(screen.getByText('Preparation & Delivery Checklist')).toBeInTheDocument();
      expect(screen.getByText('Resource & Material Requirements')).toBeInTheDocument();
      expect(screen.getByText('Plan Budget Summary')).toBeInTheDocument();
    });
  });

  it('displays timetable slots, activity badges, and prominent conflicts', () => {
    render(
      <EventTimetable
        dailyTimetable={mockCompletePlanResponse.daily_timetable}
        schedulingWarnings={mockCompletePlanResponse.scheduling_warnings}
        schedulingConflicts={mockCompletePlanResponse.scheduling_conflicts}
      />
    );

    expect(screen.getByText('Sustainable Venue Setup')).toBeInTheDocument();
    expect(screen.getAllByText('Networking Lunch').length).toBeGreaterThan(0);
    expect(screen.getByText(/Meal: LUNCH/i)).toBeInTheDocument();
    expect(screen.getByText(/Eco Action/i)).toBeInTheDocument();

    // 12-hour formatted slot times
    expect(screen.getByText('09:00 AM – 10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('01:00 PM – 02:00 PM')).toBeInTheDocument();

    // Scheduling conflict alert must be visible
    expect(screen.getByRole('alert', { name: /Scheduling conflicts warning/i })).toBeInTheDocument();
    expect(screen.getByText(/BUFFER TIGHT/i)).toBeInTheDocument();
    expect(screen.getByText(/Tight transition buffer before lunch/i)).toBeInTheDocument();
  });

  it('supports interactive checklist checkboxes and displays temporary progress notice', () => {
    render(<ExecutionChecklist checklist={mockCompletePlanResponse.checklist} />);

    expect(screen.getByText(/Session-only Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 2 \(0%\)/i)).toBeInTheDocument();

    const task1Checkbox = screen.getByRole('button', {
      name: /Mark task Confirm Dishwashing Station as complete/i,
    });
    fireEvent.click(task1Checkbox);

    // Progress counter should update
    expect(screen.getByText(/1 \/ 2 \(50%\)/i)).toBeInTheDocument();
  });

  it('displays resource manifest separating estimates from unconfirmed equipment', () => {
    render(<ResourceManifest manifest={mockCompletePlanResponse.resource_manifest} />);

    expect(screen.getByText(/Catering & Food Portions/i)).toBeInTheDocument();
    expect(screen.getByText(/200 portions/i)).toBeInTheDocument();
    expect(screen.getByText(/450 items/i)).toBeInTheDocument();
    expect(screen.getByText(/3-Stream Waste Sorting Stations/i)).toBeInTheDocument();

    // Must clearly state that equipment requires confirmation
    expect(screen.getByText(/Confirmation Required/i)).toBeInTheDocument();
    expect(screen.getByText(/Unconfirmed suggestion/i)).toBeInTheDocument();
  });

  it('displays budget deficit alert when plan exceeds budget limit and avoids zeroing missing values', () => {
    const deficitBudget = {
      total_budget: '40000',
      currency: 'INR',
      estimated_plan_cost: '45000',
      food_cost: '35000',
      packaging_cost: null, // missing packaging breakdown
      remaining_contingency: null,
      is_budget_feasible: false,
      budget_deficit: '5000',
      notes: 'Exceeds budget limit by ₹5,000.',
    };

    render(<PlanBudgetSummary budgetSummary={deficitBudget} />);

    expect(screen.getByRole('alert', { name: /Budget deficit alert/i })).toBeInTheDocument();
    expect(screen.getByText(/Budget Ceiling Exceeded/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₹5,000/i).length).toBeGreaterThan(0);

    // Missing value must display as 'Not estimated' rather than zero
    expect(screen.getByText(/Not estimated/i)).toBeInTheDocument();
  });

  it('translates technical parameter keys into plain language in assumptions disclosure', () => {
    render(
      <AssumptionsDisclosure
        assumptions={mockCompletePlanResponse.assumptions_and_confirmations}
      />
    );

    // Check confirmation items
    expect(
      screen.getByText(/Confirm venue dishwashing facilities with campus maintenance/i)
    ).toBeInTheDocument();

    // Open assumptions accordion
    const toggleBtn = screen.getByRole('button', { name: /Planning Assumptions/i });
    fireEvent.click(toggleBtn);

    // Parameter key should be translated
    expect(screen.getByText(/Expected leftover food/i)).toBeInTheDocument();
    expect(screen.getByText(/15%/i)).toBeInTheDocument();
  });
});
