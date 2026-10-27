import {
  AdaptiveTDEEInput,
  calculateAdaptiveTDEE,
  calculateEWMA,
  EWMA_ALPHA,
} from '@nutrio/nutrition-core';
import {
  DailyIntakeLog,
  WeighInEntry,
  WeightTrackerState,
  WeightTrendPoint,
  WeightTrendSummary,
} from './types.js';
import { daysBetweenKeys, localDateKey } from '../common/dateKey.js';

export function validateWeighIn(weightKg: number): {
  isValid: boolean;
  error?: string;
} {
  if (isNaN(weightKg) || weightKg <= 0) {
    return { isValid: false, error: 'Please enter a valid weight in kg.' };
  }
  if (weightKg < 25 || weightKg > 300) {
    return {
      isValid: false,
      error: 'Weight must be between 25 kg and 300 kg.',
    };
  }
  return { isValid: true };
}

/**
 * The adaptive TDEE series: only days with both a weigh-in and a food log,
 * each positioned by its calendar day. Pairing by list position matched one
 * day's weight with another day's food, and counting logs instead of days made
 * a change spread over weeks look days long.
 */
export function pairDailyLogs(
  weighIns: WeighInEntry[],
  intakeLogs: DailyIntakeLog[]
): Pick<AdaptiveTDEEInput, 'dailyWeighInsKg' | 'dailyIntakeKcal'> {
  const kcalByDate = new Map(intakeLogs.map((log) => [log.date, log.kcal]));
  const paired = weighIns
    .filter((w) => kcalByDate.has(w.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (paired.length === 0) return { dailyWeighInsKg: [], dailyIntakeKcal: [] };

  const first = paired[0].date;
  const dayIndex = (date: string) => daysBetweenKeys(first, date) + 1;
  return {
    dailyWeighInsKg: paired.map((w) => ({ dayIndex: dayIndex(w.date), weightKg: w.weightKg })),
    dailyIntakeKcal: paired.map((w) => ({ dayIndex: dayIndex(w.date), kcal: kcalByDate.get(w.date)! })),
  };
}

export class WeightTrendEngine {
  private weighIns: WeighInEntry[] = [];
  private intakeLogs: DailyIntakeLog[] = [];
  private formulaTDEE: number;
  private bmr: number;

  constructor(initial: WeightTrackerState) {
    this.weighIns = [...initial.weighIns].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    this.intakeLogs = [...initial.intakeLogs].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    this.formulaTDEE = initial.formulaTDEE;
    this.bmr = initial.bmr;
  }

  public logWeighIn(
    weightKg: number,
    date?: string,
    notes?: string
  ): WeighInEntry {
    const entryDate = date ?? localDateKey();
    const validation = validateWeighIn(weightKg);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const rounded = Number(weightKg.toFixed(1));

    // Remove existing entry for the same date if any
    this.weighIns = this.weighIns.filter((w) => w.date !== entryDate);

    const newEntry: WeighInEntry = {
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: entryDate,
      weightKg: rounded,
      notes,
      loggedAt: new Date().toISOString(),
    };

    this.weighIns.push(newEntry);
    this.weighIns.sort((a, b) => a.date.localeCompare(b.date));
    return newEntry;
  }

  public logIntake(kcal: number, date?: string): DailyIntakeLog {
    const entryDate = date ?? localDateKey();
    this.intakeLogs = this.intakeLogs.filter((i) => i.date !== entryDate);
    const newIntake: DailyIntakeLog = { date: entryDate, kcal: Math.round(kcal) };
    this.intakeLogs.push(newIntake);
    this.intakeLogs.sort((a, b) => a.date.localeCompare(b.date));
    return newIntake;
  }

  /**
   * Every weigh-in, oldest first. Exposed so the screen can hand the whole list
   * to storage after a change — the engine already owns the rules (one entry
   * per date, sorted), so re-deriving them anywhere else would be a second
   * chance to disagree with it.
   */
  public getWeighIns(): WeighInEntry[] {
    return [...this.weighIns];
  }

  public deleteWeighIn(id: string): boolean {
    const initialLen = this.weighIns.length;
    this.weighIns = this.weighIns.filter((w) => w.id !== id);
    return this.weighIns.length < initialLen;
  }

  public getSummary(): WeightTrendSummary {
    if (this.weighIns.length === 0) {
      return {
        currentWeightKg: 0,
        startWeightKg: 0,
        totalDeltaKg: 0,
        currentEWMAKg: 0,
        points: [],
        adaptiveTDEE: calculateAdaptiveTDEE({
          formulaTDEE: this.formulaTDEE,
          bmr: this.bmr,
          dailyWeighInsKg: [],
          dailyIntakeKcal: [],
        }),
      };
    }

    const rawWeights = this.weighIns.map((w) => w.weightKg);
    const ewmaSeries = calculateEWMA(rawWeights, rawWeights[0], EWMA_ALPHA);

    const points: WeightTrendPoint[] = this.weighIns.map((w, idx) => ({
      date: w.date,
      rawWeightKg: w.weightKg,
      ewmaWeightKg: ewmaSeries[idx],
    }));

    const startWeightKg = rawWeights[0];
    const currentWeightKg = rawWeights[rawWeights.length - 1];
    const currentEWMAKg = ewmaSeries[ewmaSeries.length - 1];
    const totalDeltaKg = Number((currentEWMAKg - ewmaSeries[0]).toFixed(1));

    // Calculate adaptive TDEE
    const adaptiveTDEE = calculateAdaptiveTDEE({
      formulaTDEE: this.formulaTDEE,
      bmr: this.bmr,
      ...pairDailyLogs(this.weighIns, this.intakeLogs),
    });

    return {
      currentWeightKg,
      startWeightKg,
      totalDeltaKg,
      currentEWMAKg,
      points,
      adaptiveTDEE,
    };
  }

  /**
   * `message` is the English fallback; screens show their own translated text
   * built from `diffKg`.
   */
  public checkSpikeWarning(currentWeight: number): {
    hasSpike: boolean;
    message?: string;
    diffKg?: number;
  } {
    if (this.weighIns.length === 0) return { hasSpike: false };
    const lastWeight = this.weighIns[this.weighIns.length - 1].weightKg;
    const diff = currentWeight - lastWeight;

    if (diff >= 2.0) {
      return {
        hasSpike: true,
        diffKg: diff,
        message: `Temporary +${diff.toFixed(
          1
        )} kg water-weight fluctuation (likely sodium/carb retention from a desi meal). Your trend line smooths this out automatically.`,
      };
    }

    return { hasSpike: false };
  }
}
