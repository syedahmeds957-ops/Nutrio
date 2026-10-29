import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatNumber,
  formatPercent,
  formatRate,
  formatTime,
  monthName,
  weekdayName,
  weekdayShort,
} from '../format.js';

const ARABIC_INDIC = /[٠-٩۰-۹]/;
const ARABIC_SCRIPT = /[؀-ۿ]/;
const OCT_25 = Date.UTC(2026, 9, 25);

describe('formatNumber', () => {
  it('PK: Latin digits, comma grouping', () => {
    expect(formatNumber(1068, 'en')).toBe('1,068');
    expect(formatNumber(1234567.89, 'en', { maximumFractionDigits: 1 })).toBe('1,234,567.9');
  });

  it('SA: Western digits too, same grouping as before', () => {
    expect(formatNumber(1068, 'ar')).toBe('1,068');
    expect(formatNumber(2.5, 'ar', { maximumFractionDigits: 1 })).toBe('2.5');
    expect(formatNumber(1068, 'ar')).not.toMatch(ARABIC_INDIC);
  });

  it('defaults to English', () => {
    expect(formatNumber(1500)).toBe('1,500');
  });
});

describe('formatDate', () => {
  it('PK: English day and month, no Arabic', () => {
    const text = formatDate(OCT_25, 'en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    expect(text).toBe('25 Oct 2026');
    expect(text).not.toMatch(ARABIC_SCRIPT);
  });

  it('SA: Arabic month, Gregorian year, Western digits', () => {
    const text = formatDate(OCT_25, 'ar', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    expect(text).toContain('أكتوبر');
    expect(text).toContain('2026');
    expect(text).not.toMatch(ARABIC_INDIC);
  });
});

describe('formatTime', () => {
  const at = new Date(2026, 9, 25, 21, 5);

  it('PK: Latin digits and AM/PM', () => {
    const text = formatTime(at, 'en');
    expect(text).toMatch(/9:05/);
    expect(text).toMatch(/PM/i);
    expect(text).not.toMatch(ARABIC_SCRIPT);
  });

  it('SA: Western digits with an Arabic day-period marker', () => {
    const text = formatTime(at, 'ar');
    expect(text).toMatch(/9:05/);
    expect(text).not.toMatch(ARABIC_INDIC);
  });
});

describe('weekday and month names', () => {
  it('PK: English, Monday first', () => {
    expect(weekdayShort(0, 'en')).toBe('Mon');
    expect(weekdayShort(6, 'en')).toBe('Sun');
    expect(weekdayName(2, 'en', 'long')).toBe('Wednesday');
    expect(monthName(0, 'en')).toBe('January');
    expect(monthName(9, 'en', 'short')).toBe('Oct');
  });

  it('SA: Arabic names', () => {
    expect(weekdayName(0, 'ar', 'long')).toBe('الاثنين');
    expect(weekdayName(6, 'ar', 'long')).toBe('الأحد');
    expect(monthName(9, 'ar')).toBe('أكتوبر');
  });

  it('wraps out-of-range indexes', () => {
    expect(weekdayShort(7, 'en')).toBe('Mon');
    expect(weekdayShort(-1, 'en')).toBe('Sun');
    expect(monthName(12, 'en')).toBe('January');
  });
});

describe('formatPercent', () => {
  it('en: whole numbers from 10 up, one decimal below 10', () => {
    expect(formatPercent(36.7, 'en')).toBe('37%');
    expect(formatPercent(25.3, 'en')).toBe('25%');
    expect(formatPercent(40, 'en')).toBe('40%');
    expect(formatPercent(4.46, 'en')).toBe('4.5%');
    expect(formatPercent(0, 'en')).toBe('0%');
    expect(formatPercent(100, 'en')).toBe('100%');
  });
  it('explicit options still win', () => {
    expect(formatPercent(25.26, 'en', { maximumFractionDigits: 1 })).toBe('25.3%');
  });
  it('ar: Latin digits, number and sign kept together by left-to-right marks', () => {
    const out = formatPercent(25.3, 'ar');
    expect(out).toBe('\u200E25%\u200E');
    expect(out).not.toMatch(ARABIC_INDIC);
  });
});

describe('formatRate', () => {
  it('keeps the pace steps exact and tidies everything else', () => {
    expect(formatRate(0.25)).toBe('0.25');
    expect(formatRate(0.5)).toBe('0.5');
    expect(formatRate(0.75)).toBe('0.75');
    expect(formatRate(1)).toBe('1');
    expect(formatRate(0.62)).toBe('0.6');
    expect(formatRate(0.4999)).toBe('0.5');
  });
  it('rounds a safety limit down so it is never shown above the real limit', () => {
    expect(formatRate(0.62, 'en', 'down')).toBe('0.6');
    expect(formatRate(0.59, 'en', 'down')).toBe('0.55');
    expect(formatRate(0.4, 'en', 'down')).toBe('0.4');
    expect(formatRate(0.15, 'en', 'down')).toBe('0.15');
  });
  it('ar: Latin digits', () => {
    expect(formatRate(0.62, 'ar')).toBe('0.6');
    expect(formatRate(0.62, 'ar')).not.toMatch(ARABIC_INDIC);
  });
});
