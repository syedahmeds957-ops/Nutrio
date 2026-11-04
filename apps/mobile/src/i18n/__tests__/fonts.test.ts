import { describe, expect, it } from 'vitest';

import {
  ARABIC_FONT_BOLD,
  ARABIC_FONT_MEDIUM,
  ARABIC_FONT_REGULAR,
  LATIN_FONT_BLACK,
  LATIN_FONT_BOLD,
  LATIN_FONT_EXTRABOLD,
  LATIN_FONT_MEDIUM,
  LATIN_FONT_REGULAR,
  LATIN_FONT_SEMIBOLD,
  arabicFontForWeight,
  arabicLetterSpacing,
  fontForWeight,
  latinFontForWeight,
  letterSpacingOverride,
  numericFontWeight,
} from '../fonts.js';

describe('numericFontWeight', () => {
  it('reads the CSS keywords React Native accepts', () => {
    expect(numericFontWeight('bold')).toBe(700);
    expect(numericFontWeight('normal')).toBe(400);
  });

  it('reads numeric strings and numbers alike', () => {
    expect(numericFontWeight('600')).toBe(600);
    expect(numericFontWeight(800)).toBe(800);
  });

  it('falls back to regular for an unset or unusable weight', () => {
    expect(numericFontWeight(undefined)).toBe(400);
    expect(numericFontWeight(null)).toBe(400);
    expect(numericFontWeight('heavy')).toBe(400);
  });
});

describe('arabicFontForWeight', () => {
  it('uses Regular for body weights', () => {
    expect(arabicFontForWeight(undefined)).toBe(ARABIC_FONT_REGULAR);
    expect(arabicFontForWeight('400')).toBe(ARABIC_FONT_REGULAR);
    expect(arabicFontForWeight('normal')).toBe(ARABIC_FONT_REGULAR);
  });

  it('uses Medium for the semibold range the design system leans on', () => {
    expect(arabicFontForWeight('500')).toBe(ARABIC_FONT_MEDIUM);
    expect(arabicFontForWeight('600')).toBe(ARABIC_FONT_MEDIUM);
  });

  it('uses Bold from 700 up, so headings stay emphasised', () => {
    expect(arabicFontForWeight('700')).toBe(ARABIC_FONT_BOLD);
    expect(arabicFontForWeight('bold')).toBe(ARABIC_FONT_BOLD);
    expect(arabicFontForWeight('800')).toBe(ARABIC_FONT_BOLD);
    expect(arabicFontForWeight('900')).toBe(ARABIC_FONT_BOLD);
  });
});

describe('arabicLetterSpacing', () => {
  it('drops the negative tracking that breaks joined Arabic strokes', () => {
    expect(arabicLetterSpacing(-1.2)).toBe(0);
    expect(arabicLetterSpacing(-0.1)).toBe(0);
  });

  it('keeps positive and zero tracking as authored', () => {
    expect(arabicLetterSpacing(0.8)).toBe(0.8);
    expect(arabicLetterSpacing(0)).toBe(0);
  });

  it('leaves an unset value unset', () => {
    expect(arabicLetterSpacing(undefined)).toBeUndefined();
  });
});

describe('latinFontForWeight', () => {
  it('gives every weight in the design system its own file', () => {
    expect(latinFontForWeight('400')).toBe(LATIN_FONT_REGULAR);
    expect(latinFontForWeight('500')).toBe(LATIN_FONT_MEDIUM);
    expect(latinFontForWeight('600')).toBe(LATIN_FONT_SEMIBOLD);
    expect(latinFontForWeight('700')).toBe(LATIN_FONT_BOLD);
    expect(latinFontForWeight('800')).toBe(LATIN_FONT_EXTRABOLD);
    expect(latinFontForWeight('900')).toBe(LATIN_FONT_BLACK);
  });

  it('reads the keywords and an unset weight as regular text', () => {
    expect(latinFontForWeight('normal')).toBe(LATIN_FONT_REGULAR);
    expect(latinFontForWeight(undefined)).toBe(LATIN_FONT_REGULAR);
    expect(latinFontForWeight('bold')).toBe(LATIN_FONT_BOLD);
  });

  it('rounds an in-between weight down to the face below it', () => {
    expect(latinFontForWeight(650)).toBe(LATIN_FONT_SEMIBOLD);
    expect(latinFontForWeight(1000)).toBe(LATIN_FONT_BLACK);
  });
});

describe('fontForWeight', () => {
  it('routes to the family the active script uses', () => {
    expect(fontForWeight('latin', '700')).toBe(LATIN_FONT_BOLD);
    expect(fontForWeight('arabic', '700')).toBe(ARABIC_FONT_BOLD);
  });
});

describe('letterSpacingOverride', () => {
  it('flattens negative Arabic tracking, which breaks joined glyphs', () => {
    expect(letterSpacingOverride('arabic', -1.2)).toBe(0);
  });

  it('leaves everything else to the style itself', () => {
    expect(letterSpacingOverride('arabic', 2)).toBeUndefined();
    expect(letterSpacingOverride('arabic', undefined)).toBeUndefined();
    expect(letterSpacingOverride('latin', -1.2)).toBeUndefined();
  });
});
