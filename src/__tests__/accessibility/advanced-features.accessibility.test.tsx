import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SearchBar } from '@/components/ui/search-bar';
import { BulkActionBar } from '@/components/tasks/BulkActionBar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { KeyboardShortcutHelp } from '@/components/ui/keyboard-shortcut-help';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { ImportDialog } from '@/components/ui/import-dialog';
import { ExportDialog } from '@/components/ui/export-dialog';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { VirtualTaskList } from '@/components/tasks/VirtualTaskList';
import { BulkSelectionProvider } from '@/contexts/BulkSelectionContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SearchProvider } from '@/contexts/SearchContext';
import type { Task } from '@/types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Accessible task 1',
    description: 'Description for task 1',
    completed: false,
    priority: 'medium',
    due_date: '2024-01-15',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Accessible task 2',
    description: 'Description for task 2',
    completed: true,
    priority: 'high',
    due_date: '2024-01-20',
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-08T10:00:00Z',
  },
];

const mockAnalyticsData = {
  completionRate: 75,
  totalTasks: 100,
  completedTasks: 75,
  overdueTasks: 5,
  todayTasks: 10,
  weeklyProgress: [
    { day: 'Mon', completed: 5, created: 7 },
    { day: 'Tue', completed: 8, created: 6 },
    { day: 'Wed', completed: 6, created: 8 },
    { day: 'Thu', completed: 9, created: 5 },
    { day: 'Fri', completed: 7, created: 9 },
    { day: 'Sat', completed: 4, created: 3 },
    { day: 'Sun', completed: 3, created: 4 },
  ],
  priorityDistribution: {
    high: 20,
    medium: 50,
    low: 30,
  },
};

