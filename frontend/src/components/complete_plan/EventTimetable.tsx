import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  AlertCircle,
  Utensils,
  Leaf,
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
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "REGISTRATION":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "OPENING":
    case "CLOSING":
    case "AWARDS":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "KEYNOTE":
    case "SESSION":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "WORKSHOP":
    case "COMPETITION":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "MEAL":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "BREAK":
    case "NETWORKING":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
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
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 text-center text-slate-500 text-sm">
        No timetable slots available. Generate your event plan to see the daily
        schedule.
      </div>
    );
  }

  const activeDay = dailyTimetable[selectedDayIndex] || dailyTimetable[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-8 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2 border border-emerald-200">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
            <span>Operational Schedule</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Event Timetable
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chronological, non-overlapping activities including setup, meals,
            sessions, and sustainable cleanup.
          </p>
        </div>

        {/* Multi-day Selector Tabs */}
        {dailyTimetable.length > 1 && (
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-2xl">
            {dailyTimetable.map((day, idx) => (
              <button
                key={day.day_number}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedDayIndex === idx
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Day {day.day_number}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prominent Scheduling Conflicts (Never Hidden) */}
      {schedulingConflicts && schedulingConflicts.length > 0 && (
        <div
          role="alert"
          aria-label="Scheduling conflicts warning"
          className="mb-6 p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-3"
        >
          <div className="flex items-center space-x-2.5 font-bold text-sm text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>
              Scheduling Conflicts Detected ({schedulingConflicts.length})
            </span>
          </div>
          <p className="text-xs text-rose-800">
            The scheduling engine detected potential timing constraints or
            duration limits in your requested window:
          </p>
          <div className="space-y-2">
            {schedulingConflicts.map((conflict, i) => (
              <div
                key={i}
                className="p-3 bg-white/80 rounded-xl border border-rose-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900">
                    {conflict.conflict_type.replace(/_/g, " ")}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                    {conflict.severity}
                  </span>
                </div>
                <p className="text-slate-700">
                  {convertTextTimesTo12Hour(conflict.description)}
                </p>
                {conflict.affected_activities &&
                  conflict.affected_activities.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-500">
                        Affected:
                      </span>
                      {conflict.affected_activities.map((act, actIdx) => (
                        <span
                          key={actIdx}
                          className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] text-rose-800 font-medium"
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
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1.5">
          <div className="flex items-center space-x-2 font-bold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Timing Notice</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-slate-700">
            {schedulingWarnings.map((warn, i) => (
              <li key={i}>{convertTextTimesTo12Hour(warn)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Active Day Information Banner */}
      <div className="flex items-center justify-between py-2.5 px-4 mb-6 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-900">
            Day {activeDay.day_number}
          </span>
          <span className="text-slate-400">•</span>
          <span>{activeDay.date}</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {format12Hour(activeDay.start_time)} –{" "}
            {format12Hour(activeDay.end_time)} (
            {Math.round(activeDay.total_duration_minutes / 60)} hrs)
          </span>
        </div>
      </div>

      {/* Chronological Slots Timeline */}
      <div className="space-y-3">
        {activeDay.slots.map((slot: TimetableSlot) => (
          <div
            key={slot.slot_id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all gap-3 bg-white"
          >
            {/* Time window & duration */}
            <div className="sm:w-52 flex-shrink-0 flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">
                  {format12Hour(slot.start_time)} –{" "}
                  {format12Hour(slot.end_time)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {slot.duration_minutes} mins
                </div>
              </div>
            </div>

            {/* Title, description, and tags */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="font-bold text-sm text-slate-900">
                  {slot.title}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getActivityBadgeStyle(
                    slot.activity_type,
                  )}`}
                >
                  {formatActivityTypeLabel(slot.activity_type)}
                </span>
                {slot.is_meal && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                    <Utensils className="w-3 h-3 text-amber-600" />
                    <span>Meal: {slot.meal_type || "Catering"}</span>
                  </span>
                )}
                {slot.is_sustainability_action && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    <Leaf className="w-3 h-3 text-emerald-600" />
                    <span>Eco Action</span>
                  </span>
                )}
              </div>

              {slot.description && (
                <p className="text-xs text-slate-600 line-clamp-2">
                  {slot.description}
                </p>
              )}
            </div>

            {/* Suggested Tag */}
            {slot.is_suggestion && (
              <div className="sm:text-right flex-shrink-0">
                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                  Suggested timing
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
