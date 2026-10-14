import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  format12Hour,
  parse12HourTo24Hour,
  split24Hour,
  formatTimeWindow12Hour,
  convertTextTimesTo12Hour,
} from '../utils/timeFormatting';
import { Time12HourPicker } from '../components/complete_plan/Time12HourPicker';

describe('12-Hour Time Formatting Utilities', () => {
  describe('format12Hour (Required transformations)', () => {
    it('correctly converts 00:00 to 12:00 AM (Midnight)', () => {
      expect(format12Hour('00:00')).toBe('12:00 AM');
    });

    it('correctly converts 12:00 to 12:00 PM (Noon)', () => {
      expect(format12Hour('12:00')).toBe('12:00 PM');
    });

    it('correctly converts 09:30 to 09:30 AM', () => {
      expect(format12Hour('09:30')).toBe('09:30 AM');
    });

    it('correctly converts 17:45 to 05:45 PM', () => {
      expect(format12Hour('17:45')).toBe('05:45 PM');
    });

    it('handles seconds (HH:MM:SS) format properly', () => {
      expect(format12Hour('00:00:00')).toBe('12:00 AM');
      expect(format12Hour('12:00:00')).toBe('12:00 PM');
      expect(format12Hour('09:30:00')).toBe('09:30 AM');
      expect(format12Hour('17:45:00')).toBe('05:45 PM');
    });

    it('handles single-digit hour input safely with leading zero padding', () => {
      expect(format12Hour('9:00')).toBe('09:00 AM');
      expect(format12Hour('1:15')).toBe('01:15 AM');
    });

    it('handles already-formatted 12-hour strings idempotently', () => {
      expect(format12Hour('12:00 AM')).toBe('12:00 AM');
      expect(format12Hour('05:45 PM')).toBe('05:45 PM');
      expect(format12Hour('9:30 am')).toBe('09:30 AM');
    });

    it('handles invalid or empty time inputs safely without throwing', () => {
      expect(format12Hour(null)).toBe('');
      expect(format12Hour(undefined)).toBe('');
      expect(format12Hour('')).toBe('');
      expect(format12Hour('   ')).toBe('');
      expect(format12Hour('invalid-time')).toBe('invalid-time');
    });
  });

  describe('parse12HourTo24Hour (Conversion back to 24-hour API values)', () => {
    it('converts 12:00 AM to 00:00', () => {
      expect(parse12HourTo24Hour(12, 0, 'AM')).toBe('00:00');
      expect(parse12HourTo24Hour('12', '00', 'AM')).toBe('00:00');
    });

    it('converts 12:00 PM to 12:00', () => {
      expect(parse12HourTo24Hour(12, 0, 'PM')).toBe('12:00');
      expect(parse12HourTo24Hour('12', '00', 'PM')).toBe('12:00');
    });

    it('converts 09:30 AM to 09:30', () => {
      expect(parse12HourTo24Hour(9, 30, 'AM')).toBe('09:30');
      expect(parse12HourTo24Hour('09', '30', 'AM')).toBe('09:30');
    });

    it('converts 05:45 PM to 17:45', () => {
      expect(parse12HourTo24Hour(5, 45, 'PM')).toBe('17:45');
      expect(parse12HourTo24Hour('05', '45', 'PM')).toBe('17:45');
    });

    it('clamps boundary and invalid inputs safely', () => {
      expect(parse12HourTo24Hour(1, 0, 'AM')).toBe('01:00');
      expect(parse12HourTo24Hour(11, 59, 'PM')).toBe('23:59');
      expect(parse12HourTo24Hour(0, 0, 'AM')).toBe('01:00'); // 0 clamped to 1
      expect(parse12HourTo24Hour(13, 0, 'PM')).toBe('12:00'); // 13 clamped to 12
    });
  });

  describe('split24Hour', () => {
    it('splits 00:00 into 12, 00, AM', () => {
      expect(split24Hour('00:00')).toEqual({ hour12: '12', minute: '00', period: 'AM' });
    });

    it('splits 12:00 into 12, 00, PM', () => {
      expect(split24Hour('12:00')).toEqual({ hour12: '12', minute: '00', period: 'PM' });
    });

    it('splits 09:30 into 09, 30, AM', () => {
      expect(split24Hour('09:30')).toEqual({ hour12: '09', minute: '30', period: 'AM' });
    });

    it('splits 17:45 into 05, 45, PM', () => {
      expect(split24Hour('17:45')).toEqual({ hour12: '05', minute: '45', period: 'PM' });
    });

    it('falls back to default 09:00 AM on invalid input', () => {
      expect(split24Hour(null)).toEqual({ hour12: '09', minute: '00', period: 'AM' });
      expect(split24Hour('invalid')).toEqual({ hour12: '09', minute: '00', period: 'AM' });
    });
  });

  describe('formatTimeWindow12Hour', () => {
    it('formats a full window in 12-hour format with en-dash', () => {
      expect(formatTimeWindow12Hour('09:00', '17:00')).toBe('09:00 AM – 05:00 PM');
      expect(formatTimeWindow12Hour('00:00', '12:00')).toBe('12:00 AM – 12:00 PM');
    });

    it('handles single or missing times gracefully', () => {
      expect(formatTimeWindow12Hour('09:00', null)).toBe('09:00 AM');
      expect(formatTimeWindow12Hour(null, '17:00')).toBe('05:00 PM');
      expect(formatTimeWindow12Hour(null, null)).toBe('');
    });
  });

  describe('convertTextTimesTo12Hour', () => {
    it('replaces isolated 24-hour times inside sentences with 12-hour format', () => {
      const input = 'The session runs from 09:00 until 17:00, with lunch at 13:00.';
      const expected = 'The session runs from 09:00 AM until 05:00 PM, with lunch at 01:00 PM.';
      expect(convertTextTimesTo12Hour(input)).toBe(expected);
    });

    it('does not re-convert times that already have AM or PM', () => {
      const input = 'Meeting at 09:00 AM and teardown at 05:00 PM.';
      expect(convertTextTimesTo12Hour(input)).toBe(input);
    });

    it('handles empty or null text safely', () => {
      expect(convertTextTimesTo12Hour(null)).toBe('');
      expect(convertTextTimesTo12Hour('')).toBe('');
    });
  });
});

