/**
 * The first word of a display name, for greetings: "Talha Bhatti" greets as
 * "Talha". Returns undefined for an empty name so callers can fall back.
 */
export function firstName(displayName: string | undefined | null): string | undefined {
  const first = displayName?.trim().split(/\s+/)[0];
  return first || undefined;
}
