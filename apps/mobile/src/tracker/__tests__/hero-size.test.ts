import { describe, expect, it } from 'vitest';
import { heroSize } from '../ui/DailyProgressHeader.js';

describe('heroSize', () => {
  it('keeps the usual numbers at full size and steps down for long ones', () => {
    expect(heroSize('0').fontSize).toBe(48);
    expect(heroSize('1,068').fontSize).toBe(48);
    expect(heroSize('12,345').fontSize).toBe(40);
    expect(heroSize('123,456').fontSize).toBe(32);
  });

  it('never goes near the few points the auto-shrink left in Arabic', () => {
    for (const text of ['1', '907', '1,068', '10,000', '100,000']) expect(heroSize(text).fontSize).toBeGreaterThanOrEqual(32);
  });

  it('gives each size a line height that fits it', () => {
    for (const text of ['1,068', '12,345', '123,456']) {
      const { fontSize, lineHeight } = heroSize(text);
      expect(lineHeight).toBeGreaterThanOrEqual(fontSize);
    }
  });
});
