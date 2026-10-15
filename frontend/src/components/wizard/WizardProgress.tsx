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
import { pulseActiveStep } from "../../utils/animations";

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
  const currentStepRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (currentStepRef.current) {
      pulseActiveStep(currentStepRef.current);
    }
  }, [currentStep]);

  const handleStepClick = (step: WizardStep) => {
    if (step.id === 1) {
      navigate("/events/new");
    } else if (effectiveEventId && step.id <= currentStep + 1) {
      navigate(step.path(effectiveEventId));
    }
  };

  return (
    <div className="w-full mb-8">
      <div className="surface-sheet px-3 sm:px-5 py-4">
        <nav aria-label="Progress">
          <ol className="flex items-start justify-between gap-1">
            {WIZARD_STEPS.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isClickable =
                step.id === 1 || (effectiveEventId && step.id <= currentStep);
              const StepIcon = step.icon;

              return (
                <li key={step.key} className="flex-1 relative min-w-0">
                  <div className="flex items-center justify-center">
                    {index > 0 && (
                      <div
                        className={`absolute left-0 right-1/2 top-[1.125rem] h-px ${
                          step.id <= currentStep ? "bg-moss-600" : "bg-line"
                        }`}
                        style={{ zIndex: 0 }}
                      />
                    )}
                    {index < WIZARD_STEPS.length - 1 && (
                      <div
                        className={`absolute left-1/2 right-0 top-[1.125rem] h-px ${
                          step.id < currentStep ? "bg-moss-600" : "bg-line"
                        }`}
                        style={{ zIndex: 0 }}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => isClickable && handleStepClick(step)}
                      disabled={!isClickable}
                      aria-current={isCurrent ? "step" : undefined}
                      className={`relative z-10 flex flex-col items-center group focus:outline-none ${
                        isClickable
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      <div
                        ref={isCurrent ? currentStepRef : undefined}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                          isCompleted
                            ? "bg-moss-600 text-paper-raised"
                            : isCurrent
                              ? "bg-paper-raised text-moss-800 ring-2 ring-moss-600 ring-offset-2 ring-offset-paper-raised"
                              : "bg-paper-inset border border-line text-ink-faint"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" strokeWidth={2.25} />
                        ) : (
                          <StepIcon
                            className={`w-4 h-4 ${
                              isCurrent ? "text-moss-700" : "text-ink-faint"
                            }`}
                          />
                        )}
                      </div>

                      <span
                        className={`mt-2 text-[11px] sm:text-xs font-semibold text-center leading-tight px-0.5 ${
                          isCurrent
                            ? "text-moss-800"
                            : isCompleted
                              ? "text-ink"
                              : "text-ink-faint"
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
