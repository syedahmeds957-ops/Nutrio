import type { ComputedUserPlan } from './types.js';

/**
 * Which saved plan to restore at sign-in.
 *
 * The cloud copy normally wins, since it follows the user across devices. The
 * exception is a weekly recalibration accepted on this device that is newer
 * than anything the cloud holds: its sync may have failed offline, and
 * restoring the cloud copy would silently undo the targets the user accepted.
 */
export function pickRestoredPlan(
  cloud: ComputedUserPlan | null | undefined,
  local: ComputedUserPlan | null | undefined
): ComputedUserPlan | null {
  if (!cloud) return local ?? null;
  if (!local) return cloud;
  const localIsNewer =
    !!local.recalibratedAt && (!cloud.recalibratedAt || local.recalibratedAt > cloud.recalibratedAt);
  return localIsNewer ? local : cloud;
}
