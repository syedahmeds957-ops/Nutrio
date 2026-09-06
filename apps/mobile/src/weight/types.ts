import { AdaptiveTDEEResult } from '@nutrio/nutrition-core';

export interface WeighInEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  notes?: string;
  loggedAt: string;
}

export interface WeightTrendPoint {
  date: string;
  rawWeightKg: number;
  ewmaWeightKg: number;
}

export interface DailyIntakeLog {
  date: string;
  kcal: number;
}

export interface WeightTrackerState {
  weighIns: WeighInEntry[];
  intakeLogs: DailyIntakeLog[];
  formulaTDEE: number;
  bmr: number;
}

export interface WeightTrendSummary {
  currentWeightKg: number;
  startWeightKg: number;
  totalDeltaKg: number;
  currentEWMAKg: number;
  points: WeightTrendPoint[];
  adaptiveTDEE: AdaptiveTDEEResult;
}
