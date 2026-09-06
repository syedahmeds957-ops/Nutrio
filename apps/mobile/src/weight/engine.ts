import {
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
    const entryDate = date ?? new Date().toISOString().split('T')[0];
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
    const entryDate = date ?? new Date().toISOString().split('T')[0];
    this.intakeLogs = this.intakeLogs.filter((i) => i.date !== entryDate);
    const newIntake: DailyIntakeLog = { date: entryDate, kcal: Math.round(kcal) };
    this.intakeLogs.push(newIntake);
    this.intakeLogs.sort((a, b) => a.date.localeCompare(b.date));
    return newIntake;
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
      dailyWeighInsKg: this.weighIns.map((w, idx) => ({
        dayIndex: idx + 1,
        weightKg: w.weightKg,
      })),
      dailyIntakeKcal: this.intakeLogs.map((i, idx) => ({
        dayIndex: idx + 1,
        kcal: i.kcal,
      })),
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

  public checkSpikeWarning(currentWeight: number): {
    hasSpike: boolean;
    message?: string;
  } {
    if (this.weighIns.length === 0) return { hasSpike: false };
    const lastWeight = this.weighIns[this.weighIns.length - 1].weightKg;
    const diff = currentWeight - lastWeight;

    if (diff >= 2.0) {
      return {
        hasSpike: true,
        message: `Temporary +${diff.toFixed(
          1
        )} kg water-weight fluctuation (likely sodium/carb retention from a desi meal). Our EWMA algorithm filters this noise automatically.`,
      };
    }

    return { hasSpike: false };
  }
}
