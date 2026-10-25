import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addDaysToKey, daysBetweenKeys, localDateKey, weekKeysFromMonday } from '../dateKey.js';

describe('localDateKey', () => {
  const originalTz = process.env.TZ;

  beforeEach(() => {
    // Node re-reads TZ on assignment, so Date's local getters follow it.
    process.env.TZ = 'Asia/Karachi'; // UTC+5, no DST
  });

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it('keys a 2 am Karachi log to the local day, not the previous UTC day', () => {
    // 2026-10-14 02:00 in Karachi is 2026-10-13 21:00 UTC.
    const twoAmKarachi = new Date('2026-10-13T21:00:00Z');

    expect(twoAmKarachi.toISOString().split('T')[0]).toBe('2026-10-13'); // the old, wrong key
    expect(localDateKey(twoAmKarachi)).toBe('2026-10-14');
  });

  it('keys a late-evening log to the same local day', () => {
    // 2026-10-13 23:30 in Karachi is 18:30 UTC the same day.
    expect(localDateKey(new Date('2026-10-13T18:30:00Z'))).toBe('2026-10-13');
  });

  it('keys a Riyadh 1 am log to the local day', () => {
    process.env.TZ = 'Asia/Riyadh'; // UTC+3
    // 2026-10-14 01:00 in Riyadh is 2026-10-13 22:00 UTC.
    expect(localDateKey(new Date('2026-10-13T22:00:00Z'))).toBe('2026-10-14');
  });

  it('zero-pads month and day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});

describe('addDaysToKey', () => {
  it('steps backwards across a month boundary', () => {
    expect(addDaysToKey('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('steps forwards across a year boundary', () => {
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles leap days', () => {
    expect(addDaysToKey('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('does not depend on the device time zone', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'Pacific/Kiritimati'; // UTC+14
    try {
      expect(addDaysToKey('2026-10-14', -1)).toBe('2026-10-13');
    } finally {
      process.env.TZ = originalTz;
    }
  });
});

describe('daysBetweenKeys', () => {
  it('counts whole days across month and year boundaries', () => {
    expect(daysBetweenKeys('2026-12-30', '2027-01-02')).toBe(3);
    expect(daysBetweenKeys('2026-10-14', '2026-10-01')).toBe(-13);
    expect(daysBetweenKeys('2026-10-14', '2026-10-14')).toBe(0);
  });
});

describe('weekKeysFromMonday', () => {
  it('starts the week on the Monday before a Sunday', () => {
    // 2026-10-25 is a Sunday.
    expect(weekKeysFromMonday(new Date(2026, 9, 25, 12))).toEqual([
      '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22',
      '2026-10-23', '2026-10-24', '2026-10-25',
    ]);
  });

  it('keeps a Monday as the first day and crosses month ends', () => {
    const week = weekKeysFromMonday(new Date(2026, 10, 30, 9)); // Monday 30 Nov
    expect(week[0]).toBe('2026-11-30');
    expect(week[6]).toBe('2026-12-06');
  });
});
