import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Sparkles,
  AlertCircle,
  Calendar,
  Users,
  Clock,
  Layers,
  Leaf,
} from 'lucide-react';
import { usePlanningWizard } from '../context/PlanningWizardContext';
import { WizardProgress } from '../components/wizard/WizardProgress';
import { EventSummaryBanner } from '../components/wizard/EventSummaryBanner';
import { TimingWindowBar } from '../components/complete_plan/TimingWindowBar';
import { EventTimetable } from '../components/complete_plan/EventTimetable';
import { ExecutionChecklist } from '../components/complete_plan/ExecutionChecklist';
import { ResourceManifest } from '../components/complete_plan/ResourceManifest';
import { PlanBudgetSummary } from '../components/complete_plan/PlanBudgetSummary';
import { SustainabilityActionsList } from '../components/complete_plan/SustainabilityActionsList';
import { AssumptionsDisclosure } from '../components/complete_plan/AssumptionsDisclosure';
import { planningApi } from '../api/planning';
import { CompletePlanRequest } from '../types/completePlan';
import { formatTimeWindow12Hour } from '../utils/timeFormatting';

export const CompletePlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    loadEvent,
    budget,
    selectedPlan,
    foodConfig,
    wasteConfig,
    completePlan,
    setCompletePlan,
    timingConfig,
    setTimingConfig,
  } = usePlanningWizard();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize event if not loaded
  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) =>
        setError(`Failed to load event details: ${err.message}`)
      );
    }
  }, [eventId]);

  // Set default event date if none is set
  useEffect(() => {
    if (!timingConfig.eventDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 14); // 2 weeks out default
      const defaultDateStr = tomorrow.toISOString().split('T')[0];
      setTimingConfig((prev) => ({
        ...prev,
        eventDate: defaultDateStr,
      }));
    }
  }, [timingConfig.eventDate]);

  const handleTimingChange = (eventDate: string, startTime: string, endTime: string) => {
    setTimingConfig({ eventDate, startTime, endTime });
  };

  const handleGenerateCompletePlan = async (timing: {
    eventDate: string;
    startTime: string;
    endTime: string;
  }) => {
    if (!event) {
      setError('Active event not found. Please reload the page.');
      return;
    }

    if (!selectedPlan) {
      setError('No sustainable plan selected. Please go to Step 6 to confirm your plan first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const selectedMealTypes = foodConfig.meals.map((m) => m.meal_type);

      const requestPayload: CompletePlanRequest = {
        event_id: event.id,
        event_date: timing.eventDate,
        start_time: timing.startTime,
        end_time: timing.endTime,
        duration_days: event.duration_days,
        selected_plan: selectedPlan,
        selected_meal_types: selectedMealTypes,
        include_setup_cleanup: true,
        module_context: {
          food: {
            event_id: event.id,
            meals: foodConfig.meals,
            default_dietary_preference: foodConfig.default_dietary_preference,
            vegetarian_ratio: foodConfig.vegetarian_ratio
              ? Number(foodConfig.vegetarian_ratio)
              : undefined,
            food_budget:
              foodConfig.budgetMode === 'ENTER' && foodConfig.food_budget
                ? Number(foodConfig.food_budget)
                : undefined,
            known_unit_cost:
              foodConfig.costApproach === 'UNIT' && foodConfig.known_unit_cost
                ? Number(foodConfig.known_unit_cost)
                : undefined,
            known_total_cost:
              foodConfig.costApproach === 'TOTAL' && foodConfig.known_total_cost
                ? Number(foodConfig.known_total_cost)
                : undefined,
            cost_pricing_unit:
              foodConfig.costApproach === 'UNIT' ? foodConfig.cost_pricing_unit : undefined,
          },
          waste: {
            event_id: event.id,
            packaging_items: wasteConfig.packaging_items,
            plastic_items: wasteConfig.plastic_items,
            other_waste_items: wasteConfig.other_waste_items,
          },
        },
      };

      const response = await planningApi.getCompletePlan(requestPayload);
      setCompletePlan(response);
      setTimingConfig(timing);
    } catch (err: any) {
      const message =
        err.message ||
        'Failed to generate complete plan. Please check your time window and try again.';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const overview = completePlan?.event_overview;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Wizard Progress (Step 7) */}
      <div className="print:hidden">
        <WizardProgress currentStep={7} eventId={event?.id || Number(eventId)} />
        <EventSummaryBanner event={event} budget={budget} />
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-6 border-b border-slate-200 print:hidden">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Step 7 of 7 • Complete Event Plan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Complete Event Plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deterministic timetable, operational execution checklist, resource requirements, and sustainability verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/events/${event?.id || eventId}/plans`)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Plans</span>
          </button>

          {completePlan && (
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors focus:outline-none"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State: No Plan Selected in Step 6 */}
      {!selectedPlan ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center max-w-2xl mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-2">
            No Sustainable Plan Selected Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            A complete event plan requires an organizer-confirmed sustainable plan alternative from Step 6. Please review and select a plan alternative first.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/events/${event?.id || eventId}/plans`)}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Step 6 (Select Plan)</span>
          </button>
        </div>
      ) : (
        <>
          {/* Timing Window Configuration Bar */}
          <div className="print:hidden">
            <TimingWindowBar
              eventDate={timingConfig.eventDate}
              startTime={timingConfig.startTime}
              endTime={timingConfig.endTime}
              durationDays={event?.duration_days || 1}
              isGenerating={isGenerating}
              hasPlan={Boolean(completePlan)}
              onTimingChange={handleTimingChange}
              onGenerate={handleGenerateCompletePlan}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3 print:hidden"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold">Generation Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Generated Plan Dashboard View */}
          {completePlan ? (
            <div className="space-y-8">
              {/* Event Overview Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Confirmed Plan Overview
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
                      {overview?.name || event?.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Type:{' '}
                      <strong className="text-slate-700">
                        {String(overview?.event_type || event?.event_type || '').replace(/_/g, ' ')}
                      </strong>{' '}
                      • Venue:{' '}
                      <strong className="text-slate-700">
                        {overview?.location || event?.location || 'Campus Venue'}
                      </strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
                      <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{overview?.selected_plan_name || selectedPlan.name}</span>
                    </span>
                    {overview?.is_feasible ? (
                      <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                        Feasible Plan
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold">
                        Budget Adjustment Required
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Attendees</span>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">
                      {overview?.expected_attendees || event?.expected_attendees} participants
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Event Date</span>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">
                      {overview?.event_date || timingConfig.eventDate}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Daily Hours</span>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">
                      {formatTimeWindow12Hour(
                        overview?.start_time || timingConfig.startTime,
                        overview?.end_time || timingConfig.endTime
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span>Duration</span>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">
                      {overview?.duration_days || event?.duration_days || 1} day(s)
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Timetable */}
              <EventTimetable
                dailyTimetable={completePlan.daily_timetable}
                schedulingWarnings={completePlan.scheduling_warnings}
                schedulingConflicts={completePlan.scheduling_conflicts}
              />

              {/* 2. Execution Checklist */}
              <ExecutionChecklist checklist={completePlan.checklist} />

              {/* 3. Resource Requirements */}
              <ResourceManifest manifest={completePlan.resource_manifest} />

              {/* 4. Budget Feasibility */}
              <PlanBudgetSummary budgetSummary={completePlan.budget_summary} />

              {/* 5. Sustainability Commitments */}
              <SustainabilityActionsList actions={completePlan.sustainability_actions} />

              {/* 6. Transparency & Assumptions */}
              <AssumptionsDisclosure
                assumptions={completePlan.assumptions_and_confirmations}
              />
            </div>
          ) : !isGenerating ? (
            /* Empty State: Ready to Generate */
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center max-w-2xl mx-auto my-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                Ready to Generate Your Complete Event Plan
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                You have confirmed <strong>{selectedPlan.name}</strong> as your sustainable plan.
                Click <em>Generate Complete Event Plan</em> above to create your timetable, operational checklist, resource requirements, and sustainability verification report.
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
