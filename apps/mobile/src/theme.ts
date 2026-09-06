/**
 * Nutrio Design System: Solid Lime Minimalist (Dark & Light Modes)
 * Inspired by Revolut & Ronasit High-Contrast Telemetry
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  primary: string;           // Solid Lime #D4FF00
  primaryDark: string;       // #B4DE00
  primaryLight: string;      // #F2FF9E
  primaryBorder: string;     // #D4FF00
  primaryLime: string;       // #D4FF00
  heroCardBg: string;        // #D4FF00 (Solid Lime - NO gradient)
  limeText: string;          // #0A0B0D (Pitch Black for extreme contrast)

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

  primary: '#D4FF00',
  primaryDark: '#B4DE00',
  primaryLight: '#2A3008',
  primaryBorder: '#D4FF00',
  primaryLime: '#D4FF00',
  heroCardBg: '#D4FF00',
  limeText: '#0A0B0D',

  floatingBarBg: '#18191E',
  floatingBarActive: '#D4FF00',
  floatingBarInactive: '#636674',

  textPrimary: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#0A0B0D',

  protein: '#3B82F6',
  carbs: '#D4FF00',
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

  primary: '#D4FF00',
  primaryDark: '#A8CC00',
  primaryLight: '#F7FFB8',
  primaryBorder: '#D4FF00',
  primaryLime: '#D4FF00',
  heroCardBg: '#D4FF00',
  limeText: '#0A0B0D',

  floatingBarBg: '#111215',
  floatingBarActive: '#D4FF00',
  floatingBarInactive: '#8E929B',

  textPrimary: '#0F172A',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  protein: '#3B82F6',
  carbs: '#D4FF00',
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  hero: {
    shadowColor: '#D4FF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
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
  },
  displayHero: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Plus Jakarta Sans", Roboto, sans-serif',
    fontSize: 40,
    fontWeight: '800' as const,
    lineHeight: 44,
    letterSpacing: -0.8,
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

export function getTheme(mode: ThemeMode = 'dark'): NutrioTheme {
  return {
    mode,
    isDark: mode === 'dark',
    colors: mode === 'dark' ? darkColors : lightColors,
    radii: commonRadii,
    shadows: commonShadows,
    typography: commonTypography,
  };
}

// Default export: Dark mode default (can be toggled dynamically)
export const theme = getTheme('dark');

// Theme Context & Hook for Dynamic Switching
export interface ThemeContextValue {
  theme: NutrioTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: getTheme('dark'),
  mode: 'dark',
  setMode: () => {},
  toggleTheme: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: ReactNode; initialMode?: ThemeMode }> = ({
  children,
  initialMode = 'dark',
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
