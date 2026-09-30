import React, { forwardRef, useSyncExternalStore } from 'react';
import { Platform, StyleSheet, type TextStyle } from 'react-native';

import { fontForWeight, letterSpacingOverride, type FontScript } from './fonts.js';
import type { Direction } from './rtl.js';

/**
 * Applies the app's typeface and reading direction to every `Text` and
 * `TextInput`.
 *
 * Around 400 styles across the screens set a `fontWeight` and leave the family
 * to the platform, and React 19 dropped `defaultProps` for function
 * components, so there is no per-call-site or default-props seam left. What
 * there is: `react-native`'s entry point exposes its components as
 * configurable getters, and Babel's CommonJS interop reads those getters at
 * render time rather than at import time. Redefining them here therefore
 * reaches every screen, including ones that imported `Text` long before this
 * ran.
 */

let activeScript: FontScript | null = null;
let activeDirection: Direction | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): FontScript | null {
  return activeScript;
}

function getDirectionSnapshot(): Direction | null {
  return activeDirection;
}

/**
 * Sets the typeface for the whole tree, or `null` to leave text in the
 * platform font.
 *
 * Only ever given a script once the font files have finished registering:
 * naming a font iOS has not loaded renders nothing at all, so the app shows
 * the system face for the moment before the fonts land rather than blank
 * text.
 */
export function setActiveFontScript(script: FontScript | null): void {
  if (activeScript === script) {
    return;
  }
  activeScript = script;
  emit();
}

export function getActiveFontScript(): FontScript | null {
  return activeScript;
}

/**
 * Sets the reading direction for the whole tree.
 *
 * Every screen needs this and almost none of them state it: left unset, iOS
 * resolves a paragraph's natural alignment from the app's preferred
 * localisation, which is English, so Arabic copy lands against the left edge.
 * Stating the writing direction moves it to the reading edge without naming
 * `textAlign`, which React Native swaps left-for-right in a mirrored build.
 *
 * Unlike the typeface this applies immediately: it depends on no asset.
 */
export function setActiveTextDirection(direction: Direction | null): void {
  if (activeDirection === direction) {
    return;
  }
  activeDirection = direction;
  emit();
}

export function getActiveTextDirection(): Direction | null {
  return activeDirection;
}

/** Test seam: drops the script and its subscribers back to a clean state. */
export function resetFontPatchState(): void {
  activeScript = null;
  activeDirection = null;
  listeners.clear();
}

function useActiveFontScript(): FontScript | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function useActiveTextDirection(): Direction | null {
  return useSyncExternalStore(subscribe, getDirectionSnapshot, getDirectionSnapshot);
}

// Stable references so injecting the direction never breaks style memoisation
// further down.
const DIRECTION_STYLES: Record<Direction, TextStyle> = {
  ltr: { writingDirection: 'ltr' },
  rtl: { writingDirection: 'rtl' },
};

// Styles are overwhelmingly the same objects render after render (StyleSheet
// entries, or arrays rebuilt from them), so the resolved result is memoised
// per style reference and the flatten happens once rather than every frame.
// Keyed by script too, since the same style resolves to a different face once
// the language changes.
const styleCaches: Record<FontScript, WeakMap<object, TextStyle>> = {
  latin: new WeakMap(),
  arabic: new WeakMap(),
};

/**
 * The style overrides that put a string in the face its weight asks for.
 * Exported for tests; `style` is whatever a caller passed, flattened form or
 * array.
 */
export function textOverridesForScript(script: FontScript, style: unknown): TextStyle {
  const flat = (StyleSheet.flatten(style as never) ?? {}) as TextStyle;

  // An explicit family is a deliberate choice (an icon set, a logo wordmark),
  // so it is left exactly as written.
  if (flat.fontFamily) {
    return {};
  }

  const overrides: TextStyle = {
    fontFamily: fontForWeight(script, flat.fontWeight),
    // The chosen file already carries the weight. Leaving the numeric weight
    // in place would ask the platform to embolden an already-bold face.
    fontWeight: undefined,
  };

  // Written only when the script actually needs a different value: an
  // `undefined` here would flatten over the tracking the style asked for.
  const letterSpacing = letterSpacingOverride(script, flat.letterSpacing);
  if (letterSpacing !== undefined) {
    overrides.letterSpacing = letterSpacing;
  }

  return overrides;
}

function cachedOverrides(script: FontScript, style: unknown): TextStyle {
  if (style === null || style === undefined || typeof style !== 'object') {
    return textOverridesForScript(script, style);
  }
  const cache = styleCaches[script];
  const cached = cache.get(style as object);
  if (cached) {
    return cached;
  }
  const resolved = textOverridesForScript(script, style);
  cache.set(style as object, resolved);
  return resolved;
}

function withAppFont<P extends { style?: unknown }>(
  Original: React.ComponentType<P>,
  name: string
): React.ComponentType<P> {
  const Wrapped = forwardRef<unknown, P>((props, ref) => {
    const script = useActiveFontScript();
    const direction = useActiveTextDirection();
    if (!script && !direction) {
      return <Original ref={ref as never} {...(props as P)} />;
    }
    // The direction goes underneath so a style that states its own
    // `writingDirection` still wins; the face goes on top because the weight
    // it resolves has to replace whatever the style asked for.
    const overrides = script ? cachedOverrides(script, props.style) : undefined;
    return (
      <Original
        ref={ref as never}
        {...(props as P)}
        style={[
          direction ? (DIRECTION_STYLES[direction] as never) : (undefined as never),
          props.style as never,
          overrides as never,
        ]}
      />
    );
  });
  Wrapped.displayName = name;

  // Carries across statics such as TextInput.State, which callers reach
  // through the same import this replaces.
  Object.keys(Original).forEach((key) => {
    if (key === 'displayName' || key === 'propTypes') {
      return;
    }
    try {
      (Wrapped as unknown as Record<string, unknown>)[key] = (
        Original as unknown as Record<string, unknown>
      )[key];
    } catch {
      // Read-only static; nothing to carry over.
    }
  });

  return Wrapped as unknown as React.ComponentType<P>;
}

let installed = false;

/**
 * Replaces `Text` and `TextInput` on the react-native module object.
 *
 * Skipped on web: react-native-web's exports are real ES module bindings,
 * which cannot be redefined, and the browser resolves a face from the CSS
 * font stack on its own.
 */
export function installFontPatch(): boolean {
  if (installed || Platform.OS === 'web') {
    return false;
  }

  let ReactNative: Record<string, unknown>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ReactNative = require('react-native');
  } catch {
    return false;
  }

  const patchedAny = (['Text', 'TextInput'] as const).map((name) => {
    try {
      const Original = ReactNative[name] as React.ComponentType<{ style?: unknown }>;
      if (typeof Original !== 'function' && typeof Original !== 'object') {
        return false;
      }
      const Patched = withAppFont(Original, name);
      Object.defineProperty(ReactNative, name, {
        configurable: true,
        enumerable: true,
        get: () => Patched,
      });
      return true;
    } catch {
      // A non-configurable export means this build cannot be patched; the app
      // keeps the platform face rather than failing to start.
      return false;
    }
  });

  installed = patchedAny.some(Boolean);
  return installed;
}