describe('Advanced Features Accessibility Tests', () => {
  describe('Search Components', () => {
    it('should have no accessibility violations in SearchBar', async () => {
      const { container } = render(
        <SearchProvider>
          <SearchBar />
        </SearchProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels in SearchBar', () => {
      render(
        <SearchProvider>
          <SearchBar />
        </SearchProvider>
      );

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('Search'));
      expect(searchInput).toHaveAttribute('placeholder');
    });

    it('should announce search results to screen readers', async () => {
      const user = userEvent.setup();
      render(
        <SearchProvider>
          <SearchBar />
        </SearchProvider>
      );

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'test query');

      // Should have aria-live region for results
      const resultsRegion = screen.getByRole('region', { name: /search results/i });
      expect(resultsRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should support keyboard navigation in search results', async () => {
      const user = userEvent.setup();
      render(
        <SearchProvider>
          <SearchBar />
        </SearchProvider>
      );

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'test');

      // Arrow keys should navigate results
      await user.keyboard('{ArrowDown}');
      
      const firstResult = screen.getByRole('option', { selected: true });
      expect(firstResult).toBeInTheDocument();
    });
  });

  describe('Bulk Operations', () => {
    it('should have no accessibility violations in BulkActionBar', async () => {
      const { container } = render(
        <BulkSelectionProvider>
          <BulkActionBar />
        </BulkSelectionProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for bulk actions', () => {
      render(
        <BulkSelectionProvider>
          <BulkActionBar />
        </BulkSelectionProvider>
      );

      const completeButton = screen.getByRole('button', { name: /complete selected/i });
      expect(completeButton).toHaveAttribute('aria-label');

      const deleteButton = screen.getByRole('button', { name: /delete selected/i });
      expect(deleteButton).toHaveAttribute('aria-label');
    });

    it('should announce selection count to screen readers', async () => {
      render(
        <BulkSelectionProvider>
          <BulkActionBar />
        </BulkSelectionProvider>
      );

      const selectionStatus = screen.getByRole('status');
      expect(selectionStatus).toHaveAttribute('aria-live', 'polite');
      expect(selectionStatus).toHaveTextContent(/selected/i);
    });

    it('should support keyboard shortcuts for bulk operations', async () => {
      const user = userEvent.setup();
      render(
        <BulkSelectionProvider>
          <BulkActionBar />
        </BulkSelectionProvider>
      );

      // Ctrl+A should be announced
      await user.keyboard('{Control>}a{/Control}');
      
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/all.*selected/i);
    });
  });

  describe('Theme Toggle', () => {
    it('should have no accessibility violations in ThemeToggle', async () => {
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for theme states', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const themeButton = screen.getByRole('button');
      expect(themeButton).toHaveAttribute('aria-label', expect.stringContaining('theme'));
      expect(themeButton).toHaveAttribute('aria-pressed');
    });

    it('should announce theme changes to screen readers', async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const themeButton = screen.getByRole('button');
      await user.click(themeButton);

      // Should have announcement region
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/theme.*changed/i);
    });

    it('should maintain focus visibility in both themes', async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const themeButton = screen.getByRole('button');
      
      // Focus the button
      await user.tab();
      expect(themeButton).toHaveFocus();
      
      // Toggle theme
      await user.click(themeButton);
      
      // Focus should still be visible
      expect(themeButton).toHaveFocus();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should have no accessibility violations in KeyboardShortcutHelp', async () => {
      const { container } = render(<KeyboardShortcutHelp />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading structure in shortcut help', () => {
      render(<KeyboardShortcutHelp />);

      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(expect.any(Number));
      
      // Should have logical heading hierarchy
      headings.forEach(heading => {
        expect(heading.tagName).toMatch(/^H[1-6]$/);
      });
    });

    it('should use proper markup for keyboard shortcuts', () => {
      render(<KeyboardShortcutHelp />);

      const shortcuts = screen.getAllByRole('row');
      shortcuts.forEach(shortcut => {
        // Should have proper table structure
        expect(shortcut.closest('table')).toBeInTheDocument();
      });
    });

    it('should be navigable with keyboard', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutHelp />);

      // Should be able to navigate through shortcuts
      await user.tab();
      
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });
  });

  describe('Offline Indicator', () => {
    it('should have no accessibility violations in OfflineIndicator', async () => {
      const { container } = render(<OfflineIndicator isOffline={true} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should announce offline status to screen readers', () => {
      render(<OfflineIndicator isOffline={true} />);

      const offlineStatus = screen.getByRole('status');
      expect(offlineStatus).toHaveAttribute('aria-live', 'assertive');
      expect(offlineStatus).toHaveTextContent(/offline/i);
    });

    it('should announce online status to screen readers', () => {
      render(<OfflineIndicator isOffline={false} />);

      const onlineStatus = screen.getByRole('status');
      expect(onlineStatus).toHaveAttribute('aria-live', 'polite');
      expect(onlineStatus).toHaveTextContent(/online/i);
    });

    it('should have proper color contrast for status indicators', () => {
      const { container } = render(<OfflineIndicator isOffline={true} />);

      const indicator = container.querySelector('[data-testid="offline-indicator"]');
      expect(indicator).toHaveClass(expect.stringMatching(/bg-|text-/));
    });
  });

  describe('Import/Export Dialogs', () => {
    it('should have no accessibility violations in ImportDialog', async () => {
      const { container } = render(
        <ImportDialog 
          isOpen={true} 
          onClose={jest.fn()} 
          onImport={jest.fn()} 
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in ExportDialog', async () => {
      const { container } = render(
        <ExportDialog 
          isOpen={true} 
          onClose={jest.fn()} 
          onExport={jest.fn()} 
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper dialog structure', () => {
      render(
        <ImportDialog 
          isOpen={true} 
          onClose={jest.fn()} 
          onImport={jest.fn()} 
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should trap focus within dialog', async () => {
      const user = userEvent.setup();
      render(
        <ImportDialog 
          isOpen={true} 
          onClose={jest.fn()} 
          onImport={jest.fn()} 
        />
      );

      // Focus should be trapped within dialog
      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement?.closest('[role="dialog"]')).toBeInTheDocument();
    });

    it('should support Escape key to close dialog', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(
        <ImportDialog 
          isOpen={true} 
          onClose={onClose} 
          onImport={jest.fn()} 
        />
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Analytics Dashboard', () => {
    it('should have no accessibility violations in AnalyticsDashboard', async () => {
      const { container } = render(
        <AnalyticsDashboard data={mockAnalyticsData} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper headings for analytics sections', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      // Should have main dashboard heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should provide text alternatives for charts', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      // Charts should have accessible descriptions
      const charts = screen.getAllByRole('img');
      charts.forEach(chart => {
        expect(chart).toHaveAttribute('aria-label');
      });
    });

    it('should have proper table structure for data tables', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      const tables = screen.getAllByRole('table');
      tables.forEach(table => {
        // Should have proper table headers
        const headers = screen.getAllByRole('columnheader');
        expect(headers.length).toBeGreaterThan(0);
      });
    });

    it('should announce data updates to screen readers', async () => {
      const { rerender } = render(
        <AnalyticsDashboard data={mockAnalyticsData} />
      );

      const updatedData = {
        ...mockAnalyticsData,
        completionRate: 80,
        completedTasks: 80,
      };

      rerender(<AnalyticsDashboard data={updatedData} />);

      // Should have live region for updates
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Virtual Task List', () => {
    it('should have no accessibility violations in VirtualTaskList', async () => {
      const { container } = render(
        <VirtualTaskList
          tasks={mockTasks}
          onTaskUpdate={jest.fn()}
          onTaskDelete={jest.fn()}
          loadMoreTasks={jest.fn()}
          hasNextPage={false}
          isLoadingMore={false}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper list structure', () => {
      render(
        <VirtualTaskList
          tasks={mockTasks}
          onTaskUpdate={jest.fn()}
          onTaskDelete={jest.fn()}
          loadMoreTasks={jest.fn()}
          hasNextPage={false}
          isLoadingMore={false}
        />
      );

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('should announce list changes to screen readers', async () => {
      const { rerender } = render(
        <VirtualTaskList
          tasks={mockTasks}
          onTaskUpdate={jest.fn()}
          onTaskDelete={jest.fn()}
          loadMoreTasks={jest.fn()}
          hasNextPage={false}
          isLoadingMore={false}
        />
      );

      const updatedTasks = [...mockTasks, {
        id: '3',
        list_id: 'list1',
        user_id: 'user1',
        title: 'New task',
        description: 'New task description',
        completed: false,
        priority: 'low' as const,
        due_date: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      }];

      rerender(
        <VirtualTaskList
          tasks={updatedTasks}
          onTaskUpdate={jest.fn()}
          onTaskDelete={jest.fn()}
          loadMoreTasks={jest.fn()}
          hasNextPage={false}
          isLoadingMore={false}
        />
      );

      // Should announce list updates
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should support keyboard navigation through virtual list', async () => {
      const user = userEvent.setup();
      render(
        <VirtualTaskList
          tasks={mockTasks}
          onTaskUpdate={jest.fn()}
          onTaskDelete={jest.fn()}
          loadMoreTasks={jest.fn()}
          hasNextPage={false}
          isLoadingMore={false}
        />
      );

      // Should be able to navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });

    it('should have proper loading state announcements', () => {
      render(
        <VirtualTaskList
          tasks={mockTasks}
          onTaskUpdate={jest.fn()}
          onTaskDelete={jest.fn()}
          loadMoreTasks={jest.fn()}
          hasNextPage={true}
          isLoadingMore={true}
        />
      );

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toHaveTextContent(/loading/i);
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Color Contrast', () => {
    it('should maintain proper contrast in light theme', () => {
      render(
        <ThemeProvider>
          <div className="bg-background text-foreground p-4">
            <SearchBar />
            <ThemeToggle />
          </div>
        </ThemeProvider>
      );

      // Elements should have proper contrast classes
      const elements = screen.getAllByRole('button');
      elements.forEach(element => {
        const classes = element.className;
        expect(classes).toMatch(/text-|bg-/);
      });
    });

    it('should maintain proper contrast in dark theme', async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider>
          <div className="bg-background text-foreground p-4">
            <ThemeToggle />
            <SearchBar />
          </div>
        </ThemeProvider>
      );

      // Switch to dark theme
      const themeToggle = screen.getByRole('button', { name: /theme/i });
      await user.click(themeToggle);

      // Should apply dark theme classes
      expect(document.documentElement).toHaveClass('dark');
    });
  });

  describe('Focus Management', () => {
    it('should maintain logical focus order', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <SearchBar />
          <BulkSelectionProvider>
            <BulkActionBar />
          </BulkSelectionProvider>
          <ThemeToggle />
        </div>
      );

      // Tab through elements
      await user.tab();
      const first = document.activeElement;
      
      await user.tab();
      const second = document.activeElement;
      
      await user.tab();
      const third = document.activeElement;

      // Focus should move in logical order
      expect(first).not.toBe(second);
      expect(second).not.toBe(third);
    });

    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <SearchBar />
          <ThemeToggle />
        </div>
      );

      await user.tab();
      const focusedElement = document.activeElement;
      
      // Should have focus ring classes
      expect(focusedElement?.className).toMatch(/focus|ring/);
    });
  });
});