describe('Time12HourPicker Component', () => {
  it('renders hour, minute, AM/PM selectors and live preview badge', () => {
    render(
      <Time12HourPicker
        id="test-picker"
        label="Start Time"
        value="09:30"
        onChange={vi.fn()}
      />
    );

    // Live railway-style badge preview
    const preview = screen.getByTestId('test-picker-preview');
    expect(preview).toHaveTextContent('09:30 AM');

    // Controls
    const hourSelect = screen.getByLabelText(/Start Time Hour/i) as HTMLSelectElement;
    expect(hourSelect.value).toBe('09');

    const minuteSelect = screen.getByLabelText(/Start Time Minute/i) as HTMLSelectElement;
    expect(minuteSelect.value).toBe('30');

    const amBtn = screen.getByRole('button', { name: /Start Time AM/i });
    const pmBtn = screen.getByRole('button', { name: /Start Time PM/i });
    expect(amBtn).toHaveAttribute('aria-pressed', 'true');
    expect(pmBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders midnight (00:00) as 12:00 AM', () => {
    render(
      <Time12HourPicker
        id="midnight-picker"
        label="Midnight Time"
        value="00:00"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('midnight-picker-preview')).toHaveTextContent('12:00 AM');
    expect((screen.getByLabelText(/Midnight Time Hour/i) as HTMLSelectElement).value).toBe('12');
    expect((screen.getByLabelText(/Midnight Time Minute/i) as HTMLSelectElement).value).toBe('00');
    expect(screen.getByRole('button', { name: /Midnight Time AM/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders noon (12:00) as 12:00 PM', () => {
    render(
      <Time12HourPicker
        id="noon-picker"
        label="Noon Time"
        value="12:00"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('noon-picker-preview')).toHaveTextContent('12:00 PM');
    expect((screen.getByLabelText(/Noon Time Hour/i) as HTMLSelectElement).value).toBe('12');
    expect((screen.getByLabelText(/Noon Time Minute/i) as HTMLSelectElement).value).toBe('00');
    expect(screen.getByRole('button', { name: /Noon Time PM/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders 17:45 as 05:45 PM', () => {
    render(
      <Time12HourPicker
        id="evening-picker"
        label="Evening Time"
        value="17:45"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('evening-picker-preview')).toHaveTextContent('05:45 PM');
    expect((screen.getByLabelText(/Evening Time Hour/i) as HTMLSelectElement).value).toBe('05');
    expect((screen.getByLabelText(/Evening Time Minute/i) as HTMLSelectElement).value).toBe('45');
    expect(screen.getByRole('button', { name: /Evening Time PM/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('triggers onChange with 24-hour formatted value when hour is changed', () => {
    const handleChange = vi.fn();
    render(
      <Time12HourPicker
        id="picker-hour"
        label="Start Time"
        value="09:30"
        onChange={handleChange}
      />
    );

    const hourSelect = screen.getByLabelText(/Start Time Hour/i);
    fireEvent.change(hourSelect, { target: { value: '11' } });

    expect(handleChange).toHaveBeenCalledWith('11:30');
  });

  it('triggers onChange with 24-hour formatted value when minute is changed', () => {
    const handleChange = vi.fn();
    render(
      <Time12HourPicker
        id="picker-min"
        label="Start Time"
        value="09:30"
        onChange={handleChange}
      />
    );

    const minSelect = screen.getByLabelText(/Start Time Minute/i);
    fireEvent.change(minSelect, { target: { value: '45' } });

    expect(handleChange).toHaveBeenCalledWith('09:45');
  });

  it('triggers onChange with 24-hour formatted value when AM/PM is toggled', () => {
    const handleChange = vi.fn();
    render(
      <Time12HourPicker
        id="picker-period"
        label="Start Time"
        value="09:30"
        onChange={handleChange}
      />
    );

    const pmBtn = screen.getByRole('button', { name: /Start Time PM/i });
    fireEvent.click(pmBtn);

    // 09:30 AM toggled to PM -> 21:30
    expect(handleChange).toHaveBeenCalledWith('21:30');
  });

  it('correctly calculates 24-hour format when selecting 12 with AM/PM', () => {
    const handleChange = vi.fn();
    render(
      <Time12HourPicker
        id="picker-12"
        label="Time"
        value="12:30" // 12:30 PM
        onChange={handleChange}
      />
    );

    // Click AM to switch from 12:30 PM to 12:30 AM -> 00:30
    const amBtn = screen.getByRole('button', { name: /Time AM/i });
    fireEvent.click(amBtn);

    expect(handleChange).toHaveBeenCalledWith('00:30');
  });
});
