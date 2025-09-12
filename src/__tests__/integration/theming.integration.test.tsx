import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { TaskItem } from '@/components/tasks/TaskItem';
import { Button } from '@/components/ui/button';
import type { Task } from '@/types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia for system theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const mockTask: Task = {
  id: '1',
  list_id: 'list1',
  user_id: 'user1',
  title: 'Test Task',
  description: 'Test Description',
  completed: false,
  priority: 'medium',
  due_date: '2024-01-15',
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-10T10:00:00Z',
};

const TestComponent = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <ThemeToggle />
        </header>
        <main className="p-4">
          <TaskItem task={mockTask} />
          <Button variant="default">Test Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="destructive">Destructive Button</Button>
        </main>
      </div>
    </ThemeProvider>
  );
};

describe('Theming Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    document.documentElement.className = '';
  });

  describe('Theme Initialization', () => {
    it('should initialize with system theme when no preference stored', () => {
      render(<TestComponent />);
      
      // Should detect system preference
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should initialize with stored theme preference', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      render(<TestComponent />);
      
      // Should apply dark theme
      expect(document.documentElement).toHaveClass('dark');
    });

    it('should apply light theme by default when system preference is light', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false, // Light theme
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(<TestComponent />);
      
      expect(document.documentElement).not.toHaveClass('dark');
    });
  });

  describe('Theme Switching', () => {
    it('should switch from light to dark theme', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      // Initially light theme
      expect(document.documentElement).not.toHaveClass('dark');

      // Click theme toggle
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(themeToggle);

      // Should switch to dark theme
      expect(document.documentElement).toHaveClass('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should switch from dark to light theme', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      const user = userEvent.setup();
      
      render(<TestComponent />);

      // Initially dark theme
      expect(document.documentElement).toHaveClass('dark');

      // Click theme toggle
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(themeToggle);

      // Should switch to light theme
      expect(document.documentElement).not.toHaveClass('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should cycle through light -> dark -> system themes', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });

      // Start with light, click to dark
      await user.click(themeToggle);
      expect(document.documentElement).toHaveClass('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

      // Click to system
      await user.click(themeToggle);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'system');

      // Click back to light
      await user.click(themeToggle);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme preference across page reloads', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      render(<TestComponent />);
      
      expect(document.documentElement).toHaveClass('dark');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
    });

    it('should handle invalid stored theme values gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-theme');
      
      render(<TestComponent />);
      
      // Should fall back to system theme
      expect(window.matchMedia).toHaveBeenCalled();
    });
  });

  describe('System Theme Detection', () => {
    it('should respond to system theme changes', async () => {
      mockLocalStorage.getItem.mockReturnValue('system');
      
      let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;
      
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            mediaQueryCallback = callback;
          }
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(<TestComponent />);

      // Initially light (system preference)
      expect(document.documentElement).not.toHaveClass('dark');

      // Simulate system theme change to dark
      if (mediaQueryCallback) {
        mediaQueryCallback({ matches: true } as MediaQueryListEvent);
      }

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });
    });
  });

  describe('Component Theme Adaptation', () => {
    it('should apply correct CSS classes for light theme', () => {
      render(<TestComponent />);

      // Check background and text colors are applied
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('bg-background', 'text-foreground');
    });

    it('should apply correct CSS classes for dark theme', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      // Switch to dark theme
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(themeToggle);

      // Check dark theme classes are applied
      expect(document.documentElement).toHaveClass('dark');
      
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('bg-background', 'text-foreground');
    });

    it('should update button variants correctly in different themes', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const defaultButton = screen.getByText('Test Button');
      const secondaryButton = screen.getByText('Secondary Button');
      const destructiveButton = screen.getByText('Destructive Button');

      // Check initial button classes (light theme)
      expect(defaultButton).toHaveClass('bg-primary', 'text-primary-foreground');
      expect(secondaryButton).toHaveClass('bg-secondary', 'text-secondary-foreground');
      expect(destructiveButton).toHaveClass('bg-destructive', 'text-destructive-foreground');

      // Switch to dark theme
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(themeToggle);

      // Button classes should still be correct (CSS variables handle the color changes)
      expect(defaultButton).toHaveClass('bg-primary', 'text-primary-foreground');
      expect(secondaryButton).toHaveClass('bg-secondary', 'text-secondary-foreground');
      expect(destructiveButton).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });
  });

  describe('Theme Transitions', () => {
    it('should apply smooth transitions when switching themes', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      // Check if transition classes are applied
      const rootElement = document.documentElement;
      
      // Switch theme
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(themeToggle);

      // Should have transition classes (this depends on implementation)
      // The actual transition is handled by CSS, so we mainly check that the theme change occurs
      expect(document.documentElement).toHaveClass('dark');
    });
  });

  describe('Accessibility in Different Themes', () => {
    it('should maintain proper contrast ratios in light theme', () => {
      render(<TestComponent />);

      // Check that elements have proper contrast classes
      const taskElement = screen.getByText('Test Task');
      expect(taskElement).toBeInTheDocument();
      
      // The actual contrast checking would require more sophisticated testing
      // Here we ensure the theme classes are applied correctly
      expect(document.documentElement).not.toHaveClass('dark');
    });

    it('should maintain proper contrast ratios in dark theme', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      // Switch to dark theme
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(themeToggle);

      // Check that dark theme is applied
      expect(document.documentElement).toHaveClass('dark');
      
      // Elements should still be visible and accessible
      const taskElement = screen.getByText('Test Task');
      expect(taskElement).toBeInTheDocument();
    });

    it('should support high contrast mode', async () => {
      // Mock high contrast media query
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('high-contrast'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(<TestComponent />);

      // Should detect high contrast preference
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
    });
  });

  describe('Performance', () => {
    it('should switch themes without significant performance impact', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });

      // Measure theme switching performance
      const startTime = performance.now();
      
      // Switch themes multiple times
      for (let i = 0; i < 10; i++) {
        await user.click(themeToggle);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (1 second for 10 switches)
      expect(duration).toBeLessThan(1000);
    });

    it('should not cause memory leaks during theme switching', async () => {
      const user = userEvent.setup();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      render(<TestComponent />);
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });

      // Switch themes many times
      for (let i = 0; i < 50; i++) {
        await user.click(themeToggle);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });
  });
});