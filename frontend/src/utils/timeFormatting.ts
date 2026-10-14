/**
 * 12-Hour Time Formatting and Conversion Utilities
 *
 * Provides bidirectional conversion between API standard 24-hour (HH:MM)
 * and user-facing 12-hour (hh:mm AM/PM) formats with railway-style padding.
 */

export interface SplitTime12Hour {
  hour12: string;
  minute: string;
  period: 'AM' | 'PM';
}

/**
 * Formats a 24-hour time string (HH:MM or HH:MM:SS) into a 12-hour string with AM/PM.
 * Correctly handles midnight (00:00 -> 12:00 AM) and noon (12:00 -> 12:00 PM).
 *
 * Examples:
 * - "00:00" -> "12:00 AM"
 * - "12:00" -> "12:00 PM"
 * - "09:30" -> "09:30 AM"
 * - "17:45" -> "05:45 PM"
 */
export const format12Hour = (timeStr?: string | null): string => {
  if (!timeStr || typeof timeStr !== 'string') {
    return '';
  }

  const trimmed = timeStr.trim();
  if (!trimmed) {
    return '';
  }

  // If already in 12-hour format with AM/PM, return as is (normalized)
  if (/^(0?[1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i.test(trimmed)) {
    const parts = trimmed.split(/\s+/);
    const [h, m] = parts[0].split(':');
    const period = parts[1].toUpperCase();
    return `${h.padStart(2, '0')}:${m} ${period}`;
  }

  // Expect HH:MM or HH:MM:SS
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return timeStr;
  }

  const hours24 = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (isNaN(hours24) || isNaN(minutes) || hours24 < 0 || hours24 > 23 || minutes < 0 || minutes > 59) {
    return timeStr;
  }

  const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) {
    hours12 = 12;
  }

  const paddedHours = String(hours12).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');

  return `${paddedHours}:${paddedMinutes} ${period}`;
};

/**
 * Converts 12-hour components (hour 1-12, minute 0-59, AM/PM) to a 24-hour "HH:MM" string for API payloads.
 *
 * Examples:
 * - (12, 0, "AM") -> "00:00"
 * - (12, 0, "PM") -> "12:00"
 * - (9, 30, "AM") -> "09:30"
 * - (5, 45, "PM") -> "17:45"
 */
export const parse12HourTo24Hour = (
  hour: string | number,
  minute: string | number,
  period: 'AM' | 'PM' | string
): string => {
  let h = typeof hour === 'number' ? hour : parseInt(String(hour), 10);
  let m = typeof minute === 'number' ? minute : parseInt(String(minute), 10);

  if (isNaN(h)) h = 9;
  if (isNaN(m)) m = 0;

  // Clamp values
  if (h < 1) h = 1;
  if (h > 12) h = 12;
  if (m < 0) m = 0;
  if (m > 59) m = 59;

  const isPM = String(period).toUpperCase() === 'PM';
  let hours24 = h;

  if (isPM) {
    if (h < 12) {
      hours24 = h + 12;
    }
  } else {
    if (h === 12) {
      hours24 = 0;
    }
  }

  const paddedH = String(hours24).padStart(2, '0');
  const paddedM = String(m).padStart(2, '0');

  return `${paddedH}:${paddedM}`;
};

/**
 * Splits a 24-hour "HH:MM" string into constituent 12-hour parts.
 *
 * Examples:
 * - "00:00" -> { hour12: "12", minute: "00", period: "AM" }
 * - "12:00" -> { hour12: "12", minute: "00", period: "PM" }
 * - "09:30" -> { hour12: "09", minute: "30", period: "AM" }
 * - "17:45" -> { hour12: "05", minute: "45", period: "PM" }
 */
export const split24Hour = (time24?: string | null): SplitTime12Hour => {
  if (!time24 || typeof time24 !== 'string') {
    return { hour12: '09', minute: '00', period: 'AM' };
  }

  const match = time24.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return { hour12: '09', minute: '00', period: 'AM' };
  }

  const hours24 = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (isNaN(hours24) || isNaN(minutes)) {
    return { hour12: '09', minute: '00', period: 'AM' };
  }

  const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) {
    hours12 = 12;
  }

  return {
    hour12: String(hours12).padStart(2, '0'),
    minute: String(minutes).padStart(2, '0'),
    period,
  };
};

/**
 * Formats a time window (start to end) in 12-hour format.
 * E.g. "09:00 AM – 05:00 PM"
 */
export const formatTimeWindow12Hour = (
  startTime?: string | null,
  endTime?: string | null
): string => {
  const start = format12Hour(startTime);
  const end = format12Hour(endTime);
  if (start && end) {
    return `${start} – ${end}`;
  }
  return start || end || '';
};

/**
 * Converts any raw 24-hour time references inside a narrative or notification string to 12-hour AM/PM.
 * E.g. "between 09:00 and 17:00" -> "between 09:00 AM and 05:00 PM"
 */
export const convertTextTimesTo12Hour = (text?: string | null): string => {
  if (!text) return '';
  // Match isolated HH:MM patterns not followed by AM/PM
  return text.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b(?!\s*[AaPp][Mm])/g, (match) => {
    return format12Hour(match);
  });
};
