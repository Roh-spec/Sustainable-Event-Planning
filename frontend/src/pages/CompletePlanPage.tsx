import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  AlertCircle,
  Calendar,
  Users,
  Clock,
  Layers,
  Leaf,
} from "lucide-react";
import { LedgerIcon } from "../components/icons";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { EventSummaryBanner } from "../components/wizard/EventSummaryBanner";
import { TimingWindowBar } from "../components/complete_plan/TimingWindowBar";
import { EventTimetable } from "../components/complete_plan/EventTimetable";
import { ExecutionChecklist } from "../components/complete_plan/ExecutionChecklist";
import { ResourceManifest } from "../components/complete_plan/ResourceManifest";
import { PlanBudgetSummary } from "../components/complete_plan/PlanBudgetSummary";
import { SustainabilityActionsList } from "../components/complete_plan/SustainabilityActionsList";
import { AssumptionsDisclosure } from "../components/complete_plan/AssumptionsDisclosure";
import { planningApi } from "../api/planning";
import { CompletePlanRequest } from "../types/completePlan";
import { usePageTitle } from "../hooks/usePageTitle";
import { formatTimeWindow12Hour } from "../utils/timeFormatting";

export const CompletePlanPage: React.FC = () => {
  usePageTitle("Complete Plan · EcoPlan");
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
        setError(`Failed to load event details: ${err.message}`),
      );
    }
  }, [eventId]);

  // Set default event date if none is set
  useEffect(() => {
    if (!timingConfig.eventDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 14); // 2 weeks out default
      const defaultDateStr = tomorrow.toISOString().split("T")[0];
      setTimingConfig((prev) => ({
        ...prev,
        eventDate: defaultDateStr,
      }));
    }
  }, [timingConfig.eventDate]);

  // Demo preview loader for visual inspection and development
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "true") {
      const demoCompletePlan = {
        event_overview: {
          event_id: Number(eventId) || 1,
          name: event?.name || "Eco Innovators Summit 2026",
          event_type: "CONFERENCE",
          expected_attendees: 150,
          duration_days: 1,
          location: "Main Auditorium, Campus Green Hall",
          event_date: "2026-11-20",
          start_time: "09:00",
          end_time: "17:00",
          selected_plan_name: "Pragmatic Circular Plan",
          selected_plan_objective: "BALANCED",
          is_feasible: true,
        },
        daily_timetable: [
          {
            day_number: 1,
            date: "2026-11-20",
            start_time: "09:00",
            end_time: "17:00",
            total_duration_minutes: 480,
            slots: [
              {
                slot_id: "demo_slot_1",
                day: 1,
                start_time: "09:00",
                end_time: "10:00",
                duration_minutes: 60,
                title: "Sustainable Venue Setup",
                activity_type: "SETUP" as const,
                description:
                  "Unpack dishware, calibrate sorting signage, and deploy water refilling stations.",
                is_meal: false,
                is_sustainability_action: true,
                is_suggestion: true,
              },
              {
                slot_id: "demo_slot_2",
                day: 1,
                start_time: "10:00",
                end_time: "11:15",
                duration_minutes: 75,
                title: "Opening Keynote & Climate Action Panels",
                activity_type: "KEYNOTE" as const,
                description:
                  "Keynote presentation with live digital audience participation (zero paper collateral).",
                is_meal: false,
                is_sustainability_action: false,
                is_suggestion: false,
              },
              {
                slot_id: "demo_slot_3",
                day: 1,
                start_time: "11:15",
                end_time: "11:30",
                duration_minutes: 15,
                title: "Zero-Waste Tea & Hydration Break",
                activity_type: "BREAK" as const,
                description:
                  "Local herbal tea served in reusable ceramic mugs and campus dispensers.",
                is_meal: false,
                is_sustainability_action: true,
                is_suggestion: false,
              },
              {
                slot_id: "demo_slot_4",
                day: 1,
                start_time: "11:30",
                end_time: "13:00",
                duration_minutes: 90,
                title: "Interactive Circular Economy Workshops",
                activity_type: "WORKSHOP" as const,
                description:
                  "Collaborative breakout working sessions across 4 sustainable project tracks.",
                is_meal: false,
                is_sustainability_action: false,
                is_suggestion: false,
              },
              {
                slot_id: "demo_slot_5",
                day: 1,
                start_time: "13:00",
                end_time: "14:15",
                duration_minutes: 75,
                title: "Networking Lunch",
                activity_type: "MEAL" as const,
                description:
                  "Locally sourced plant-forward buffet with 100% washable stainless steel tableware.",
                is_meal: true,
                meal_type: "LUNCH" as const,
                is_sustainability_action: true,
                is_suggestion: false,
              },
              {
                slot_id: "demo_slot_6",
                day: 1,
                start_time: "14:15",
                end_time: "16:00",
                duration_minutes: 105,
                title: "Green Innovation Showcase & Pitch Finals",
                activity_type: "COMPETITION" as const,
                description:
                  "Student venture pitches evaluated on LCA footprints and community durability.",
                is_meal: false,
                is_sustainability_action: false,
                is_suggestion: false,
              },
              {
                slot_id: "demo_slot_7",
                day: 1,
                start_time: "16:00",
                end_time: "17:00",
                duration_minutes: 60,
                title: "Dishware Return & Composting Teardown",
                activity_type: "TEARDOWN" as const,
                description:
                  "Collect reusables for high-efficiency sanitization and weigh food waste for audit.",
                is_meal: false,
                is_sustainability_action: true,
                is_suggestion: true,
              },
            ],
          },
        ],
        scheduling_warnings: ["Tight transition buffer before lunch."],
        scheduling_conflicts: [
          {
            conflict_type: "BUFFER_TIGHT",
            description:
              "Less than 15 minutes buffer between morning workshop and lunch service.",
            affected_activities: [
              "Interactive Circular Economy Workshops",
              "Networking Lunch",
            ],
            severity: "WARNING",
          },
        ],
        checklist: [
          {
            task_id: "chk_1",
            title: "Confirm Dishwashing Station",
            description:
              "Ensure hot water supply and sanitizing cycle capacity for 450 reusable items.",
            phase: "BEFORE_EVENT" as const,
            category: "WASTE_MANAGEMENT" as const,
            deadline_relative: "T-7 days",
            is_sustainability_action: true,
            is_suggestion: true,
          },
          {
            task_id: "chk_2",
            title: "Finalize Food Headcount Guarantee with Organic Caterer",
            description:
              "Submit confirmed 150 attendee count with 70% vegetarian ratio guarantee.",
            phase: "BEFORE_EVENT" as const,
            category: "CATERING" as const,
            deadline_relative: "T-3 days",
            is_sustainability_action: true,
            is_suggestion: false,
          },
          {
            task_id: "chk_3",
            title: "Brief Student Volunteer Green Team on Waste Sorting",
            description:
              "15-minute briefing on guiding attendees between compost, clean recyclables, and landfill.",
            phase: "EVENT_DAY_MORNING" as const,
            category: "COMMUNICATIONS" as const,
            deadline_relative: "08:30 AM",
            is_sustainability_action: true,
            is_suggestion: false,
          },
          {
            task_id: "chk_4",
            title: "Live Catering Replenishment Check",
            description:
              "Check buffet food levels midway through lunch to avoid opening redundant trays.",
            phase: "DURING_EVENT" as const,
            category: "CATERING" as const,
            deadline_relative: "01:30 PM",
            is_sustainability_action: true,
            is_suggestion: true,
          },
          {
            task_id: "chk_5",
            title: "Post-Event Food Waste Audit & Compost Handover",
            description:
              "Weigh leftover food bins, record metric on dashboard, and dispatch to campus composting.",
            phase: "AFTER_EVENT" as const,
            category: "WASTE_MANAGEMENT" as const,
            deadline_relative: "05:15 PM",
            is_sustainability_action: true,
            is_suggestion: false,
          },
        ],
        resource_manifest: {
          food_and_catering: {
            estimated_servings: 200,
            veg_servings: 140,
            non_veg_servings: 60,
            estimated_food_waste_kg: "12.5",
            provenance:
              "Calculated from food module assumptions (14% buffer margin)",
          },
          tableware_and_serving: {
            reusable_items: "450",
            single_use_items: "50",
            reusable_percentage: "90",
            provenance:
              "Calculated from waste module packaging configurations",
          },
          plastic_items: {
            estimated_plastic_items: "0",
            description:
              "Completely eliminated through campus water refilling points.",
            provenance: "Campus plastic reduction policy",
          },
          suggested_equipment: [
            {
              name: "3-Stream Waste Sorting Stations",
              suggested_quantity: "4 stations",
              category: "WASTE_MANAGEMENT",
              notes: "Position 2 near buffet exit and 2 in breakout atrium.",
              is_suggestion: true,
            },
            {
              name: "Commercial Dish Sanitization Racks",
              suggested_quantity: "6 racks",
              category: "LOGISTICS",
              notes:
                "Required for holding 450 reusable plates and cutlery sets.",
              is_suggestion: true,
            },
          ],
        },
        budget_summary: {
          total_budget: "60000",
          currency: "INR",
          estimated_plan_cost: "48000",
          food_cost: "34500",
          packaging_cost: "13500",
          remaining_contingency: "12000",
          is_budget_feasible: true,
          budget_deficit: null,
          notes:
            "Comfortably feasible within allocated INR 60,000 budget ceiling.",
        },
        sustainability_actions: [
          {
            title: "70% Reusable Tableware Fleet Deployment",
            action_type: "REUSABLE_PACKAGING",
            description:
              "Serve all main meal courses on sanitized stainless steel plates and reusable metal cutlery.",
            target_metric: "90% reusable tableware",
            verification_step:
              "Audit dishwashing staging area 30 minutes before meal service.",
          },
          {
            title: "Campus Water Refill Station Integration",
            action_type: "SINGLE_USE_REDUCTION",
            description:
              "Provide 3 high-capacity water dispensers and invite attendees to bring personal vessels.",
            target_metric: "100% elimination of single-use PET water bottles",
            verification_step:
              "Inspect hydration points and verify zero plastic bottle distribution.",
          },
          {
            title: "Leftover Food Donation & Composting Protocol",
            action_type: "FOOD_WASTE_REDUCTION",
            description:
              "Unserved batch portions chilled and transferred to campus shelter; plate scrapings composted.",
            target_metric: "< 12.5 kg total organic food waste",
            verification_step:
              "Weigh food scrap buckets at teardown and record log entry.",
          },
        ],
        assumptions_and_confirmations: {
          planning_assumptions: [
            {
              parameter: "food_waste_percentage",
              value: "0.14",
              unit: "ratio",
              source_type: "REFERENCE" as const,
              is_resolved: true,
              explanation:
                "Expected edible surplus based on institutional catering standards.",
            },
            {
              parameter: "tableware_loss_rate",
              value: "0.02",
              unit: "ratio",
              source_type: "REFERENCE" as const,
              is_resolved: true,
              explanation:
                "2% accidental breakage / loss allowance for reusable ceramic/metal tableware.",
            },
          ],
          items_requiring_confirmation: [
            "Confirm venue dishwashing facilities with campus maintenance.",
            "Verify caterer agreement to load food onto reusable venue platters.",
            "Ensure custodial staff access to organic compost receptacles.",
          ],
        },
      };
      setCompletePlan(demoCompletePlan);
    }
  }, []);

  const handleTimingChange = (
    eventDate: string,
    startTime: string,
    endTime: string,
  ) => {
    setTimingConfig({ eventDate, startTime, endTime });
  };

  const handleGenerateCompletePlan = async (timing: {
    eventDate: string;
    startTime: string;
    endTime: string;
  }) => {
    if (!event) {
      setError("Active event not found. Please reload the page.");
      return;
    }

    if (!selectedPlan) {
      setError(
        "No sustainable plan selected. Please go to Step 6 to confirm your plan first.",
      );
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
              foodConfig.budgetMode === "ENTER" && foodConfig.food_budget
                ? Number(foodConfig.food_budget)
                : undefined,
            known_unit_cost:
              foodConfig.costApproach === "UNIT" && foodConfig.known_unit_cost
                ? Number(foodConfig.known_unit_cost)
                : undefined,
            known_total_cost:
              foodConfig.costApproach === "TOTAL" && foodConfig.known_total_cost
                ? Number(foodConfig.known_total_cost)
                : undefined,
            cost_pricing_unit:
              foodConfig.costApproach === "UNIT"
                ? foodConfig.cost_pricing_unit
                : undefined,
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
        "Failed to generate complete plan. Please check your time window and try again.";
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
        <WizardProgress
          currentStep={7}
          eventId={event?.id || Number(eventId)}
        />
        <EventSummaryBanner event={event} budget={budget} />
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-6 border-b border-line print:hidden">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-paper-inset text-moss-800 text-xs font-semibold tracking-wide uppercase mb-2 border border-line">
            <LedgerIcon className="w-3.5 h-3.5 text-moss-700" />
            <span>Step 7 of 7 • Complete Event Plan</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Complete Event Plan
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
            Deterministic timetable, operational execution checklist, resource
            requirements, and sustainability verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/events/${event?.id || eventId}/plans`)}
            className="btn-ghost text-xs py-2 px-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Plans</span>
          </button>

          {completePlan && (
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary text-xs py-2 px-4"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State: No Plan Selected in Step 6 */}
      {!selectedPlan && !completePlan ? (
        <div className="surface-sheet p-12 text-center max-w-2xl mx-auto my-8 border border-line">
          <div className="text-clay-700 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-lg font-bold text-ink mb-2">
            No Sustainable Plan Selected Yet
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted mb-6 leading-relaxed">
            A complete event plan requires an organizer-confirmed sustainable
            plan alternative from Step 6. Please review and select a plan
            alternative first.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/events/${event?.id || eventId}/plans`)}
            className="btn-primary"
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
              className="mb-8 p-4 rounded-control bg-clay-50 border border-clay-300 text-clay-900 text-sm flex items-start space-x-3 print:hidden"
            >
              <AlertCircle className="w-5 h-5 text-clay-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold">Generation Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Generated Plan Dashboard View */}
          {completePlan ? (
            <div className="space-y-8">
              {/* Event Overview Card / Day Sheet Masthead */}
              <div className="surface-sheet p-6 sm:p-8 border border-line">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-line gap-4">
                  <div>
                    <span className="label-kicker text-[10px]">
                      Confirmed Plan Overview
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-1.5">
                      {overview?.name || event?.name}
                    </h2>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Type:{" "}
                      <strong className="text-ink">
                        {String(
                          overview?.event_type || event?.event_type || "",
                        ).replace(/_/g, " ")}
                      </strong>{" "}
                      • Venue:{" "}
                      <strong className="text-ink">
                        {overview?.location ||
                          event?.location ||
                          "Campus Venue"}
                      </strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-moss-50 text-moss-900 border border-moss-200 text-xs font-bold font-mono">
                      <Leaf className="w-3.5 h-3.5 text-moss-600" />
                      <span>
                        {overview?.selected_plan_name ||
                          selectedPlan?.name ||
                          "Sustainable Plan"}
                      </span>
                    </span>
                    {overview?.is_feasible ? (
                      <span className="px-3 py-1.5 rounded-full bg-moss-100 text-moss-800 text-xs font-bold border border-moss-200">
                        Feasible Plan
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full bg-clay-100 text-clay-800 text-xs font-bold border border-clay-300">
                        Budget Adjustment Required
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 rounded-control bg-paper-inset/40 border border-line">
                    <div className="flex items-center space-x-1.5 text-ink-muted mb-1">
                      <Users className="w-4 h-4 text-ink-muted" />
                      <span className="label-kicker text-[10px]">Attendees</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-ink tabular-nums">
                      {overview?.expected_attendees ||
                        event?.expected_attendees}{" "}
                      participants
                    </div>
                  </div>

                  <div className="p-3.5 rounded-control bg-paper-inset/40 border border-line">
                    <div className="flex items-center space-x-1.5 text-ink-muted mb-1">
                      <Calendar className="w-4 h-4 text-ink-muted" />
                      <span className="label-kicker text-[10px]">Event Date</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-ink tabular-nums">
                      {overview?.event_date || timingConfig.eventDate}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-control bg-paper-inset/40 border border-line">
                    <div className="flex items-center space-x-1.5 text-ink-muted mb-1">
                      <Clock className="w-4 h-4 text-ink-muted" />
                      <span className="label-kicker text-[10px]">Daily Hours</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-ink tabular-nums">
                      {formatTimeWindow12Hour(
                        overview?.start_time || timingConfig.startTime,
                        overview?.end_time || timingConfig.endTime,
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-control bg-paper-inset/40 border border-line">
                    <div className="flex items-center space-x-1.5 text-ink-muted mb-1">
                      <Layers className="w-4 h-4 text-ink-muted" />
                      <span className="label-kicker text-[10px]">Duration</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-ink tabular-nums">
                      {overview?.duration_days || event?.duration_days || 1}{" "}
                      day(s)
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Timetable as a Real Timeline */}
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
              <SustainabilityActionsList
                actions={completePlan.sustainability_actions}
              />

              {/* 6. Transparency & Assumptions */}
              <AssumptionsDisclosure
                assumptions={completePlan.assumptions_and_confirmations}
              />
            </div>
          ) : !isGenerating ? (
            /* Empty State: Ready to Generate */
            <div className="surface-sheet p-12 text-center max-w-2xl mx-auto my-8 border border-line">
              <div className="w-12 h-12 rounded-control bg-paper-inset text-moss-700 flex items-center justify-center mx-auto mb-4 border border-line">
                <LedgerIcon className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink mb-2">
                Ready to Generate Your Complete Event Plan
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted mb-6 leading-relaxed">
                You have confirmed{" "}
                <strong>
                  {selectedPlan?.name ||
                    overview?.selected_plan_name ||
                    "Sustainable Plan"}
                </strong>{" "}
                as your sustainable plan. Click{" "}
                <em>Generate Complete Event Plan</em> above to create your
                timetable, operational checklist, resource requirements, and
                sustainability verification report.
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
