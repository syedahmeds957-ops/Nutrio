import type { TFunction } from 'i18next';
import type { WorkoutSession } from '@nutrio/workout-core';

/**
 * "Upper body A", "Lower body B", "Full body C". Full-body templates already
 * carry a letter, so when one runs twice in a week (no-equipment plans of four
 * or more days) the second gets a number instead: "Full body A 2".
 */
export function sessionTitle(t: TFunction, session: Pick<WorkoutSession, 'template' | 'variant'>): string {
  const name = t(`workout.template.${session.template}`);
  if (!session.variant) return name;
  if (session.template.startsWith('full_')) return session.variant === 'b' ? `${name} 2` : name;
  return `${name} ${session.variant.toUpperCase()}`;
}
