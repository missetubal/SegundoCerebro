import { describe, expect, it } from 'vitest';
import {
  calendarDateInTimeZone,
  isoWeekdayFromDateYmd,
  isoWeekdayToJs,
  jsWeekdayToIso,
  shiftCalendarDate,
} from './calendar';

describe('weekday conversion', () => {
  it('maps JS Sunday (0) to ISO 7 and back', () => {
    expect(jsWeekdayToIso(0)).toBe(7);
    expect(isoWeekdayToJs(7)).toBe(0);
  });

  it('maps Monday–Saturday 1–6 unchanged', () => {
    for (const day of [1, 2, 3, 4, 5, 6]) {
      expect(jsWeekdayToIso(day)).toBe(day);
      expect(isoWeekdayToJs(day)).toBe(day);
    }
  });
});

describe('isoWeekdayFromDateYmd', () => {
  it('returns ISO weekdays for known dates', () => {
    // 2026-10-16 is a Friday
    expect(isoWeekdayFromDateYmd('2026-10-16')).toBe(5);
    // 2026-10-18 is a Sunday → ISO 7
    expect(isoWeekdayFromDateYmd('2026-10-18')).toBe(7);
    // 2026-10-19 is a Monday → ISO 1
    expect(isoWeekdayFromDateYmd('2026-10-19')).toBe(1);
  });
});

describe('shiftCalendarDate', () => {
  it('moves to the previous calendar day across month and year boundaries', () => {
    expect(shiftCalendarDate('2026-10-19', -1)).toBe('2026-10-18');
    expect(shiftCalendarDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftCalendarDate('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('calendarDateInTimeZone', () => {
  it('formats the calendar date in the given zone', () => {
    // 2026-10-16 02:00 UTC is still 2026-10-15 23:00 in America/Sao_Paulo (UTC-3)
    const instant = new Date('2026-10-16T02:00:00.000Z');
    expect(calendarDateInTimeZone('UTC', instant)).toBe('2026-10-16');
    expect(calendarDateInTimeZone('America/Sao_Paulo', instant)).toBe(
      '2026-10-15',
    );
  });
});
