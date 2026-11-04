/**
 * The numbers behind the "how your target adds up" bar on the plan reveal.
 *
 * Pure layout maths over figures the engine already computed (BMR, TDEE and the
 * target). It never works out a target of its own: it only splits the existing
 * numbers into proportional pieces so the bar and the text agree.
 */

export type BurnPieceKind = 'rest' | 'activity' | 'surplus' | 'marker';

export interface BurnPiece {
  kind: BurnPieceKind;
  /** Kcal the piece stands for; 0 for the marker. */
  kcal: number;
  /** Share of the whole bar, 0..1. The non-marker pieces add up to 1. */
  fraction: number;
}

export interface BurnBreakdown {
  /** Calories burned at rest (BMR), never above the daily burn. */
  rest: number;
  /** Calories burned through activity: TDEE minus BMR. */
  activity: number;
  /** Daily burn (TDEE). */
  burn: number;
  /** The daily target, as the plan states it. */
  target: number;
  /** Calories planned below the daily burn, never negative and never above it. */
  deficit: number;
  /** Calories planned above the daily burn, never negative. */
  surplus: number;
  /** Rest, activity and any surplus, split where the target falls, plus a marker piece. */
  pieces: BurnPiece[];
}

export interface BurnInput {
  bmr: number;
  tdee: number;
  kcalTarget: number;
}

const clean = (value: number): number => (Number.isFinite(value) && value > 0 ? Math.round(value) : 0);

export function burnBreakdown({ bmr, tdee, kcalTarget }: BurnInput): BurnBreakdown {
  const burn = clean(tdee);
  const target = clean(kcalTarget);
  const rest = Math.min(clean(bmr), burn);
  const activity = burn - rest;
  // A target at the safety floor sits at or just under the burn minus the cap;
  // clamping keeps the deficit inside the burn even for an odd saved plan.
  const deficit = Math.min(Math.max(0, burn - target), burn);
  const surplus = Math.max(0, target - burn);
  const total = rest + activity + surplus;

  const segments: { kind: Exclude<BurnPieceKind, 'marker'>; kcal: number }[] = [
    { kind: 'rest', kcal: rest },
    { kind: 'activity', kcal: activity },
    { kind: 'surplus', kcal: surplus },
  ];

  const pieces: BurnPiece[] = [];
  if (total <= 0) return { rest, activity, burn, target, deficit, surplus, pieces };

  // Walk the segments, dropping the marker in where the target falls.
  const markerAt = Math.min(target, total);
  let start = 0;
  let markerPlaced = false;
  const push = (kind: BurnPieceKind, kcal: number) => {
    if (kcal > 0 || kind === 'marker') pieces.push({ kind, kcal: kind === 'marker' ? 0 : kcal, fraction: kind === 'marker' ? 0 : kcal / total });
  };
  for (const seg of segments) {
    if (seg.kcal <= 0) continue;
    const end = start + seg.kcal;
    if (!markerPlaced && markerAt > start && markerAt < end) {
      push(seg.kind, markerAt - start);
      push('marker', 0);
      push(seg.kind, end - markerAt);
      markerPlaced = true;
    } else {
      push(seg.kind, seg.kcal);
      if (!markerPlaced && markerAt === end) {
        push('marker', 0);
        markerPlaced = true;
      }
    }
    start = end;
  }
  if (!markerPlaced) {
    // Target of zero: the marker sits at the start of the bar.
    pieces.unshift({ kind: 'marker', kcal: 0, fraction: 0 });
  }

  return { rest, activity, burn, target, deficit, surplus, pieces };
}
