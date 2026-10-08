/**
 * Typeface wiring for both scripts the app ships.
 *
 * Latin text is set in Inter and Arabic in IBM Plex Sans Arabic. Neither is a
 * platform font, so both are bundled and registered at boot: leaving the
 * family unset gave iOS San Francisco and Android Roboto, and the same screen
 * read with a different voice on each device.
 *
 * Each weight is a separate file, and a registered font exposes exactly one
 * face — asking for a heavier `fontWeight` on top of it makes the platform
 * synthesize a fake bold. So the weight in the style picks the file, and the
 * weight itself is dropped once it has.
 */

// Type-only: erased at build time, so the weight helpers below stay usable
// from a plain Node test run.
import type { FontSource } from 'expo-font';

/** Which of the two bundled families a string should be set in. */
export type FontScript = 'latin' | 'arabic';

/** Font names as registered with expo-font; these are the values `fontFamily` takes. */
export const ARABIC_FONT_REGULAR = 'IBMPlexSansArabic-Regular';
export const ARABIC_FONT_MEDIUM = 'IBMPlexSansArabic-Medium';
export const ARABIC_FONT_BOLD = 'IBMPlexSansArabic-Bold';

export const ARABIC_FONT_NAMES = [
  ARABIC_FONT_REGULAR,
  ARABIC_FONT_MEDIUM,
  ARABIC_FONT_BOLD,
] as const;

export const LATIN_FONT_REGULAR = 'Inter-Regular';
export const LATIN_FONT_MEDIUM = 'Inter-Medium';
export const LATIN_FONT_SEMIBOLD = 'Inter-SemiBold';
export const LATIN_FONT_BOLD = 'Inter-Bold';
export const LATIN_FONT_EXTRABOLD = 'Inter-ExtraBold';
export const LATIN_FONT_BLACK = 'Inter-Black';

export const LATIN_FONT_NAMES = [
  LATIN_FONT_REGULAR,
  LATIN_FONT_MEDIUM,
  LATIN_FONT_SEMIBOLD,
  LATIN_FONT_BOLD,
  LATIN_FONT_EXTRABOLD,
  LATIN_FONT_BLACK,
] as const;

/**
 * Asset map for `useFonts`.
 *
 * Resolved on call rather than at import: the `.ttf` requires only mean
 * something to Metro, and the weight rules below have to stay importable from
 * a plain Node test run that has no asset pipeline.
 */
export function arabicFontAssets(): Record<string, FontSource> {
  return {
    [ARABIC_FONT_REGULAR]: require('../../assets/fonts/IBMPlexSansArabic-Regular.ttf'),
    [ARABIC_FONT_MEDIUM]: require('../../assets/fonts/IBMPlexSansArabic-Medium.ttf'),
    [ARABIC_FONT_BOLD]: require('../../assets/fonts/IBMPlexSansArabic-Bold.ttf'),
  };
}

export function latinFontAssets(): Record<string, FontSource> {
  return {
    [LATIN_FONT_REGULAR]: require('../../assets/fonts/Inter-Regular.ttf'),
    [LATIN_FONT_MEDIUM]: require('../../assets/fonts/Inter-Medium.ttf'),
    [LATIN_FONT_SEMIBOLD]: require('../../assets/fonts/Inter-SemiBold.ttf'),
    [LATIN_FONT_BOLD]: require('../../assets/fonts/Inter-Bold.ttf'),
    [LATIN_FONT_EXTRABOLD]: require('../../assets/fonts/Inter-ExtraBold.ttf'),
    [LATIN_FONT_BLACK]: require('../../assets/fonts/Inter-Black.ttf'),
  };
}

/**
 * Every face the app registers.
 *
 * Both families load together rather than on language switch: registering a
 * font is asynchronous, and a mid-session switch would otherwise paint one
 * screen in the system fallback before the files landed.
 */
export function appFontAssets(): Record<string, FontSource> {
  return { ...latinFontAssets(), ...arabicFontAssets() };
}

export type FontWeightValue = string | number | undefined | null;

/**
 * Numeric weight a React Native `fontWeight` asks for, on the CSS scale.
 * Unknown values read as regular rather than throwing: a style is not worth
 * crashing a screen over.
 */
export function numericFontWeight(weight: FontWeightValue): number {
  if (typeof weight === 'number') {
    return weight;
  }
  if (typeof weight !== 'string') {
    return 400;
  }
  if (weight === 'bold') {
    return 700;
  }
  if (weight === 'normal') {
    return 400;
  }
  const parsed = Number.parseInt(weight, 10);
  return Number.isFinite(parsed) ? parsed : 400;
}

/**
 * The IBM Plex Sans Arabic face closest to the requested weight.
 *
 * Only three faces are bundled, so the design system's 500/600 semibolds land
 * on Medium and everything from 700 up lands on Bold. Rounding up at 500 and
 * at 700 keeps emphasis visible: a heading that falls back to Regular stops
 * reading as a heading.
 */
export function arabicFontForWeight(weight: FontWeightValue): string {
  const numeric = numericFontWeight(weight);
  if (numeric >= 700) {
    return ARABIC_FONT_BOLD;
  }
  if (numeric >= 500) {
    return ARABIC_FONT_MEDIUM;
  }
  return ARABIC_FONT_REGULAR;
}

/**
 * The Inter face for the requested weight.
 *
 * Inter ships a file per step, and the screens use all of 400 through 900, so
 * each one is bundled and the mapping is exact — no rounding, and no room for
 * the platform to synthesize a weight it was not given.
 */
export function latinFontForWeight(weight: FontWeightValue): string {
  const numeric = numericFontWeight(weight);
  if (numeric >= 900) {
    return LATIN_FONT_BLACK;
  }
  if (numeric >= 800) {
    return LATIN_FONT_EXTRABOLD;
  }
  if (numeric >= 700) {
    return LATIN_FONT_BOLD;
  }
  if (numeric >= 600) {
    return LATIN_FONT_SEMIBOLD;
  }
  if (numeric >= 500) {
    return LATIN_FONT_MEDIUM;
  }
  return LATIN_FONT_REGULAR;
}

/** The bundled face for a weight in the script currently being rendered. */
export function fontForWeight(script: FontScript, weight: FontWeightValue): string {
  return script === 'arabic' ? arabicFontForWeight(weight) : latinFontForWeight(weight);
}

/**
 * Letter spacing that is safe for Arabic.
 *
 * The Latin scale tightens display sizes with negative tracking. Arabic is a
 * joined script, so negative tracking pulls the connecting strokes into each
 * other and the word stops reading as one shape. Positive tracking is left
 * alone — it only applies to the uppercase Latin overline style.
 */
export function arabicLetterSpacing(letterSpacing: number | undefined): number | undefined {
  if (typeof letterSpacing !== 'number') {
    return undefined;
  }
  return letterSpacing < 0 ? 0 : letterSpacing;
}

/**
 * Letter spacing correction for a script, or `undefined` when the style's own
 * tracking should stand. Latin keeps whatever it asked for — Inter is drawn
 * for tight display tracking — so only Arabic is ever corrected, and only
 * when its tracking is actually negative.
 */
export function letterSpacingOverride(
  script: FontScript,
  letterSpacing: number | undefined
): number | undefined {
  if (script !== 'arabic') {
    return undefined;
  }
  if (typeof letterSpacing !== 'number' || letterSpacing >= 0) {
    return undefined;
  }
  return 0;
}
