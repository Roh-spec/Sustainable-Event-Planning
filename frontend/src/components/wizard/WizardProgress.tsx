import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Calendar,
  DollarSign,
  Sliders,
  Utensils,
  Trash2,
  Award,
  ClipboardList,
} from "lucide-react";
import { usePlanningWizard } from "../../context/PlanningWizardContext";

export interface WizardStep {
  id: number;
  key:
    | "event"
    | "budget"
    | "constraints"
    | "food"
    | "waste"
    | "plans"
    | "completePlan";
  label: string;
  path: (eventId?: number) => string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    key: "event",
    label: "Event",
    path: (id) => (id ? `/events/${id}/edit` : "/events/new"),
    icon: Calendar,
  },
  {
    id: 2,
    key: "budget",
    label: "Budget",
    path: (id) => (id ? `/events/${id}/budget` : "/events/new"),
    icon: DollarSign,
  },
  {
    id: 3,
    key: "constraints",
    label: "Constraints",
    path: (id) => (id ? `/events/${id}/constraints` : "/events/new"),
    icon: Sliders,
  },
  {
    id: 4,
    key: "food",
    label: "Food",
    path: (id) => (id ? `/events/${id}/food` : "/events/new"),
    icon: Utensils,
  },
  {
    id: 5,
    key: "waste",
    label: "Waste",
    path: (id) => (id ? `/events/${id}/waste` : "/events/new"),
    icon: Trash2,
  },
  {
    id: 6,
    key: "plans",
    label: "Plans",
    path: (id) => (id ? `/events/${id}/plans` : "/events/new"),
    icon: Award,
  },
  {
    id: 7,
    key: "completePlan",
    label: "Complete Event Plan",
    path: (id) => (id ? `/events/${id}/complete-plan` : "/events/new"),
    icon: ClipboardList,
  },
];

interface WizardProgressProps {
  currentStep: number;
  eventId?: number;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  eventId,
}) => {
  const navigate = useNavigate();
  const { event } = usePlanningWizard();
  const effectiveEventId = eventId || event?.id;

  const handleStepClick = (step: WizardStep) => {
    // Only allow navigating if event is created, or if going to step 1
    if (step.id === 1) {
      navigate("/events/new");
    } else if (effectiveEventId && step.id <= currentStep + 1) {
      navigate(step.path(effectiveEventId));
    }
  };

  return (
    <div className="w-full bg-white border-b border-slate-200 py-4 shadow-sm mb-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isClickable =
                step.id === 1 || (effectiveEventId && step.id <= currentStep);
              const StepIcon = step.icon;

              return (
                <li key={step.key} className="flex-1 relative">
                  <div className="flex items-center">
                    {/* Connecting line */}
                    {index > 0 && (
                      <div
                        className={`absolute left-0 -translate-x-1/2 top-4 w-full h-0.5 transition-colors ${
                          step.id <= currentStep
                            ? "bg-emerald-600"
                            : "bg-slate-200"
                        }`}
                        style={{ zIndex: 0 }}
                      />
                    )}

                    {/* Step button / circle */}
                    <button
                      type="button"
                      onClick={() => isClickable && handleStepClick(step)}
                      disabled={!isClickable}
                      aria-current={isCurrent ? "step" : undefined}
                      className={`relative z-10 flex flex-col items-center group focus:outline-none ${
                        isClickable
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                          isCompleted
                            ? "bg-emerald-600 text-white shadow-emerald-500/20"
                            : isCurrent
                              ? "bg-white border-2 border-emerald-600 text-emerald-700 ring-4 ring-emerald-100 shadow-md"
                              : "bg-white border border-slate-300 text-slate-400 group-hover:border-slate-400"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        ) : (
                          <StepIcon
                            className={`w-4 h-4 ${isCurrent ? "text-emerald-600" : "text-slate-400"}`}
                          />
                        )}
                      </div>

                      <span
                        className={`mt-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                          isCurrent
                            ? "text-emerald-700 font-bold"
                            : isCompleted
                              ? "text-slate-700"
                              : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};
