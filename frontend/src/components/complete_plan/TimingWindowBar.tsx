import React, { useState } from "react";
import { Clock, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { LedgerIcon } from "../icons";
import { Time12HourPicker } from "./Time12HourPicker";
import { format12Hour } from "../../utils/timeFormatting";

interface TimingWindowBarProps {
  eventDate: string;
  startTime: string;
  endTime: string;
  durationDays: number;
  isGenerating: boolean;
  hasPlan: boolean;
  onTimingChange: (
    eventDate: string,
    startTime: string,
    endTime: string,
  ) => void;
  onGenerate: (timing: {
    eventDate: string;
    startTime: string;
    endTime: string;
  }) => void;
}

export const TimingWindowBar: React.FC<TimingWindowBarProps> = ({
  eventDate,
  startTime,
  endTime,
  durationDays,
  isGenerating,
  hasPlan,
  onTimingChange,
  onGenerate,
}) => {
  const [localDate, setLocalDate] = useState(eventDate);
  const [localStart, setLocalStart] = useState(startTime || "09:00");
  const [localEnd, setLocalEnd] = useState(endTime || "17:00");
  const [isOrganizerConfirmed, setIsOrganizerConfirmed] = useState(
    Boolean(eventDate),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    if (eventDate) {
      setLocalDate(eventDate);
    }
  }, [eventDate]);

  const handleDateChange = (val: string) => {
    setLocalDate(val);
    setIsOrganizerConfirmed(true);
    setValidationError(null);
    onTimingChange(val, localStart, localEnd);
  };

  const handleStartChange = (val: string) => {
    setLocalStart(val);
    setIsOrganizerConfirmed(true);
    setValidationError(null);
    onTimingChange(localDate, val, localEnd);
  };

  const handleEndChange = (val: string) => {
    setLocalEnd(val);
    setIsOrganizerConfirmed(true);
    setValidationError(null);
    onTimingChange(localDate, localStart, val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!localDate || localDate.trim() === "") {
      setValidationError(
        "Please select a valid event date before generating your schedule.",
      );
      return;
    }

    if (!localStart || !localEnd) {
      setValidationError("Please provide both daily start time and end time.");
      return;
    }

    const [sh, sm] = localStart.split(":").map(Number);
    const [eh, em] = localEnd.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    if (isNaN(startMinutes) || isNaN(endMinutes)) {
      setValidationError("Please enter valid times in 24-hour format (HH:MM).");
      return;
    }

    if (endMinutes <= startMinutes) {
      setValidationError(
        `Event end time (${format12Hour(localEnd)}) must be strictly after start time (${format12Hour(localStart)}). Please provide a positive operational window.`,
      );
      return;
    }

    onGenerate({
      eventDate: localDate,
      startTime: localStart,
      endTime: localEnd,
    });
  };

  return (
    <div className="surface-sheet p-5 sm:p-6 mb-8 border border-line">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-line gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-moss-600" />
          <h2 className="font-sans text-base sm:text-lg font-bold text-ink">
            Event Timing & Schedule Window
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {isOrganizerConfirmed && localDate ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-paper-inset text-moss-800 border border-line font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss-600" />
              <span>
                Organizer configured ({format12Hour(localStart)} –{" "}
                {format12Hour(localEnd)})
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-clay-50 text-clay-800 border border-clay-300 font-semibold">
              <Info className="w-3.5 h-3.5 text-clay-700" />
              <span>
                Default timing suggestion ({format12Hour("09:00")} –{" "}
                {format12Hour("17:00")})
              </span>
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Event Date */}
          <div>
            <label
              htmlFor="timing-event-date"
              className="label-kicker text-[11px] block mb-1.5"
            >
              Event Date <span className="text-clay-700">*</span>
            </label>
            <div className="relative">
              <input
                id="timing-event-date"
                type="date"
                value={localDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-control border border-line text-sm font-semibold text-ink bg-paper-raised focus:outline-none focus:ring-2 focus:ring-moss-500/20 focus:border-moss-600 transition-colors"
                required
              />
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Calendar date for Day 1
            </p>
          </div>

          {/* Start Time - 12-Hour Selector */}
          <div>
            <Time12HourPicker
              id="timing-start-time"
              label="Daily Start Time"
              value={localStart}
              onChange={handleStartChange}
              helpText="Doors open / setup begins"
              required
            />
          </div>

          {/* End Time - 12-Hour Selector */}
          <div>
            <Time12HourPicker
              id="timing-end-time"
              label="Daily End Time"
              value={localEnd}
              onChange={handleEndChange}
              helpText="Cleanup concludes"
              required
            />
          </div>
        </div>

        {/* Multi-day Notice */}
        {durationDays > 1 && (
          <div className="p-3.5 rounded-control bg-paper-inset/40 border border-line text-xs text-ink-muted flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-ink">
                Multi-day Operating Hours:
              </strong>{" "}
              The current planning system applies this same operating window (
              {format12Hour(localStart)} – {format12Hour(localEnd)}) across all{" "}
              {durationDays} days of your event.
            </div>
          </div>
        )}

        {/* Validation Error Alert */}
        {validationError && (
          <div
            role="alert"
            className="p-3.5 rounded-control bg-clay-50 border border-clay-300 text-xs text-clay-900 flex items-center space-x-2.5"
          >
            <AlertCircle className="w-4 h-4 text-clay-700 flex-shrink-0" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-2 flex justify-end">
          <button
            id="generate-plan-btn"
            type="submit"
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-paper-raised border-t-transparent rounded-full animate-spin" />
                <span>Scheduling Timetable...</span>
              </>
            ) : (
              <>
                <LedgerIcon className="w-4 h-4" />
                <span>
                  {hasPlan
                    ? "Regenerate Event Plan"
                    : "Generate Complete Event Plan"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
