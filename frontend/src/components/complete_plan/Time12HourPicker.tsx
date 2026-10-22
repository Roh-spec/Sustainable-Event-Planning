import React from "react";
import { Clock } from "lucide-react";
import {
  split24Hour,
  parse12HourTo24Hour,
  format12Hour,
} from "../../utils/timeFormatting";

interface Time12HourPickerProps {
  id: string;
  label: string;
  value: string; // 24-hour "HH:MM"
  onChange: (value24: string) => void;
  helpText?: string;
  required?: boolean;
}

const HOURS = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];
const BASE_MINUTES = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
];

export const Time12HourPicker: React.FC<Time12HourPickerProps> = ({
  id,
  label,
  value,
  onChange,
  helpText,
  required = false,
}) => {
  const { hour12, minute, period } = split24Hour(value);

  // Ensure current minute is always present in dropdown options
  const minuteOptions = BASE_MINUTES.includes(minute)
    ? BASE_MINUTES
    : [...BASE_MINUTES, minute].sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10),
      );

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const new24 = parse12HourTo24Hour(e.target.value, minute, period);
    onChange(new24);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const new24 = parse12HourTo24Hour(hour12, e.target.value, period);
    onChange(new24);
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    const new24 = parse12HourTo24Hour(hour12, minute, newPeriod);
    onChange(new24);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`${id}-hour`}
          className="label-kicker text-[11px] block"
        >
          {label} {required && <span className="text-clay-600">*</span>}
        </label>
        {/* Railway-style 12-hour badge preview */}
        <span
          data-testid={`${id}-preview`}
          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-control bg-paper-inset/70 text-moss-800 border border-line text-xs font-mono font-bold tracking-wide tabular-nums"
        >
          <Clock className="w-3 h-3 text-moss-600 mr-0.5" />
          <span>{format12Hour(value)}</span>
        </span>
      </div>

      {/* Accessible 12-Hour Compound Controls */}
      <div className="flex items-center space-x-2">
        {/* Hour Select */}
        <div className="flex-1">
          <select
            id={`${id}-hour`}
            aria-label={`${label} Hour`}
            value={hour12}
            onChange={handleHourChange}
            className="w-full px-2.5 py-2 rounded-control border border-line text-sm font-semibold text-ink bg-paper-raised focus:outline-none focus:ring-2 focus:ring-moss-500/20 focus:border-moss-600 transition-colors cursor-pointer tabular-nums"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <span className="text-ink-faint font-extrabold text-sm">:</span>

        {/* Minute Select */}
        <div className="flex-1">
          <select
            id={`${id}-minute`}
            aria-label={`${label} Minute`}
            value={minute}
            onChange={handleMinuteChange}
            className="w-full px-2.5 py-2 rounded-control border border-line text-sm font-semibold text-ink bg-paper-raised focus:outline-none focus:ring-2 focus:ring-moss-500/20 focus:border-moss-600 transition-colors cursor-pointer tabular-nums"
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Segment Buttons */}
        <div className="flex rounded-control p-0.5 bg-paper-inset/50 border border-line">
          <button
            type="button"
            id={`${id}-am-btn`}
            aria-label={`${label} AM`}
            aria-pressed={period === "AM"}
            onClick={() => handlePeriodChange("AM")}
            className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all ${
              period === "AM"
                ? "bg-moss-700 text-paper-raised"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            AM
          </button>
          <button
            type="button"
            id={`${id}-pm-btn`}
            aria-label={`${label} PM`}
            aria-pressed={period === "PM"}
            onClick={() => handlePeriodChange("PM")}
            className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all ${
              period === "PM"
                ? "bg-moss-700 text-paper-raised"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            PM
          </button>
        </div>
      </div>

      {/* Hidden input to maintain id-based selectors if needed */}
      <input type="hidden" id={id} value={value} readOnly />

      {helpText && <p className="text-[11px] text-ink-muted">{helpText}</p>}
    </div>
  );
};
