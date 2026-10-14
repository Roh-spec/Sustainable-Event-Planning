import React, { useState } from "react";
import {
  CheckSquare,
  Square,
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
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  EVENT_DAY_MORNING: {
    label: "Event-Day Preparation",
    description:
      "Morning venue setup, signage, waste sorting stations, and vendor arrivals",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
  },
  DURING_EVENT: {
    label: "During the Event",
    description:
      "Live catering monitoring, waste station guidance, and schedule adherence",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  AFTER_EVENT: {
    label: "After the Event",
    description:
      "Surplus food donation, dish collection, compost handover, and post-event wrapup",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
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
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-8 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Execution Milestones</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Preparation & Delivery Checklist
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Actionable tasks grouped chronologically to ensure sustainable
            delivery before, during, and after your event.
          </p>
        </div>

        {/* Progress Pill */}
        <div className="flex-shrink-0 bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:w-56">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-700">Checklist Progress</span>
            <span className="font-extrabold text-emerald-700">
              {completedCount} / {totalTasks} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Temporary Progress Notice */}
      <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-slate-800">
            Session-only Tracker:
          </strong>{" "}
          Checkbox completion is saved temporarily in your current browser
          session. Progress will reset if the page session is cleared.
        </div>
      </div>

      {/* Phase Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6 pb-2 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setSelectedPhaseFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedPhaseFilter === "ALL"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPhaseFilter === p
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>{config.label}</span>
                  </h3>
                  <p className="text-xs text-slate-500">{config.description}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border self-start sm:self-auto ${config.badgeColor}`}
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
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                        isChecked
                          ? "bg-slate-50/80 border-slate-200 text-slate-400"
                          : "bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/10 text-slate-900 shadow-sm"
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`Mark task ${item.title} as ${isChecked ? "incomplete" : "complete"}`}
                        className="mt-0.5 text-emerald-600 focus:outline-none flex-shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 hover:text-emerald-500" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`font-bold text-sm ${
                              isChecked
                                ? "line-through text-slate-400"
                                : "text-slate-900"
                            }`}
                          >
                            {item.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
                            {formatCategory(item.category)}
                          </span>
                          {item.deadline_relative && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-medium">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {convertTextTimesTo12Hour(
                                  item.deadline_relative,
                                )}
                              </span>
                            </span>
                          )}
                          {item.is_sustainability_action && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              <Leaf className="w-3 h-3 text-emerald-600" />
                              <span>Green Action</span>
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p
                            className={`text-xs ${
                              isChecked ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {item.description}
                          </p>
                        )}

                        {item.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 italic">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>

                      {item.is_suggestion && (
                        <div className="flex-shrink-0 self-center">
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
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
