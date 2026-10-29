import {
  Experience,
  FocusArea,
  MovementPattern,
  SessionMinutes,
  SessionTemplateId,
  SlotRole,
  SplitId,
  TrainingLocation,
} from './types.js';

export interface TemplateSlot {
  pattern: MovementPattern;
  role: SlotRole;
}

const main = (pattern: MovementPattern): TemplateSlot => ({ pattern, role: 'main' });
const acc = (pattern: MovementPattern): TemplateSlot => ({ pattern, role: 'accessory' });

/**
 * Each session is an ordered list of slots, main lifts first. A session of N
 * slots takes the first N, so the order is also the priority order.
 */
export const SESSION_TEMPLATES: Record<SessionTemplateId, readonly TemplateSlot[]> = {
  full_a: [main('squat'), main('horizontal_push'), acc('horizontal_pull'), acc('hinge'), acc('shoulders_iso'), acc('core'), acc('calves')],
  full_b: [main('hinge'), main('vertical_push'), acc('vertical_pull'), acc('lunge'), acc('triceps'), acc('core'), acc('glutes')],
  full_c: [main('lunge'), main('horizontal_push'), acc('vertical_pull'), acc('hinge'), acc('biceps'), acc('core'), acc('calves')],
  upper: [main('horizontal_push'), main('horizontal_pull'), acc('vertical_push'), acc('vertical_pull'), acc('biceps'), acc('triceps'), acc('shoulders_iso')],
  lower: [main('squat'), main('hinge'), acc('lunge'), acc('glutes'), acc('core'), acc('calves'), acc('squat')],
  push: [main('horizontal_push'), main('vertical_push'), acc('horizontal_push'), acc('triceps'), acc('shoulders_iso'), acc('triceps'), acc('core')],
  pull: [main('vertical_pull'), main('horizontal_pull'), acc('horizontal_pull'), acc('biceps'), acc('shoulders_iso'), acc('biceps'), acc('core')],
  legs: [main('squat'), main('hinge'), acc('lunge'), acc('glutes'), acc('calves'), acc('core'), acc('hinge')],
  core: [acc('core'), acc('core'), acc('core'), acc('core'), acc('core'), acc('core'), acc('core')],
  arms: [acc('biceps'), acc('triceps'), acc('biceps'), acc('triceps'), acc('biceps'), acc('triceps'), acc('biceps')],
};

export interface SplitChoice {
  split: SplitId;
  /** One template per training day, in week order. */
  templates: SessionTemplateId[];
}

const FULL_BODY_ROTATION: readonly SessionTemplateId[] = ['full_a', 'full_b', 'full_c'];

export function chooseSplit(days: number, experience: Experience, location: TrainingLocation): SplitChoice {
  if (days < 2 || days > 6) throw new RangeError(`No split for ${days} training days`);
  // With no equipment there is nothing to pull with, so an "upper" day would be
  // push-ups and bridges. Rotating the three full-body days keeps every session
  // balanced instead.
  if (location === 'home_none' && days > 3) {
    return {
      split: `full_body_${days}` as SplitId,
      templates: Array.from({ length: days }, (_, i) => FULL_BODY_ROTATION[i % FULL_BODY_ROTATION.length]),
    };
  }
  switch (days) {
    case 2:
      return { split: 'full_body_2', templates: ['full_a', 'full_b'] };
    case 3:
      return experience === 'experienced' && location === 'gym'
        ? { split: 'ppl_3', templates: ['push', 'pull', 'legs'] }
        : { split: 'full_body_3', templates: ['full_a', 'full_b', 'full_c'] };
    case 4:
      return { split: 'upper_lower_4', templates: ['upper', 'lower', 'upper', 'lower'] };
    case 5:
      return { split: 'upper_lower_ppl_5', templates: ['upper', 'lower', 'push', 'pull', 'legs'] };
    case 6:
      return { split: 'ppl_6', templates: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] };
    default:
      throw new RangeError(`No split for ${days} training days`);
  }
}

export const SLOTS_FOR_MINUTES: Record<SessionMinutes, number> = { 20: 3, 30: 4, 45: 5, 60: 6, 75: 7 };

const FOCUS_PATTERNS: Record<FocusArea, readonly MovementPattern[]> = {
  full_body: [],
  upper: ['vertical_push', 'vertical_pull', 'horizontal_push', 'horizontal_pull'],
  lower_glutes: ['glutes', 'lunge'],
  core: ['core'],
  arms: ['biceps', 'triceps'],
};

/**
 * A template's slots with focus applied: each focus area moves the first
 * accessory of a matching pattern up to just after the main lifts, so it
 * survives when a short session drops the tail.
 */
export function slotsWithFocus(template: SessionTemplateId, focus: readonly FocusArea[]): TemplateSlot[] {
  const slots = [...SESSION_TEMPLATES[template]];
  const mainCount = slots.filter((slot) => slot.role === 'main').length;
  let insertAt = mainCount;
  for (const area of focus) {
    const patterns = FOCUS_PATTERNS[area];
    const index = slots.findIndex((slot, i) => i >= insertAt && slot.role === 'accessory' && patterns.includes(slot.pattern));
    if (index < 0) continue;
    const [promoted] = slots.splice(index, 1);
    slots.splice(insertAt, 0, promoted);
    insertAt += 1;
  }
  return slots;
}

/** The only patterns a strict focus plan may use. Everything else is dropped rather than substituted. */
const FOCUS_ONLY: Record<Exclude<FocusArea, 'full_body'>, readonly MovementPattern[]> = {
  upper: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull', 'biceps', 'triceps', 'shoulders_iso'],
  lower_glutes: ['squat', 'hinge', 'lunge', 'glutes', 'calves'],
  core: ['core'],
  arms: ['biceps', 'triceps'],
};

const FOCUS_TEMPLATES: Record<Exclude<FocusArea, 'full_body'>, readonly SessionTemplateId[]> = {
  upper: ['upper', 'push', 'pull'],
  lower_glutes: ['lower', 'legs'],
  core: ['core'],
  arms: ['arms'],
};

const FOCUS_ORDER: readonly Exclude<FocusArea, 'full_body'>[] = ['upper', 'lower_glutes', 'core', 'arms'];

export interface FocusSplit extends SplitChoice {
  /** Slots outside these patterns are left out of the plan. */
  only: ReadonlySet<MovementPattern>;
}

/**
 * A plan that trains only what the user asked to focus on: upper body means
 * upper-body sessions every day, and so on. Several areas take turns across the
 * days. "Full body", or no focus, returns null and the usual split applies.
 */
export function focusSplit(days: number, focus: readonly FocusArea[]): FocusSplit | null {
  if (focus.length === 0 || focus.includes('full_body')) return null;
  if (days < 2 || days > 6) throw new RangeError(`No split for ${days} training days`);
  const areas = FOCUS_ORDER.filter((area) => focus.includes(area));
  if (areas.length === 0) return null;
  const used = new Map<string, number>();
  const templates = Array.from({ length: days }, (_, i) => {
    const area = areas[i % areas.length];
    const n = used.get(area) ?? 0;
    used.set(area, n + 1);
    const options = FOCUS_TEMPLATES[area];
    return options[n % options.length];
  });
  return {
    split: areas.length > 1 ? 'focus_mixed' : (`focus_${areas[0] === 'lower_glutes' ? 'lower' : areas[0]}` as SplitId),
    templates,
    only: new Set(areas.flatMap((area) => FOCUS_ONLY[area])),
  };
}
