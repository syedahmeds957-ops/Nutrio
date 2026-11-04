import { describe, expect, it } from 'vitest';
import { EXERCISES, exercisesFor, getExercise } from '../src/catalogue.js';
import { MUSCLE_NAMES } from '../src/muscles.js';
import { Equipment, MovementPattern } from '../src/types.js';

const MAIN_PATTERNS: MovementPattern[] = [
  'squat',
  'hinge',
  'lunge',
  'horizontal_push',
  'horizontal_pull',
  'vertical_push',
  'vertical_pull',
  'core',
];

/** Everything a user could own in each training location. */
const LOCATIONS: Record<string, Equipment[] | undefined> = {
  home_none: [],
  home_equipment: ['dumbbell', 'bands', 'kettlebell', 'bench', 'pullup_bar'],
  gym: undefined,
};

/**
 * Patterns the public-domain dataset can't fill three times for someone with
 * no equipment at all. The generator falls back to a related pattern for these
 * (phase 2), and the setup screen tells home users a band unlocks pulling work.
 */
const KNOWN_GAPS: Record<string, number> = {
  'home_none:squat': 2,
  'home_none:hinge': 2,
  'home_none:horizontal_pull': 0,
  'home_none:vertical_push': 0,
  'home_none:vertical_pull': 0,
};

const ARABIC = /[؀-ۿ]/;
const LOAD_FREE: ReadonlySet<Equipment> = new Set(['bodyweight', 'bands', 'bench', 'pullup_bar']);

describe('exercise catalogue', () => {
  it('has about 170 exercises with unique kebab-case ids', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(160);
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('names and instructions exist in English and Arabic, step for step', () => {
    for (const e of EXERCISES) {
      expect(e.name.en.trim(), e.id).not.toBe('');
      expect(e.name.ar, e.id).toMatch(ARABIC);
      expect(e.instructions.en.length, e.id).toBeGreaterThanOrEqual(3);
      expect(e.instructions.ar.length, e.id).toBe(e.instructions.en.length);
      for (const step of e.instructions.ar) expect(step, e.id).toMatch(ARABIC);
      for (const step of e.instructions.en) expect(step.trim(), e.id).not.toBe('');
    }
  });

  it('never includes expert exercises', () => {
    for (const e of EXERCISES) expect(['beginner', 'intermediate'], e.id).toContain(e.level);
  });

  it('names every muscle it references', () => {
    for (const e of EXERCISES) {
      expect(e.primaryMuscles.length, e.id).toBeGreaterThan(0);
      for (const m of [...e.primaryMuscles, ...e.secondaryMuscles]) expect(MUSCLE_NAMES[m], `${e.id}: ${m}`).toBeDefined();
    }
  });

  it('tracks load only for weighted, rep-counted exercises', () => {
    for (const e of EXERCISES) {
      if (e.timed || e.equipment.every((item) => LOAD_FREE.has(item))) {
        expect(e.tracksLoad, e.id).toBe(false);
      }
    }
    expect(getExercise('barbell-bench-press')?.tracksLoad).toBe(true);
    expect(getExercise('push-up')?.tracksLoad).toBe(false);
    expect(getExercise('back-extension')?.tracksLoad).toBe(false);
  });

  describe('bodyweight ladders', () => {
    it('link to existing exercises of the same pattern, in both directions', () => {
      for (const e of EXERCISES) {
        if (e.harder) {
          const next = getExercise(e.harder);
          expect(next, `${e.id} -> ${e.harder}`).toBeDefined();
          expect(next?.pattern, e.id).toBe(e.pattern);
          expect(next?.easier, `${e.harder} should step back to ${e.id}`).toBe(e.id);
        }
        if (e.easier) expect(getExercise(e.easier)?.harder, `${e.easier} should step up to ${e.id}`).toBe(e.id);
      }
    });

    it('have no cycles', () => {
      for (const start of EXERCISES) {
        const seen = new Set<string>();
        let current = start.harder;
        while (current) {
          expect(seen.has(current), `cycle from ${start.id}`).toBe(false);
          seen.add(current);
          current = getExercise(current)?.harder;
        }
      }
    });

    it('cover push, squat, hinge, core and pulling', () => {
      const laddered = new Set(EXERCISES.filter((e) => e.harder).map((e) => e.pattern));
      for (const pattern of ['horizontal_push', 'squat', 'hinge', 'core', 'vertical_pull'] as const) {
        expect(laddered.has(pattern), pattern).toBe(true);
      }
    });
  });

  describe('coverage per training location', () => {
    for (const [location, equipment] of Object.entries(LOCATIONS)) {
      for (const pattern of MAIN_PATTERNS) {
        const key = `${location}:${pattern}`;
        it(`${key} has at least ${KNOWN_GAPS[key] ?? 3} options`, () => {
          const count = exercisesFor({ pattern, equipment }).length;
          if (key in KNOWN_GAPS) {
            // Pinned so a curation change that fills or widens a gap is noticed.
            expect(count).toBe(KNOWN_GAPS[key]);
          } else {
            expect(count).toBeGreaterThanOrEqual(3);
          }
        });
      }
    }

    it('gives new lifters a beginner option for every main pattern at home with equipment and at the gym', () => {
      for (const location of ['home_equipment', 'gym']) {
        for (const pattern of MAIN_PATTERNS) {
          const count = exercisesFor({ pattern, equipment: LOCATIONS[location], maxLevel: 'beginner' }).length;
          expect(count, `${location}:${pattern}`).toBeGreaterThanOrEqual(3);
        }
      }
    });

    it('has conditioning moves for a finisher in every location', () => {
      for (const equipment of Object.values(LOCATIONS)) {
        expect(exercisesFor({ pattern: 'conditioning', equipment }).length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('exercisesFor', () => {
    it('only returns exercises whose every required item is available', () => {
      const home = exercisesFor({ equipment: ['dumbbell'] });
      expect(home.length).toBeGreaterThan(0);
      for (const e of home) expect(e.equipment.every((item) => item === 'bodyweight' || item === 'dumbbell'), e.id).toBe(true);
      expect(home.some((e) => e.id === 'dumbbell-bench-press')).toBe(false);
      expect(exercisesFor({ equipment: ['dumbbell', 'bench'] }).some((e) => e.id === 'dumbbell-bench-press')).toBe(true);
    });

    it('drops exercises that load a protected joint', () => {
      const safe = exercisesFor({ excludeJoints: ['knee', 'shoulder'] });
      for (const e of safe) {
        expect(e.jointLoads.includes('knee') || e.jointLoads.includes('shoulder'), e.id).toBe(false);
      }
    });

    it('keeps intermediate exercises away from beginners', () => {
      for (const e of exercisesFor({ maxLevel: 'beginner' })) expect(e.level, e.id).toBe('beginner');
    });
  });
});
