import React, { useId } from "react";

export interface RangeSliderProps {
  id?: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  ticks?: number[];
  tickLabels?: { [value: number]: string };
  customReadout?: React.ReactNode;
  onChange: (value: number) => void;
  helperText?: string;
  className?: string;
}

/**
 * RangeSlider Component:
 * Notched physical survey slider with monospace value badge and calibrated ticks.
 */
export const RangeSlider: React.FC<RangeSliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  ticks,
  tickLabels,
  customReadout,
  onChange,
  helperText,
  className = "",
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Monospace Value Readout */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-mono uppercase tracking-wider text-ink-muted flex items-center gap-1.5"
        >
          {label}
        </label>
        {customReadout ? (
          <div>{customReadout}</div>
        ) : (
          <span className="font-mono text-xs font-semibold tabular-nums text-moss-800 bg-paper-inset px-2.5 py-0.5 rounded-control border border-line">
            {value.toLocaleString()} {unit && <span className="text-ink-muted">{unit}</span>}
          </span>
        )}
      </div>

      {/* Slider Track with Notches */}
      <div className="relative pt-1 pb-1">
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-paper-inset border border-line-strong rounded-control cursor-pointer accent-moss-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss-700"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />

        {/* Notched Calibration Ticks */}
        {ticks && ticks.length > 0 && (
          <div
            className="flex justify-between items-center w-full px-0.5 mt-1 text-[11px] font-mono text-ink-faint select-none"
            aria-hidden="true"
          >
            {ticks.map((tick) => (
              <span key={tick} className="flex flex-col items-center">
                <span className="h-1 w-0.5 bg-line-strong mb-0.5" />
                <span className="tabular-nums">
                  {tickLabels && tickLabels[tick] !== undefined ? tickLabels[tick] : tick}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-xs text-ink-muted font-sans mt-1">{helperText}</p>
      )}
    </div>
  );
};
