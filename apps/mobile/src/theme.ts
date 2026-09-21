/**
 * Nutrio Design System: Solid Lime Minimalist (Dark & Light Modes)
 * Inspired by Revolut & Ronasit High-Contrast Telemetry
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

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
  limeText: string;          // #0A0B0D (Pitch Black for extreme contrast)
  primaryAccessible: string; // WCAG AA compliant accent for text/borders
  primaryTintText: string;   // High-contrast tint for text tags and pills

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
  water: string;             // Electric Cyan
  banked: string;            // Emerald Green

  // Status & Feedback
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
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
  heroCardBg: '#A4EB3F',
  limeText: '#0A0B0D',
  primaryAccessible: '#A4EB3F',
  primaryTintText: '#A4EB3F',

  floatingBarBg: '#18191E',
  floatingBarActive: '#A4EB3F',
  floatingBarInactive: '#636674',

  textPrimary: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#0A0B0D',

  protein: '#3B82F6',
  carbs: '#A4EB3F',
  fat: '#F59E0B',
  water: '#0EA5E9',
  banked: '#10B981',

  warning: '#F59E0B',
  warningLight: '#332306',
  danger: '#EF4444',
  dangerLight: '#380E0E',
  success: '#10B981',
  successLight: '#082E1E',
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
  limeText: '#0A0B0D',
  primaryAccessible: '#15803D', // High contrast emerald for light mode (WCAG AA > 4.5:1)
  primaryTintText: '#166534',

  floatingBarBg: '#111215',
  floatingBarActive: '#A4EB3F',
  floatingBarInactive: '#8E929B',

  textPrimary: '#0F172A',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  protein: '#3B82F6',
  carbs: '#A4EB3F',
  fat: '#F59E0B',
  water: '#0EA5E9',
  banked: '#10B981',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#DCFCE7',
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
  } as any,
  medium: {
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.08)',
  } as any,
  hero: {
    boxShadow: '0px 8px 20px rgba(164, 235, 63, 0.16)',
  } as any,
};

export const commonTypography = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Plus Jakarta Sans", Roboto, sans-serif',
  fallbacks:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  heroKcal: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Plus Jakarta Sans", Roboto, sans-serif',
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 52,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  displayHero: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Plus Jakarta Sans", Roboto, sans-serif',
    fontSize: 40,
    fontWeight: '800' as const,
    lineHeight: 44,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  sectionTitle: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Plus Jakarta Sans", Roboto, sans-serif',
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  metricValue: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Plus Jakarta Sans", Roboto, sans-serif',
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  cardTitle: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Plus Jakarta Sans", Roboto, sans-serif',
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  bodyMetric: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Plus Jakarta Sans", Roboto, sans-serif',
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  caption: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Plus Jakarta Sans", Roboto, sans-serif',
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  overline: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Plus Jakarta Sans", Roboto, sans-serif',
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 14,
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

export const ThemeProvider: React.FC<{ children: ReactNode; initialMode?: ThemeMode }> = ({
  children,
  initialMode = 'light',
}) => {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const activeTheme = getTheme(mode);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = mode === 'dark';

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme: activeTheme, mode, setMode, toggleTheme, isDark } },
    children
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
