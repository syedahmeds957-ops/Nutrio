/**
 * Nutrio Design System: Solid Lime Minimalist (Dark & Light Modes)
 * Inspired by Revolut & Ronasit High-Contrast Telemetry
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  isDark: boolean;
  canvas: string;
  surface: string;
  surfaceSecondary: string;
  card: string;              // Convenient alias for surface
  border: string;
  borderSubtle: string;
  cardBorder: string;

  // Solid Lime Accent (Hero & Action Highlights)
  primary: string;           // Solid Lime #A4EB3F
  primaryDark: string;       // #8ECC33
  primaryLight: string;      // #F2FF9E
  primaryBorder: string;     // #A4EB3F
  primaryLime: string;       // #A4EB3F
  heroCardBg: string;        // #A4EB3F (Solid Lime - NO gradient)
  heroCardDrained: string;   // The hero card behind the fill once calories are eaten; limeText stays 4.5:1 on it
  limeText: string;          // #0A0B0D (Pitch Black for extreme contrast)
  primaryAccessible: string; // WCAG AA compliant accent for text/borders
  primaryTintText: string;   // High-contrast tint for text tags and pills
  limeTint: string;          // Pale lime fill behind lime-tinted chips and callouts
  limeTintBorder: string;    // Hairline that goes with limeTint

  // Floating Capsule Bar
  floatingBarBg: string;
  floatingBarActive: string;
  floatingBarInactive: string;

  // Typography
  textPrimary: string;
  text: string;              // Convenient alias for textPrimary
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Macro & Telemetry Accents
  protein: string;           // Royal Blue
  carbs: string;             // Solid Lime / Chartreuse
  fat: string;               // Warm Amber
  // The same hues darkened until they read as text (>= 4.5:1) on every surface;
  // the bright ones above are for fills, rings and borders.
  proteinText: string;
  carbsText: string;
  fatText: string;
  water: string;             // Electric Cyan
  waterText: string;         // Water blue darkened until it reads as text (>= 4.5:1) on every surface
  // Empty part of a progress bar: >= 3:1 on every surface so the bar is visible at 0%.
  progressTrack: string;
  banked: string;            // Emerald Green

  // Status & Feedback
  warning: string;
  warningLight: string;
  warningBorder: string;     // Hairline that goes with warningLight
  warningText: string;       // Amber that reads as text on warningLight and on every surface
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  successBorder: string;     // Hairline that goes with successLight
  successText: string;       // the success green darkened until it reads as text on light surfaces
}

export const darkColors: ThemeColors = {
  isDark: true,
  canvas: '#0C0D10',          // Deep obsidian dark canvas
  surface: '#18191E',         // Dark charcoal card surface
  surfaceSecondary: '#21232B',
  card: '#18191E',
  border: '#272A33',          // Hairline micro-border
  borderSubtle: '#1C1E25',
  cardBorder: '#272A33',

  primary: '#A4EB3F',
  primaryDark: '#8ECC33',
  primaryLight: '#263B0E',
  primaryBorder: '#A4EB3F',
  primaryLime: '#A4EB3F',
  heroCardBg: '#7FB82F',      // dimmed from full lime: the big hero block glared on the dark canvas
  heroCardDrained: '#5C8F22',
  limeText: '#0A0B0D',
  primaryAccessible: '#A4EB3F',
  primaryTintText: '#A4EB3F',
  limeTint: '#1C2608',
  limeTintBorder: '#2D4B05',

  floatingBarBg: '#2A2D37',           // lighter than the cards (#18191E) so the bar lifts off them
  floatingBarActive: '#A4EB3F',
  floatingBarInactive: '#B4BAC6',     // 7:1 on the bar; 11 px labels need 4.5:1

  textPrimary: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#8B93A1',       // >= 4.5:1 on dark surfaces; #6B7280 was 3.2-3.6:1
  textInverse: '#0A0B0D',

  protein: '#3B82F6',
  carbs: '#A4EB3F',
  fat: '#F59E0B',
  proteinText: '#60A5FA',
  carbsText: '#A4EB3F',
  fatText: '#F59E0B',
  water: '#0EA5E9',
  waterText: '#38BDF8',
  progressTrack: '#6B7587',
  banked: '#10B981',

  warning: '#F59E0B',
  warningLight: '#332306',
  warningBorder: '#6B4C0A',
  warningText: '#FBBF24',
  danger: '#F87171',          // #EF4444 was 4.2:1 on the raised surface
  dangerLight: '#380E0E',
  success: '#10B981',
  successLight: '#082E1E',
  successBorder: '#0F5132',
  successText: '#10B981',
};

export const lightColors: ThemeColors = {
  isDark: false,
  canvas: '#F6F7FB',          // Crisp pale porcelain alabaster
  surface: '#FFFFFF',         // Pure white card surface
  surfaceSecondary: '#F1F3F7',
  card: '#FFFFFF',
  border: '#E8EAEE',          // Hairline micro-border
  borderSubtle: '#F0F2F5',
  cardBorder: '#E8EAEE',

  primary: '#A4EB3F',
  primaryDark: '#8ECC33',
  primaryLight: '#EDFCD2',
  primaryBorder: '#A4EB3F',
  primaryLime: '#A4EB3F',
  heroCardBg: '#A4EB3F',
  heroCardDrained: '#6E9E28',
  limeText: '#0A0B0D',
  primaryAccessible: '#4B6200', // Dark lime for text on light surfaces (7:1 on white); raw lime is 1.4:1
  primaryTintText: '#365314',
  limeTint: '#EDFCD2',
  limeTintBorder: '#D4F88D',

  floatingBarBg: '#111215',
  floatingBarActive: '#A4EB3F',
  floatingBarInactive: '#8E929B',

  textPrimary: '#0F172A',
  text: '#0F172A',
  textSecondary: '#556274',
  textMuted: '#626D7B',       // >= 4.5:1 on every light surface; #94A3B8 was 2.3-2.6:1
  textInverse: '#FFFFFF',

  protein: '#3B82F6',
  carbs: '#A4EB3F',
  fat: '#F59E0B',
  proteinText: '#1D4ED8',
  carbsText: '#4B6200',
  fatText: '#9A4A06',
  water: '#0EA5E9',
  waterText: '#0369A1',
  progressTrack: '#7F8899',
  banked: '#10B981',

  warning: '#B45309',         // #F59E0B / #D97706 were 2.1-3.2:1 as text; 4.5:1 on every light surface
  warningLight: '#FEF3C7',
  warningBorder: '#FDE68A',
  warningText: '#B45309',
  danger: '#B91C1C',          // #EF4444 was 3.5:1 on the canvas
  dangerLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#DCFCE7',
  successBorder: '#A7F3D0',
  successText: '#166534',
};

export const commonRadii = {
  sm: 8,
  md: 14,
  lg: 18,
  card: 22,                  // 22px rounded cards like Revolut/Ronasit
  cardHero: 26,              // 26px rounded hero card
  pill: 9999,
};

export const commonShadows = {
  soft: {
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
  },
  medium: {
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.08)',
  },
  hero: {
    boxShadow: '0px 8px 20px rgba(164, 235, 63, 0.16)',
  },
};

/**
 * CSS font stack for the web build. Native cannot take a stack: iOS and
 * Android resolve `fontFamily` to a single registered face and log an
 * unrecognized-family warning for anything else, so native leaves the family
 * unset here and picks the per-weight Inter or IBM Plex Sans Arabic file at
 * render time — see `src/i18n/fontPatch.tsx`. The patch does not run on web,
 * where a stack is the whole mechanism: the browser takes Inter if it can
 * resolve one and the system font otherwise, and synthesizes the weights.
 */
