import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  AlertCircle,
  Utensils,
  Leaf,
  Calendar,
} from "lucide-react";
import {
  DaySchedule,
  ScheduleConflict,
  TimetableSlot,
} from "../../types/completePlan";
import {
  format12Hour,
  convertTextTimesTo12Hour,
} from "../../utils/timeFormatting";

interface EventTimetableProps {
  dailyTimetable: DaySchedule[];
  schedulingWarnings: string[];
  schedulingConflicts: ScheduleConflict[];
}

const getActivityBadgeStyle = (type: string) => {
  switch (type) {
    case "SETUP":
    case "TEARDOWN":
    case "CLEANUP":
      return "bg-paper-inset text-ink-muted border-line";
    case "REGISTRATION":
      return "bg-moss-50 text-moss-800 border-moss-200";
    case "OPENING":
    case "CLOSING":
    case "AWARDS":
      return "bg-paper-inset text-ink border-line-strong";
    case "KEYNOTE":
    case "SESSION":
      return "bg-moss-100/70 text-moss-900 border-moss-300";
    case "WORKSHOP":
    case "COMPETITION":
      return "bg-moss-50 text-moss-800 border-moss-200";
    case "MEAL":
      return "bg-clay-50 text-clay-800 border-clay-200";
    case "BREAK":
    case "NETWORKING":
      return "bg-moss-100/60 text-moss-800 border-moss-200";
    default:
      return "bg-paper-inset text-ink-muted border-line";
  }
};

