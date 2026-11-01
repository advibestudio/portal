import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  defaultThemeForRoute: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  defaultThemeForRoute: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

/**
 * Determines the default theme for a given route.
 * Per product spec:
 * - Default is White ('light') everywhere
 * - EXCEPT on the AI Promotional Mini-Series and Monthly Content Retainer pages,
 *   where the default is Black ('dark').
 */
export function getDefaultThemeForRoute(route: string): ThemeMode {
  const clean = (route || '/').replace(/^#\/?/, '/').toLowerCase();
  if (
    clean.startsWith('/monthly-content') ||
    clean.startsWith('/promotional-mini-series')
  ) {
    return 'dark';
  }
  return 'light';
}

function getRouteGroupKey(route: string): string {
  const clean = (route || '/').replace(/^#\/?/, '/').toLowerCase();
  if (clean.startsWith('/monthly-content')) return 'monthly-content';
  if (clean.startsWith('/promotional-mini-series')) return 'promotional-mini-series';
  if (clean.startsWith('/client-portal') || clean.startsWith('/portal')) return 'client-portal';
  if (clean.startsWith('/affiliate-portal') || clean.startsWith('/affiliates')) return 'affiliate-portal';
  if (clean.startsWith('/client-admin')) return 'client-admin';
  if (clean.startsWith('/admin')) return 'admin';
  if (clean.startsWith('/apps') || clean.startsWith('/download/')) return 'apps';
  if (clean.startsWith('/training')) return 'training';
  return 'main-site';
}

export function ThemeProvider({
  route,
  children,
}: {
  route: string;
  children: React.ReactNode;
}) {
  const routeKey = getRouteGroupKey(route);
  const defaultThemeForRoute = getDefaultThemeForRoute(route);

  // Store manual user toggles per route group in session state so each page starts
  // in its designated default mode (White everywhere except Mini-Series & Retainer = Black)
  // while still allowing instant toggling via the header button.
  const [overrides, setOverrides] = useState<Record<string, ThemeMode>>({});

  const theme: ThemeMode = overrides[routeKey] ?? defaultThemeForRoute;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('theme-dark', theme === 'dark');
    root.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setOverrides((prev) => ({
      ...prev,
      [routeKey]: mode,
    }));
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const value = useMemo(
    () => ({
      theme,
      defaultThemeForRoute,
      setTheme,
      toggleTheme,
    }),
    [theme, defaultThemeForRoute, routeKey],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
