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
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {/* Railway-style 12-hour badge preview */}
        <span
          data-testid={`${id}-preview`}
          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold tracking-wide"
        >
          <Clock className="w-3 h-3 text-emerald-600 mr-0.5" />
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
            className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-400 font-extrabold text-sm">:</span>

        {/* Minute Select */}
        <div className="flex-1">
          <select
            id={`${id}-minute`}
            aria-label={`${label} Minute`}
            value={minute}
            onChange={handleMinuteChange}
            className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Segment Buttons */}
        <div className="flex rounded-xl p-0.5 bg-slate-100 border border-slate-200">
          <button
            type="button"
            id={`${id}-am-btn`}
            aria-label={`${label} AM`}
            aria-pressed={period === "AM"}
            onClick={() => handlePeriodChange("AM")}
            className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all ${
              period === "AM"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
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
            className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all ${
              period === "PM"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            PM
          </button>
        </div>
      </div>

      {/* Hidden input to maintain id-based selectors if needed */}
      <input type="hidden" id={id} value={value} readOnly />

      {helpText && <p className="text-[11px] text-slate-400">{helpText}</p>}
    </div>
  );
};