const formatActivityTypeLabel = (type: string) => {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const EventTimetable: React.FC<EventTimetableProps> = ({
  dailyTimetable,
  schedulingWarnings,
  schedulingConflicts,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  if (!dailyTimetable || dailyTimetable.length === 0) {
    return (
      <div className="surface-sheet p-8 text-center text-ink-muted text-sm border-2 border-dashed border-line">
        No timetable slots available. Generate your event plan to see the daily
        schedule.
      </div>
    );
  }

  const activeDay = dailyTimetable[selectedDayIndex] || dailyTimetable[0];

  return (
    <div className="surface-sheet p-5 sm:p-8 mb-8 border border-line">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-line gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-paper-inset text-moss-800 text-xs font-semibold tracking-wide uppercase mb-2 border border-line">
            <CalendarDays className="w-3.5 h-3.5 text-moss-600" />
            <span>Operational Schedule</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Event Timetable
          </h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Chronological, non-overlapping activities including setup, meals,
            sessions, and sustainable cleanup.
          </p>
        </div>

        {/* Multi-day Selector Tabs */}
        {dailyTimetable.length > 1 && (
          <div className="flex items-center space-x-1.5 p-1 bg-paper-inset/50 border border-line rounded-control">
            {dailyTimetable.map((day, idx) => (
              <button
                key={day.day_number}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-4 py-2 rounded-control text-xs font-bold transition-all ${
                  selectedDayIndex === idx
                    ? "bg-paper-raised text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Day {day.day_number}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prominent Scheduling Conflicts */}
      {schedulingConflicts && schedulingConflicts.length > 0 && (
        <div
          role="alert"
          aria-label="Scheduling conflicts warning"
          className="mb-6 p-4 sm:p-5 rounded-control bg-clay-50 border border-clay-300 text-clay-950 space-y-3"
        >
          <div className="flex items-center space-x-2.5 font-bold text-sm text-clay-900">
            <AlertTriangle className="w-5 h-5 text-clay-700 flex-shrink-0" />
            <span>
              Scheduling Conflicts Detected ({schedulingConflicts.length})
            </span>
          </div>
          <p className="text-xs text-clay-800">
            The scheduling engine detected potential timing constraints or
            duration limits in your requested window:
          </p>
          <div className="space-y-2">
            {schedulingConflicts.map((conflict, i) => (
              <div
                key={i}
                className="p-3 bg-paper-raised rounded-control border border-clay-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-clay-900">
                    {conflict.conflict_type.replace(/_/g, " ")}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-clay-100 text-clay-800 text-[10px] font-bold uppercase font-mono">
                    {conflict.severity}
                  </span>
                </div>
                <p className="text-ink-muted">
                  {convertTextTimesTo12Hour(conflict.description)}
                </p>
                {conflict.affected_activities &&
                  conflict.affected_activities.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-ink-muted">
                        Affected:
                      </span>
                      {conflict.affected_activities.map((act, actIdx) => (
                        <span
                          key={actIdx}
                          className="px-2 py-0.5 rounded-control bg-paper-inset text-[10px] text-ink font-medium border border-line"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Scheduling Warnings */}
      {schedulingWarnings && schedulingWarnings.length > 0 && (
        <div className="mb-6 p-4 rounded-control bg-paper-inset/60 border border-line text-ink text-xs space-y-1.5">
          <div className="flex items-center space-x-2 font-bold text-ink">
            <AlertCircle className="w-4 h-4 text-moss-600 flex-shrink-0" />
            <span>Timing Notice</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-ink-muted">
            {schedulingWarnings.map((warn, i) => (
              <li key={i}>{convertTextTimesTo12Hour(warn)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Active Day Information Banner */}
      <div className="flex items-center justify-between py-2.5 px-4 mb-8 rounded-control bg-paper-inset/40 border border-line text-xs text-ink">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-moss-600" />
          <span className="font-bold text-ink">Day {activeDay.day_number}</span>
          <span className="text-ink-faint">•</span>
          <span className="font-mono text-ink-muted tabular-nums">{activeDay.date}</span>
        </div>
        <div className="flex items-center space-x-2 text-ink-muted font-mono tabular-nums">
          <Clock className="w-3.5 h-3.5 text-moss-600" />
          <span>
            {format12Hour(activeDay.start_time)} –{" "}
            {format12Hour(activeDay.end_time)} (
            {Math.round(activeDay.total_duration_minutes / 60)} hrs)
          </span>
        </div>
      </div>

      {/* Printed-Schedule Spine Timeline Layout */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-line ml-3 sm:ml-4 space-y-4 print:border-ink print:pl-6 print:ml-2">
        {activeDay.slots.map((slot: TimetableSlot) => (
          <div key={slot.slot_id} className="relative group print:break-inside-avoid">
            {/* Timeline Node on Spine */}
            <div
              className={`absolute -left-[32px] sm:-left-[41px] top-4.5 w-4 h-4 rounded-full border-2 transition-all print:border-ink print:bg-white ${
                slot.is_meal
                  ? "border-clay-600 bg-clay-50 ring-2 ring-clay-200 print:ring-0"
                  : slot.is_sustainability_action
                    ? "border-moss-700 bg-moss-100 ring-2 ring-moss-300 print:ring-0"
                    : "border-line-strong bg-paper-raised ring-2 ring-paper-inset print:ring-0"
              }`}
            />

            {/* Slot Card */}
            <div className="p-4 sm:p-5 rounded-sheet border border-line bg-paper-raised hover:border-moss-400/80 transition-all shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:bg-white print:border-ink print:shadow-none print:p-3">
              {/* Time window & duration */}
              <div className="sm:w-52 flex-shrink-0 flex items-center space-x-2.5">
                <div className="p-2 rounded-control bg-paper-inset/50 text-ink border border-line/60 print:hidden">
                  <Clock className="w-4 h-4 text-moss-600" />
                </div>
                <div>
                  <div className="font-mono font-bold text-sm text-ink tabular-nums">
                    {format12Hour(slot.start_time)} –{" "}
                    {format12Hour(slot.end_time)}
                  </div>
                  <div className="text-[11px] font-mono text-ink-muted tabular-nums">
                    {slot.duration_minutes} mins
                  </div>
                </div>
              </div>

              {/* Title, description, and tags */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h4 className="font-serif font-bold text-sm sm:text-base text-ink">
                    {slot.title}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border print:border-ink print:bg-transparent ${getActivityBadgeStyle(
                      slot.activity_type,
                    )}`}
                  >
                    {formatActivityTypeLabel(slot.activity_type)}
                  </span>
                  {slot.is_meal && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-clay-50 text-clay-800 border border-clay-200 text-[10px] font-bold print:border-ink print:bg-transparent">
                      <Utensils className="w-3 h-3 text-clay-700 print:hidden" />
                      <span>Meal: {slot.meal_type || "Catering"}</span>
                    </span>
                  )}
                  {slot.is_sustainability_action && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-moss-50 text-moss-800 border border-moss-200 text-[10px] font-bold print:border-ink print:bg-transparent">
                      <Leaf className="w-3 h-3 text-moss-600 print:hidden" />
                      <span>Eco Action</span>
                    </span>
                  )}
                </div>

                {slot.description && (
                  <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 print:line-clamp-none">
                    {slot.description}
                  </p>
                )}
              </div>

              {/* Suggested Tag */}
              {slot.is_suggestion && (
                <div className="sm:text-right flex-shrink-0 print:hidden">
                  <span className="text-[10px] font-medium text-ink-muted bg-paper-inset/40 px-2 py-1 rounded-control border border-line">
                    Suggested timing
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
