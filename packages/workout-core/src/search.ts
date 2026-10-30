import { EXERCISES } from './catalogue.js';
import { isAllowed } from './select.js';
import { Exercise, WorkoutSettings } from './types.js';

/**
 * Words people type that our names don't contain, mapped to words they do.
 * Search runs over English and Arabic names plus these, so "ohp", "rdl" or
 * "سكوات" find the right exercise.
 */
const ALIASES: Record<string, readonly string[]> = {
  bench: ['bench press'],
  ohp: ['shoulder press', 'overhead press'],
  military: ['shoulder press', 'overhead press'],
  rdl: ['romanian deadlift'],
  deadlift: ['deadlift'],
  lat: ['pulldown', 'pull-down'],
  'lat pull': ['pulldown'],
  pullup: ['pull-up'],
  'pull up': ['pull-up'],
  chinup: ['chin-up'],
  'chin up': ['chin-up'],
  pushup: ['push-up'],
  'push up': ['push-up'],
  skull: ['skull crusher'],
  tricep: ['triceps'],
  bicep: ['biceps', 'curl'],
  leg: ['leg press', 'leg curl', 'leg extension'],
  abs: ['crunch', 'plank', 'sit-up'],
  treadmill: ['treadmill'],
  cycle: ['bike'],
  cycling: ['bike'],
  walk: ['walk'],
  'سكوات': ['squat'],
  'بنش': ['bench press'],
  'ديدلفت': ['deadlift'],
  'بلانك': ['plank'],
  'دمبل': ['dumbbell'],
  'بار': ['barbell'],
};

/** Lower-case, no Arabic diacritics or tatweel, alef forms unified, so typing need not be exact. */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SearchOptions {
  limit?: number;
  /** Only exercises this user can do (equipment, level, joints, dislikes); omit to search everything. */
  settings?: WorkoutSettings;
}

/** Exercises matching a typed name in English or Arabic, best match first. */
export function searchExercises(query: string, options: SearchOptions = {}): Exercise[] {
  const { limit = 20, settings } = options;
  const q = normalizeSearch(query);
  if (!q) return [];
  const terms = [q, ...Object.entries(ALIASES).filter(([alias]) => q.includes(alias)).flatMap(([, words]) => words.map(normalizeSearch))];

  // The most specific term that matches wins ("bench press" over "bench"), then how
  // it matches (whole name, start, start of a word, anywhere), then main lifts first.
  const scored: { exercise: Exercise; length: number; kind: number }[] = [];
  for (const exercise of EXERCISES) {
    if (settings && !isAllowed(exercise, settings)) continue;
    const names = [normalizeSearch(exercise.name.en), normalizeSearch(exercise.name.ar)];
    let best: { length: number; kind: number } | null = null;
    for (const name of names) {
      for (const term of terms) {
        const kind = name === term ? 0 : name.startsWith(term) ? 1 : name.split(' ').some((w) => w.startsWith(term)) ? 2 : name.includes(term) ? 3 : -1;
        if (kind < 0) continue;
        if (!best || term.length > best.length || (term.length === best.length && kind < best.kind)) best = { length: term.length, kind };
      }
    }
    if (best) scored.push({ exercise, ...best });
  }
  return scored
    .sort(
      (a, b) =>
        b.length - a.length ||
        a.kind - b.kind ||
        Number(b.exercise.compound) - Number(a.exercise.compound) ||
        Number(b.exercise.tracksLoad) - Number(a.exercise.tracksLoad) ||
        a.exercise.name.en.length - b.exercise.name.en.length
    )
    .slice(0, limit)
    .map((entry) => entry.exercise);
}
