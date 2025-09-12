import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Utility function to combine classes with theme transitions
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Add theme transition classes to an element
 */
export function withThemeTransition(...classes: ClassValue[]) {
  return cn('theme-transition', ...classes);
}

/**
 * Get the system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Theme configuration constants
 */
export const THEME_CONFIG = {
  STORAGE_KEY: 'todo-app-theme',
  TRANSITION_DURATION: 200, // milliseconds
  MODES: ['light', 'dark', 'system'] as const,
} as const;

/**
 * Theme-aware class variants for common UI patterns
 */
export const themeVariants = {
  card: {
    base: withThemeTransition(
      'bg-card text-card-foreground border border-border rounded-lg shadow-sm'
    ),
    hover: withThemeTransition(
      'hover:bg-accent hover:text-accent-foreground'
    ),
  },
  button: {
    primary: withThemeTransition(
      'bg-primary text-primary-foreground hover:bg-primary/90'
    ),
    secondary: withThemeTransition(
      'bg-secondary text-secondary-foreground hover:bg-secondary/80'
    ),
    ghost: withThemeTransition(
      'hover:bg-accent hover:text-accent-foreground'
    ),
  },
  input: withThemeTransition(
    'bg-background border-input text-foreground placeholder:text-muted-foreground'
  ),
} as const;