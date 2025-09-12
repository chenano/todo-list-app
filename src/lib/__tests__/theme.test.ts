import {
  cn,
  withThemeTransition,
  getSystemTheme,
  prefersReducedMotion,
  prefersHighContrast,
  THEME_CONFIG,
  themeVariants,
} from '../theme';

// Mock matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('theme utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cn function', () => {
    it('should combine classes correctly', () => {
      const result = cn('class1', 'class2', { 'class3': true, 'class4': false });
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
      expect(result).not.toContain('class4');
    });

    it('should handle conflicting Tailwind classes', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });
  });

  describe('withThemeTransition', () => {
    it('should add theme-transition class', () => {
      const result = withThemeTransition('bg-white', 'text-black');
      expect(result).toContain('theme-transition');
      expect(result).toContain('bg-white');
      expect(result).toContain('text-black');
    });
  });

  describe('getSystemTheme', () => {
    it('should return light when matchMedia indicates light theme', () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      expect(getSystemTheme()).toBe('light');
    });

    it('should return dark when matchMedia indicates dark theme', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      expect(getSystemTheme()).toBe('dark');
    });

    it('should return light on server side', () => {
      // Temporarily remove window
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(getSystemTheme()).toBe('light');

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return true when user prefers reduced motion', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      expect(prefersReducedMotion()).toBe(true);
    });

    it('should return false when user does not prefer reduced motion', () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      expect(prefersReducedMotion()).toBe(false);
    });

    it('should return false on server side', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(prefersReducedMotion()).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('prefersHighContrast', () => {
    it('should return true when user prefers high contrast', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      expect(prefersHighContrast()).toBe(true);
    });

    it('should return false when user does not prefer high contrast', () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      expect(prefersHighContrast()).toBe(false);
    });

    it('should return false on server side', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(prefersHighContrast()).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('THEME_CONFIG', () => {
    it('should have correct configuration values', () => {
      expect(THEME_CONFIG.STORAGE_KEY).toBe('todo-app-theme');
      expect(THEME_CONFIG.TRANSITION_DURATION).toBe(200);
      expect(THEME_CONFIG.MODES).toEqual(['light', 'dark', 'system']);
    });
  });

  describe('themeVariants', () => {
    it('should have theme-transition class in all variants', () => {
      expect(themeVariants.card.base).toContain('theme-transition');
      expect(themeVariants.card.hover).toContain('theme-transition');
      expect(themeVariants.button.primary).toContain('theme-transition');
      expect(themeVariants.button.secondary).toContain('theme-transition');
      expect(themeVariants.button.ghost).toContain('theme-transition');
      expect(themeVariants.input).toContain('theme-transition');
    });

    it('should have appropriate base classes', () => {
      expect(themeVariants.card.base).toContain('bg-card');
      expect(themeVariants.button.primary).toContain('bg-primary');
      expect(themeVariants.input).toContain('bg-background');
    });
  });
});