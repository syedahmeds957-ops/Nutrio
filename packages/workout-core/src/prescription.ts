import { Experience, Prescription, SlotRole, WorkoutGoal } from './types.js';

export interface Caps {
  ramadan: boolean;
  lowIntensity: boolean;
}

type Base = Omit<Prescription, 'unit'>;

const TABLE: Record<WorkoutGoal, Record<SlotRole, Base>> = {
  strength: {
    main: { sets: 4, repMin: 4, repMax: 6, restSec: 150, targetRir: 2 },
    accessory: { sets: 3, repMin: 8, repMax: 10, restSec: 90, targetRir: 2 },
  },
  muscle: {
    main: { sets: 3, repMin: 8, repMax: 12, restSec: 90, targetRir: 1 },
    accessory: { sets: 3, repMin: 10, repMax: 15, restSec: 60, targetRir: 1 },
  },
  fat_loss: {
    main: { sets: 3, repMin: 10, repMax: 15, restSec: 60, targetRir: 2 },
    accessory: { sets: 2, repMin: 12, repMax: 15, restSec: 60, targetRir: 2 },
  },
  general: {
    main: { sets: 3, repMin: 10, repMax: 15, restSec: 60, targetRir: 2 },
    accessory: { sets: 2, repMin: 12, repMax: 15, restSec: 60, targetRir: 2 },
  },
};

/** Holds and planks: a time range instead of reps, whatever the goal. */
const TIMED_RANGE = { repMin: 30, repMax: 45 } as const;

export function capsApply(caps: Caps): boolean {
  return caps.ramadan || caps.lowIntensity;
}

export function prescribe(goal: WorkoutGoal, experience: Experience, role: SlotRole, caps: Caps, timed: boolean): Prescription {
  const base = TABLE[goal][role];
  const prescription: Prescription = { ...base, unit: 'reps' };

  if (experience === 'new') {
    prescription.sets = Math.max(2, prescription.sets - 1);
    prescription.targetRir += 1;
  }
  if (capsApply(caps)) {
    prescription.targetRir = Math.max(prescription.targetRir, caps.lowIntensity ? 3 : 2);
    prescription.restSec = Math.max(prescription.restSec, 90);
  }
  if (timed) {
    prescription.unit = 'seconds';
    prescription.repMin = TIMED_RANGE.repMin;
    prescription.repMax = TIMED_RANGE.repMax;
  }
  return prescription;
}
