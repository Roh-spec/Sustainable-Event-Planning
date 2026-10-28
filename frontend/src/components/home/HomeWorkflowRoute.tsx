import React from "react";
import {
  HackathonMark,
  ScaleIcon,
  SproutIcon,
  PlateIcon,
  BinIcon,
  LedgerIcon,
} from "../icons";

export interface WorkflowStep {
  step: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { step: "01", label: "Event", desc: "Type, count & duration", icon: HackathonMark },
  { step: "02", label: "Budget", desc: "Hard ceiling in ₹", icon: ScaleIcon },
  { step: "03", label: "Limits", desc: "Must-haves & dietary", icon: SproutIcon },
  { step: "04", label: "Food", desc: "Meal quantities & surplus", icon: PlateIcon },
  { step: "05", label: "Waste", desc: "Disposables vs reusable", icon: BinIcon },
  { step: "06", label: "Plans", desc: "Side-by-side ledger", icon: LedgerIcon },
];

export interface HomeWorkflowRouteProps {
  className?: string;
}

/**
 * HomeWorkflowRoute:
 * Field-station guided survey route displaying the 6 sequential ledger steps.
 * Features a drawn waypoint route line and tactile waypoint nodes.
 */
export const HomeWorkflowRoute: React.FC<HomeWorkflowRouteProps> = ({
  className = "",
}) => {
  return (
    <section className={`surface-sheet p-6 sm:p-8 space-y-6 ${className}`}>
      <div className="border-b border-line pb-4">
        <span className="label-kicker">Field Guide</span>
        <h2 className="font-display text-2xl sm:text-3xl text-ink mt-0.5">
          The Six Ledger Steps
        </h2>
        <p className="text-xs text-ink-muted font-sans mt-1">
          A sequential planning route designed around real physical constraints.
        </p>
      </div>

      {/* Timeline: horizontal on desktop with route-draw, vertical on mobile */}
      <div className="relative pt-2">
        {/* Desktop horizontal route line with drawn animation */}
        <div
          className="hidden lg:block absolute top-[28px] left-6 right-6 h-[1.5px] bg-line z-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-full h-full bg-moss-700/60 route-draw" />
        </div>

        {/* Mobile vertical route line */}
        <div
          className="lg:hidden absolute top-4 bottom-4 left-[23px] w-[1.5px] bg-line z-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-full h-full bg-moss-700/60" />
        </div>

        <ol className="grid grid-cols-1 lg:grid-cols-6 gap-6 lg:gap-4 relative z-10">
          {WORKFLOW_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.step}
                className="flex lg:flex-col items-start lg:items-start space-x-4 lg:space-x-0 group"
              >
                {/* Waypoint node marker */}
                <div className="w-12 h-12 rounded-full border border-line-strong bg-paper-raised flex items-center justify-center flex-shrink-0 text-moss-700 shadow-subtle group-hover:border-moss-700 transition-colors">
                  <Icon size={20} className="stroke-[1.75]" />
                </div>

                <div className="lg:mt-3 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] font-bold text-moss-700">
                      {item.step}
                    </span>
                    <h3 className="font-sans text-sm font-bold text-ink tracking-tight">
                      {item.label}
                    </h3>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
