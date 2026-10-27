import type { WeighInEntry } from './types.js';
import { addDaysToKey } from '../common/dateKey.js';

export interface WeightGlance {
  latestKg: number;
  latestDate: string;
  /** Latest minus the earliest weigh-in of the 7 days up to it; null with no earlier weigh-in in that window. */
  weekDeltaKg: number | null;
  /** The last few weigh-ins, oldest first, for the sparkline. */
  series: number[];
}

const SERIES_LENGTH = 8;

/** What the Today tile shows of the weigh-in log; null while there is none. */
export function weightGlance(entries: readonly WeighInEntry[]): WeightGlance | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const windowStart = addDaysToKey(latest.date, -7);
  const reference = sorted.find((entry) => entry.date >= windowStart && entry.date < latest.date);
  return {
    latestKg: latest.weightKg,
    latestDate: latest.date,
    weekDeltaKg: reference ? Math.round((latest.weightKg - reference.weightKg) * 10) / 10 : null,
    series: sorted.slice(-SERIES_LENGTH).map((entry) => entry.weightKg),
  };
}

export interface SparkPoint {
  x: number;
  y: number;
}

/**
 * Points for a sparkline inside a `width` x `height` box with `pad` px inside
 * every edge. The vertical range is the series' own min/max; a flat series
 * draws mid-height. Fewer than two values draw nothing.
 */
export function sparklinePoints(values: readonly number[], width: number, height: number, pad = 3): SparkPoint[] {
  if (values.length < 2) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const innerW = Math.max(0, width - pad * 2);
  const innerH = Math.max(0, height - pad * 2);
  return values.map((value, i) => ({
    x: pad + (innerW * i) / (values.length - 1),
    y: span === 0 ? height / 2 : pad + innerH * (1 - (value - min) / span),
  }));
}
