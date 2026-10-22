import React from "react";
import { Check } from "lucide-react";
import { WaypointIcon } from "../icons";

export interface StepItem {
  id: number | string;
  label: string;
  sublabel?: string;
}

export interface WaypointStepperProps {
  steps: StepItem[];
  currentStep: number | string;
  onStepClick?: (step: StepItem) => void;
  className?: string;
}

/**
 * WaypointStepper Component:
 * Field-station survey route with numbered waypoints and a drawn path.
 * Supports interactive navigation and accessible step status.
 */
export const WaypointStepper: React.FC<WaypointStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = "",
}) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav
      aria-label="Planning Route"
      className={`relative w-full py-4 ${className}`}
    >
      <ol className="flex items-center justify-between w-full relative">
        {/* Drawn Route Path Background Line */}
        <div
          className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[2px] bg-line pointer-events-none"
          aria-hidden="true"
        />

        {/* Drawn Active Progress Line */}
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-[2px] bg-moss-700 pointer-events-none transition-all duration-300"
          style={{
            width: `${
              steps.length > 1
                ? Math.max(0, Math.min(100, (currentIndex / (steps.length - 1)) * 100))
                : 0
            }%`,
          }}
          aria-hidden="true"
        />

        {/* Waypoint Nodes */}
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;

          const isClickable = Boolean(onStepClick && !isFuture);

          return (
            <li
              key={step.id}
              className="relative flex flex-col items-center group z-10"
              aria-current={isCurrent ? "step" : undefined}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step)}
                disabled={!isClickable}
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss-700 focus-visible:ring-offset-2 ${
                  isCompleted
                    ? "bg-moss-700 border-moss-700 text-paper-raised"
                    : isCurrent
                    ? "bg-paper-raised border-moss-700 text-moss-800 shadow-subtle ring-2 ring-moss-700/20"
                    : "bg-paper-raised border-line text-ink-muted"
                } ${isClickable ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
                aria-label={`Step ${idx + 1}: ${step.label}${isCompleted ? " (Completed)" : isCurrent ? " (Current)" : ""}`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : isCurrent ? (
                  <WaypointIcon className="w-4 h-4 text-moss-700" />
                ) : (
                  <span className="font-mono text-xs font-semibold tabular-nums">
                    {idx + 1}
                  </span>
                )}
              </button>

              {/* Waypoint Label */}
              <div className="absolute top-10 flex flex-col items-center text-center w-24">
                <span
                  className={`text-xs font-medium tracking-tight ${
                    isCurrent
                      ? "text-ink font-semibold"
                      : isCompleted
                      ? "text-ink-muted"
                      : "text-ink-faint"
                  }`}
                >
                  {step.label}
                </span>
                {step.sublabel && (
                  <span className="text-[10px] font-mono text-ink-faint hidden sm:inline">
                    {step.sublabel}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