const WEB_FONT_STACK =
  '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", Roboto, sans-serif';

export const platformFontFamily: string | undefined = Platform.select({
  web: WEB_FONT_STACK,
  default: undefined,
});

export const commonTypography = {
  fontFamily: platformFontFamily,
  fallbacks:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  heroKcal: {
    fontFamily: platformFontFamily,
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 52,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  displayHero: {
    fontFamily: platformFontFamily,
    fontSize: 40,
    fontWeight: '800' as const,
    lineHeight: 44,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  sectionTitle: {
    fontFamily: platformFontFamily,
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  metricValue: {
    fontFamily: platformFontFamily,
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  cardTitle: {
    fontFamily: platformFontFamily,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  bodyMetric: {
    fontFamily: platformFontFamily,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  caption: {
    fontFamily: platformFontFamily,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  overline: {
    fontFamily: platformFontFamily,
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
};

export interface NutrioTheme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  radii: typeof commonRadii;
  shadows: typeof commonShadows;
  typography: typeof commonTypography;
}

export function getTheme(mode: ThemeMode = 'light'): NutrioTheme {
  return {
    mode,
    isDark: mode === 'dark',
    colors: mode === 'dark' ? darkColors : lightColors,
    radii: commonRadii,
    shadows: commonShadows,
    typography: commonTypography,
  };
}

// Default export: Light mode default (can be toggled dynamically)
export const theme = getTheme('light');

// Theme Context & Hook for Dynamic Switching
export interface ThemeContextValue {
  theme: NutrioTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: getTheme('light'),
  mode: 'light',
  setMode: () => {},
  toggleTheme: () => {},
  isDark: false,
});

const THEME_STORAGE_KEY = 'nutrio_theme_mode';

/** A saved choice wins; with none, the device's light/dark setting decides. */
export function resolveThemeMode(saved: string | null | undefined, system: string | null | undefined): ThemeMode {
  if (saved === 'dark' || saved === 'light') return saved;
  return system === 'dark' ? 'dark' : 'light';
}

function readSystemScheme(): string | null {
  try {
    return Appearance.getColorScheme() ?? null;
  } catch {
    return null;
  }
}

/**
 * `initialMode` pins the theme (tests, previews). Without it the theme follows
 * the device until the user picks one, and that pick is remembered.
 */
export const ThemeProvider: React.FC<{ children: ReactNode; initialMode?: ThemeMode }> = ({
  children,
  initialMode,
}) => {
  const [mode, setModeState] = useState<ThemeMode>(initialMode ?? resolveThemeMode(null, readSystemScheme()));
  const activeTheme = getTheme(mode);

  useEffect(() => {
    if (initialMode) return;
    let cancelled = false;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (!cancelled && (saved === 'dark' || saved === 'light')) setModeState(saved);
      })
      .catch(() => {
        // No stored choice is readable: keep following the device.
      });
    return () => {
      cancelled = true;
    };
  }, [initialMode]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {
      // A failed write only costs remembering the choice.
    });
  };

  const toggleTheme = () => setMode(mode === 'dark' ? 'light' : 'dark');

  const isDark = mode === 'dark';

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme: activeTheme, mode, setMode, toggleTheme, isDark } },
    children
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
