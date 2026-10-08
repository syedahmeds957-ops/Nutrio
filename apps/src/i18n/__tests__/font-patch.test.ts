import { afterEach, describe, expect, it } from 'vitest';

import {
  ARABIC_FONT_BOLD,
  ARABIC_FONT_REGULAR,
  LATIN_FONT_BLACK,
  LATIN_FONT_EXTRABOLD,
  LATIN_FONT_REGULAR,
  LATIN_FONT_SEMIBOLD,
} from '../fonts.js';
import {
  getActiveFontScript,
  getActiveTextDirection,
  resetFontPatchState,
  setActiveTextDirection,
  textOverridesForScript,
} from '../fontPatch.js';

describe('textOverridesForScript — arabic', () => {
  it('picks the face the style weight asks for', () => {
    expect(textOverridesForScript('arabic', { fontWeight: '800' }).fontFamily).toBe(
      ARABIC_FONT_BOLD
    );
    expect(textOverridesForScript('arabic', { fontSize: 14 }).fontFamily).toBe(
      ARABIC_FONT_REGULAR
    );
  });

  it('clears the weight so the platform does not embolden a bold face', () => {
    expect(textOverridesForScript('arabic', { fontWeight: '700' }).fontWeight).toBeUndefined();
  });

  it('reads through the style arrays screens actually pass', () => {
    const overrides = textOverridesForScript('arabic', [
      { fontSize: 20, fontWeight: '600' },
      { color: '#000', fontWeight: '900' },
    ]);
    expect(overrides.fontFamily).toBe(ARABIC_FONT_BOLD);
  });

  it('neutralises the negative tracking of the display styles', () => {
    expect(
      textOverridesForScript('arabic', { fontSize: 48, letterSpacing: -1.2 }).letterSpacing
    ).toBe(0);
  });

  it('leaves a deliberately chosen family alone', () => {
    expect(textOverridesForScript('arabic', { fontFamily: 'Ionicons', fontWeight: '700' })).toEqual(
      {}
    );
  });
});

describe('textOverridesForScript — latin', () => {
  it('maps each weight in the design system to its own Inter file', () => {
    expect(textOverridesForScript('latin', { fontSize: 14 }).fontFamily).toBe(LATIN_FONT_REGULAR);
    expect(textOverridesForScript('latin', { fontWeight: '600' }).fontFamily).toBe(
      LATIN_FONT_SEMIBOLD
    );
    expect(textOverridesForScript('latin', { fontWeight: '800' }).fontFamily).toBe(
      LATIN_FONT_EXTRABOLD
    );
    expect(textOverridesForScript('latin', { fontWeight: '900' }).fontFamily).toBe(
      LATIN_FONT_BLACK
    );
  });

  it('clears the weight so the platform does not embolden a bold face', () => {
    expect(textOverridesForScript('latin', { fontWeight: '800' }).fontWeight).toBeUndefined();
  });

  it('keeps the display tracking Inter is drawn for', () => {
    const overrides = textOverridesForScript('latin', { fontSize: 48, letterSpacing: -1.2 });
    expect('letterSpacing' in overrides).toBe(false);
  });

  it('leaves a deliberately chosen family alone', () => {
    expect(textOverridesForScript('latin', { fontFamily: 'Ionicons', fontWeight: '700' })).toEqual(
      {}
    );
  });
});

describe('active text direction', () => {
  afterEach(() => {
    resetFontPatchState();
  });

  it('starts unset so text keeps the platform default', () => {
    expect(getActiveTextDirection()).toBeNull();
  });

  it('holds the direction the app sets', () => {
    setActiveTextDirection('rtl');
    expect(getActiveTextDirection()).toBe('rtl');
    setActiveTextDirection('ltr');
    expect(getActiveTextDirection()).toBe('ltr');
  });

  // The typeface waits on font files; the direction must not, or Arabic copy
  // sits against the wrong edge for the whole first paint.
  it('is independent of the active font script', () => {
    setActiveTextDirection('rtl');
    expect(getActiveFontScript()).toBeNull();
    expect(getActiveTextDirection()).toBe('rtl');
  });

  it('is cleared by the test reset seam', () => {
    setActiveTextDirection('rtl');
    resetFontPatchState();
    expect(getActiveTextDirection()).toBeNull();
  });
});
