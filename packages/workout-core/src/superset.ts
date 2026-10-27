import { MovementPattern, PlannedSlot, WorkoutSettings } from './types.js';

/** Which muscles a pattern works, so two slots can be done back to back without tiring each other. */
type Side = 'push' | 'pull' | 'quads' | 'back_of_leg' | 'trunk';

const SIDE: Partial<Record<MovementPattern, Side>> = {
  horizontal_push: 'push',
  vertical_push: 'push',
  triceps: 'push',
  shoulders_iso: 'push',
  horizontal_pull: 'pull',
  vertical_pull: 'pull',
  biceps: 'pull',
  squat: 'quads',
  lunge: 'quads',
  hinge: 'back_of_leg',
  glutes: 'back_of_leg',
  core: 'trunk',
  calves: 'trunk',
};

/** What each side pairs with; trunk and calf work rests nothing else, so they pair with each other. */
const PARTNER: Record<Side, Side> = {
  push: 'pull',
  pull: 'push',
  quads: 'back_of_leg',
  back_of_leg: 'quads',
  trunk: 'trunk',
};

/**
 * Supersets cut the rest between exercises, so they are only for people who
 * asked for them and can take it: not beginners, not Ramadan (rest stays at
 * 90 s or more) and not low-intensity plans.
 */
export function supersetsApply(settings: WorkoutSettings): boolean {
  return (
    settings.profile?.sessionStyle === 'supersets' &&
    settings.experience !== 'new' &&
    !settings.lowIntensity &&
    !settings.ramadan.enabled
  );
}

/**
 * Pairs accessories that work opposing muscles (push with pull, quads with the
 * back of the leg, core with calves) and puts each pair side by side. Main
 * lifts are never paired, and an accessory with no partner stays a straight set.
 * Pairs are made on the pattern each slot actually holds.
 */
export function pairSupersets(slots: readonly PlannedSlot[]): PlannedSlot[] {
  const partner = new Map<string, string>();
  const accessories = slots.filter((slot) => slot.role === 'accessory');
  accessories.forEach((slot, i) => {
    const side = SIDE[slot.pattern];
    if (!side || partner.has(slot.slotId)) return;
    const match = accessories.slice(i + 1).find((other) => !partner.has(other.slotId) && SIDE[other.pattern] === PARTNER[side]);
    if (!match) return;
    partner.set(slot.slotId, match.slotId);
    partner.set(match.slotId, slot.slotId);
  });

  const byId = new Map(slots.map((slot) => [slot.slotId, slot] as const));
  const placed = new Set<string>();
  const ordered: PlannedSlot[] = [];
  for (const slot of slots) {
    if (placed.has(slot.slotId)) continue;
    const mate = partner.get(slot.slotId);
    placed.add(slot.slotId);
    ordered.push(mate ? { ...slot, supersetWith: mate } : { ...slot });
    if (mate) {
      placed.add(mate);
      ordered.push({ ...byId.get(mate)!, supersetWith: slot.slotId });
    }
  }
  return ordered;
}

/** The slot's partner among `slots`, when it still has one. */
export function supersetPartner(slots: readonly PlannedSlot[], slot: PlannedSlot): PlannedSlot | undefined {
  return slot.supersetWith ? slots.find((other) => other.slotId === slot.supersetWith) : undefined;
}
