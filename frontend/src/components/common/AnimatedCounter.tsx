import React, { useEffect, useRef, useState } from "react";
import { animate } from "animejs";

interface AnimatedCounterProps {
  value: number | string | null | undefined;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  formatter?: (val: number) => string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 900,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  formatter,
}) => {
  const numericTarget = typeof value === "number" ? value : Number(value);
  const isValidNumber =
    !isNaN(numericTarget) &&
    value !== null &&
    value !== undefined &&
    value !== "";

  const [displayValue, setDisplayValue] = useState<number>(
    isValidNumber ? numericTarget : 0,
  );
  const prevValueRef = useRef<number>(isValidNumber ? numericTarget : 0);
  const animeInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!isValidNumber) return;

    const fromVal = prevValueRef.current;
    const toVal = numericTarget;

    if (fromVal === toVal) {
      setDisplayValue(toVal);
      return;
    }

    if (animeInstanceRef.current && animeInstanceRef.current.revert) {
      animeInstanceRef.current.revert();
    }

    const counterObj = { val: fromVal };

    animeInstanceRef.current = animate(counterObj, {
      val: toVal,
      duration,
      ease: "outExpo",
      onUpdate: () => {
        setDisplayValue(counterObj.val);
      },
      onComplete: () => {
        prevValueRef.current = toVal;
      },
    });

    return () => {
      if (animeInstanceRef.current && animeInstanceRef.current.revert) {
        animeInstanceRef.current.revert();
      }
    };
  }, [numericTarget, isValidNumber, duration, decimals]);

  if (!isValidNumber) {
    return <span className={className}>{value ?? "—"}</span>;
  }

  const determinedDecimals =
    decimals !== undefined
      ? decimals
      : typeof value === "string" && value.includes(".")
        ? value.split(".")[1].length
        : 0;

  const formattedNumber = formatter
    ? formatter(displayValue)
    : determinedDecimals > 0
      ? displayValue.toFixed(determinedDecimals)
      : Math.round(displayValue).toLocaleString();

  return (
    <span
      className={`inline-block font-numeric transition-colors ${className}`}
    >
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
};
