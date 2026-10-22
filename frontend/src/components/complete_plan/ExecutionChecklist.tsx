import React, { useState } from "react";
import {
  Clock,
  Leaf,
  Info,
  CheckCircle2,
} from "lucide-react";
import { ChecklistItem, ChecklistPhase } from "../../types/completePlan";
import { convertTextTimesTo12Hour } from "../../utils/timeFormatting";

interface ExecutionChecklistProps {
  checklist: ChecklistItem[];
}

const PHASE_CONFIG: Record<
  ChecklistPhase,
  { label: string; description: string; badgeColor: string }
> = {
  BEFORE_EVENT: {
    label: "Before the Event",
    description:
      "Procurement, vendor confirmations, menu orders, and communications",
    badgeColor: "bg-paper-inset text-ink-muted border-line",
  },
  EVENT_DAY_MORNING: {
    label: "Event-Day Preparation",
    description:
      "Morning venue setup, signage, waste sorting stations, and vendor arrivals",
    badgeColor: "bg-clay-50 text-clay-800 border-clay-200",
  },
  DURING_EVENT: {
    label: "During the Event",
    description:
      "Live catering monitoring, waste station guidance, and schedule adherence",
    badgeColor: "bg-moss-50 text-moss-800 border-moss-200",
  },
  AFTER_EVENT: {
    label: "After the Event",
    description:
      "Surplus food donation, dish collection, compost handover, and post-event wrapup",
    badgeColor: "bg-paper-inset text-ink border-line-strong",
  },
};

const formatCategory = (cat: string) => {
  return cat
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const ExecutionChecklist: React.FC<ExecutionChecklistProps> = ({
  checklist,
}) => {
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>("ALL");

  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const totalTasks = checklist?.length || 0;
  const completedCount = completedTaskIds.size;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const phases: ChecklistPhase[] = [
    "BEFORE_EVENT",
    "EVENT_DAY_MORNING",
    "DURING_EVENT",
    "AFTER_EVENT",
  ];

  const displayedPhases =
    selectedPhaseFilter === "ALL"
      ? phases
      : phases.filter((p) => p === selectedPhaseFilter);

  return (
    <div className="surface-sheet p-5 sm:p-8 mb-8 border border-line">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-line gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-paper-inset text-moss-800 text-xs font-semibold tracking-wide uppercase mb-2 border border-line">
            <CheckCircle2 className="w-3.5 h-3.5 text-moss-600" />
            <span>Execution Milestones</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Preparation & Delivery Checklist
          </h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Actionable tasks grouped chronologically to ensure sustainable
            delivery before, during, and after your event.
          </p>
        </div>

        {/* Progress Tally Pill */}
        <div className="flex-shrink-0 bg-paper-inset/40 border border-line rounded-control p-3 sm:w-60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-ink">Checklist Progress</span>
            <span className="font-mono font-bold text-moss-700 tabular-nums">
              {completedCount} / {totalTasks} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-paper rounded-full h-2 overflow-hidden border border-line/60">
            <div
              className="bg-moss-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Temporary Progress Notice */}
      <div className="mb-6 p-3.5 rounded-control bg-paper-inset/40 border border-line text-xs text-ink-muted flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-ink">
            Session-only Tracker:
          </strong>{" "}
          Checkbox completion is saved temporarily in your current browser
          session. Progress will reset if the page session is cleared.
        </div>
      </div>

      {/* Phase Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6 pb-2 border-b border-line">
        <button
          type="button"
          onClick={() => setSelectedPhaseFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition-all ${
            selectedPhaseFilter === "ALL"
              ? "bg-moss-700 text-paper-raised"
              : "bg-paper-inset/50 text-ink-muted hover:text-ink hover:bg-paper-inset border border-line"
          }`}
        >
          All Phases ({totalTasks})
        </button>
        {phases.map((p) => {
          const count = checklist.filter((item) => item.phase === p).length;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPhaseFilter(p)}
              className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition-all ${
                selectedPhaseFilter === p
                  ? "bg-moss-700 text-paper-raised"
                  : "bg-paper-inset/50 text-ink-muted hover:text-ink hover:bg-paper-inset border border-line"
              }`}
            >
              {PHASE_CONFIG[p].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grouped Checklist */}
      <div className="space-y-8">
        {displayedPhases.map((phase) => {
          const phaseItems = checklist.filter((item) => item.phase === phase);
          if (phaseItems.length === 0) return null;

          const config = PHASE_CONFIG[phase];
          return (
            <div key={phase} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-line gap-1">
                <div>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-ink flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-moss-600" />
                    <span>{config.label}</span>
                  </h3>
                  <p className="text-xs text-ink-muted">{config.description}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border self-start sm:self-auto font-mono ${config.badgeColor}`}
                >
                  {phaseItems.length} tasks
                </span>
              </div>

              <div className="space-y-2.5">
                {phaseItems.map((item) => {
                  const isChecked = completedTaskIds.has(item.task_id);
                  return (
                    <div
                      key={item.task_id}
                      onClick={() => toggleTask(item.task_id)}
                      className={`p-4 rounded-sheet border transition-all cursor-pointer flex items-start space-x-3.5 card-hover ${
                        isChecked
                          ? "bg-paper-inset/30 border-line/60 text-ink-faint"
                          : "bg-paper-raised border-line hover:border-moss-400 text-ink shadow-subtle"
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`Mark task ${item.title} as ${isChecked ? "incomplete" : "complete"}`}
                        className="mt-0.5 focus:outline-none flex-shrink-0"
                      >
                        {isChecked ? (
                          <span className="w-5 h-5 rounded-control border-2 border-moss-700 bg-moss-50 inline-flex items-center justify-center">
                            <svg
                              viewBox="0 0 16 16"
                              className="w-3.5 h-3.5 text-moss-800"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path
                                d="M2.5 8.5 L6 12 L13.5 4"
                                className="checklist-tick"
                              />
                            </svg>
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-control border-2 border-line-strong bg-paper hover:border-moss-600 inline-flex items-center justify-center transition-colors" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`font-semibold text-sm ${
                              isChecked
                                ? "line-through text-ink-faint"
                                : "text-ink"
                            }`}
                          >
                            {item.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-control bg-paper-inset text-[10px] font-bold text-ink-muted border border-line">
                            {formatCategory(item.category)}
                          </span>
                          {item.deadline_relative && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-control bg-paper-inset/40 border border-line text-[10px] text-ink-muted font-mono tabular-nums">
                              <Clock className="w-3 h-3 text-ink-muted" />
                              <span>
                                {convertTextTimesTo12Hour(
                                  item.deadline_relative,
                                )}
                              </span>
                            </span>
                          )}
                          {item.is_sustainability_action && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-control bg-moss-50 text-moss-800 border border-moss-200 text-[10px] font-bold">
                              <Leaf className="w-3 h-3 text-moss-600" />
                              <span>Green Action</span>
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p
                            className={`text-xs ${
                              isChecked ? "text-ink-faint" : "text-ink-muted"
                            }`}
                          >
                            {item.description}
                          </p>
                        )}

                        {item.notes && (
                          <p className="text-[11px] text-ink-muted mt-1 italic">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>

                      {item.is_suggestion && (
                        <div className="flex-shrink-0 self-center">
                          <span className="text-[10px] font-medium text-ink-muted bg-paper-inset/40 px-2 py-0.5 rounded-control border border-line">
                            Suggested
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
