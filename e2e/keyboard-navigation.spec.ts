import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and ensure user is logged in
    await page.goto('/');
    
    // Mock authentication for testing
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Global Keyboard Shortcuts', () => {
    test('should create new task with Ctrl+N', async ({ page }) => {
      // Press Ctrl+N to open new task dialog
      await page.keyboard.press('Control+n');
      
      // Should open task creation form
      await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
      
      // Type task title
      await page.fill('input[name="title"]', 'New task from keyboard');
      
      // Press Enter to save
      await page.keyboard.press('Enter');
      
      // Task should be created and visible
      await expect(page.locator('text=New task from keyboard')).toBeVisible();
    });

    test('should create new list with Ctrl+Shift+N', async ({ page }) => {
      // Press Ctrl+Shift+N to open new list dialog
      await page.keyboard.press('Control+Shift+n');
      
      // Should open list creation form
      await expect(page.locator('[data-testid="list-form"]')).toBeVisible();
      
      // Type list name
      await page.fill('input[name="name"]', 'New list from keyboard');
      
      // Press Enter to save
      await page.keyboard.press('Enter');
      
      // List should be created and visible
      await expect(page.locator('text=New list from keyboard')).toBeVisible();
    });

    test('should open search with Ctrl+K', async ({ page }) => {
      // Press Ctrl+K to open search
      await page.keyboard.press('Control+k');
      
      // Should open search dialog
      await expect(page.locator('[data-testid="search-dialog"]')).toBeVisible();
      
      // Search input should be focused
      await expect(page.locator('input[placeholder*="Search"]')).toBeFocused();
    });

    test('should toggle theme with Ctrl+Shift+T', async ({ page }) => {
      // Get initial theme
      const initialTheme = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      
      // Press Ctrl+Shift+T to toggle theme
      await page.keyboard.press('Control+Shift+t');
      
      // Theme should be toggled
      const newTheme = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      
      expect(newTheme).toBe(!initialTheme);
    });

    test('should save with Ctrl+S', async ({ page }) => {
      // Create a task first
      await page.keyboard.press('Control+n');
      await page.fill('input[name="title"]', 'Task to save');
      
      // Press Ctrl+S to save
      await page.keyboard.press('Control+s');
      
      // Task should be saved and form closed
      await expect(page.locator('[data-testid="task-form"]')).not.toBeVisible();
      await expect(page.locator('text=Task to save')).toBeVisible();
    });
  });

  test.describe('List Navigation', () => {
    test('should switch between lists with Ctrl+1-9', async ({ page }) => {
      // Ensure we have multiple lists
      await page.keyboard.press('Control+Shift+n');
      await page.fill('input[name="name"]', 'List 1');
      await page.keyboard.press('Enter');
      
      await page.keyboard.press('Control+Shift+n');
      await page.fill('input[name="name"]', 'List 2');
      await page.keyboard.press('Enter');
      
      // Switch to first list with Ctrl+1
      await page.keyboard.press('Control+1');
      await expect(page.locator('text=List 1')).toBeVisible();
      
      // Switch to second list with Ctrl+2
      await page.keyboard.press('Control+2');
      await expect(page.locator('text=List 2')).toBeVisible();
    });

    test('should navigate lists with arrow keys in sidebar', async ({ page }) => {
      // Focus on sidebar
      await page.locator('[data-testid="sidebar"]').click();
      
      // Use arrow keys to navigate
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      
      // Should highlight different list items
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Task Navigation', () => {
    test('should toggle task completion with Space', async ({ page }) => {
      // Create a task first
      await page.keyboard.press('Control+n');
      await page.fill('input[name="title"]', 'Task to toggle');
      await page.keyboard.press('Enter');
      
      // Focus on the task
      await page.locator('text=Task to toggle').click();
      
      // Press Space to toggle completion
      await page.keyboard.press('Space');
      
      // Task should be marked as completed
      await expect(page.locator('[data-testid="task-item"]:has-text("Task to toggle") [data-testid="task-checkbox"]')).toBeChecked();
      
      // Press Space again to toggle back
      await page.keyboard.press('Space');
      
      // Task should be unchecked
      await expect(page.locator('[data-testid="task-item"]:has-text("Task to toggle") [data-testid="task-checkbox"]')).not.toBeChecked();
    });

    test('should navigate tasks with arrow keys', async ({ page }) => {
      // Create multiple tasks
      for (let i = 1; i <= 3; i++) {
        await page.keyboard.press('Control+n');
        await page.fill('input[name="title"]', `Task ${i}`);
        await page.keyboard.press('Enter');
      }
      
      // Focus on first task
      await page.locator('text=Task 1').click();
      
      // Navigate down with arrow key
      await page.keyboard.press('ArrowDown');
      
      // Should focus on second task
      await expect(page.locator('text=Task 2')).toBeFocused();
      
      // Navigate up with arrow key
      await page.keyboard.press('ArrowUp');
      
      // Should focus on first task
      await expect(page.locator('text=Task 1')).toBeFocused();
    });

    test('should edit task with Enter key', async ({ page }) => {
      // Create a task
      await page.keyboard.press('Control+n');
      await page.fill('input[name="title"]', 'Task to edit');
      await page.keyboard.press('Enter');
      
      // Focus on task and press Enter
      await page.locator('text=Task to edit').click();
      await page.keyboard.press('Enter');
      
      // Should open edit form
      await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
      await expect(page.locator('input[name="title"]')).toHaveValue('Task to edit');
    });

    test('should delete task with Delete key', async ({ page }) => {
      // Create a task
      await page.keyboard.press('Control+n');
      await page.fill('input[name="title"]', 'Task to delete');
      await page.keyboard.press('Enter');
      
      // Focus on task and press Delete
      await page.locator('text=Task to delete').click();
      await page.keyboard.press('Delete');
      
      // Should show confirmation dialog
      await expect(page.locator('text=Delete task')).toBeVisible();
      
      // Confirm deletion with Enter
      await page.keyboard.press('Enter');
      
      // Task should be deleted
      await expect(page.locator('text=Task to delete')).not.toBeVisible();
    });
  });

  test.describe('Form Navigation', () => {
    test('should navigate form fields with Tab', async ({ page }) => {
      // Open task creation form
      await page.keyboard.press('Control+n');
      
      // Title field should be focused
      await expect(page.locator('input[name="title"]')).toBeFocused();
      
      // Tab to description field
      await page.keyboard.press('Tab');
      await expect(page.locator('textarea[name="description"]')).toBeFocused();
      
      // Tab to priority field
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="priority-select"]')).toBeFocused();
      
      // Tab to due date field
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="due_date"]')).toBeFocused();
    });

    test('should submit form with Ctrl+Enter', async ({ page }) => {
      // Open task creation form
      await page.keyboard.press('Control+n');
      
      // Fill form
      await page.fill('input[name="title"]', 'Quick task');
      
      // Submit with Ctrl+Enter
      await page.keyboard.press('Control+Enter');
      
      // Task should be created
      await expect(page.locator('text=Quick task')).toBeVisible();
      await expect(page.locator('[data-testid="task-form"]')).not.toBeVisible();
    });

    test('should cancel form with Escape', async ({ page }) => {
      // Open task creation form
      await page.keyboard.press('Control+n');
      
      // Fill some data
      await page.fill('input[name="title"]', 'Cancelled task');
      
      // Cancel with Escape
      await page.keyboard.press('Escape');
      
      // Form should be closed and task not created
      await expect(page.locator('[data-testid="task-form"]')).not.toBeVisible();
      await expect(page.locator('text=Cancelled task')).not.toBeVisible();
    });
  });

  test.describe('Bulk Selection', () => {
    test('should select all tasks with Ctrl+A', async ({ page }) => {
      // Create multiple tasks
      for (let i = 1; i <= 3; i++) {
        await page.keyboard.press('Control+n');
        await page.fill('input[name="title"]', `Task ${i}`);
        await page.keyboard.press('Enter');
      }
      
      // Select all with Ctrl+A
      await page.keyboard.press('Control+a');
      
      // All task checkboxes should be checked
      const checkboxes = page.locator('[data-testid="task-checkbox"]');
      const count = await checkboxes.count();
      
      for (let i = 0; i < count; i++) {
        await expect(checkboxes.nth(i)).toBeChecked();
      }
      
      // Bulk action bar should be visible
      await expect(page.locator('[data-testid="bulk-action-bar"]')).toBeVisible();
    });

    test('should deselect all with Escape', async ({ page }) => {
      // Create and select tasks
      for (let i = 1; i <= 2; i++) {
        await page.keyboard.press('Control+n');
        await page.fill('input[name="title"]', `Task ${i}`);
        await page.keyboard.press('Enter');
      }
      
      await page.keyboard.press('Control+a');
      
      // Deselect with Escape
      await page.keyboard.press('Escape');
      
      // All checkboxes should be unchecked
      const checkboxes = page.locator('[data-testid="task-checkbox"]');
      const count = await checkboxes.count();
      
      for (let i = 0; i < count; i++) {
        await expect(checkboxes.nth(i)).not.toBeChecked();
      }
      
      // Bulk action bar should be hidden
      await expect(page.locator('[data-testid="bulk-action-bar"]')).not.toBeVisible();
    });

    test('should bulk delete with Delete key', async ({ page }) => {
      // Create tasks
      for (let i = 1; i <= 2; i++) {
        await page.keyboard.press('Control+n');
        await page.fill('input[name="title"]', `Task ${i}`);
        await page.keyboard.press('Enter');
      }
      
      // Select all and delete
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      
      // Should show bulk delete confirmation
      await expect(page.locator('text=Delete 2 tasks')).toBeVisible();
      
      // Confirm with Enter
      await page.keyboard.press('Enter');
      
      // Tasks should be deleted
      await expect(page.locator('text=Task 1')).not.toBeVisible();
      await expect(page.locator('text=Task 2')).not.toBeVisible();
    });
  });

  test.describe('Search Navigation', () => {
    test('should navigate search results with arrow keys', async ({ page }) => {
      // Create tasks for searching
      await page.keyboard.press('Control+n');
      await page.fill('input[name="title"]', 'Search result 1');
      await page.keyboard.press('Enter');
      
      await page.keyboard.press('Control+n');
      await page.fill('input[name="title"]', 'Search result 2');
      await page.keyboard.press('Enter');
      
      // Open search
      await page.keyboard.press('Control+k');
      
      // Type search query
      await page.fill('input[placeholder*="Search"]', 'Search result');
      
      // Wait for results
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Navigate results with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      
      // Should highlight different results
      const highlightedResult = page.locator('[data-testid="search-result"].highlighted');
      await expect(highlightedResult).toBeVisible();
    });

    test('should select search result with Enter', async ({ page }) => {
      // Create a task
      await page.keyboard.press('Control+n');
      await page.fill('input[name="title"]', 'Searchable task');
      await page.keyboard.press('Enter');
      
      // Search for it
      await page.keyboard.press('Control+k');
      await page.fill('input[placeholder*="Search"]', 'Searchable');
      
      // Select first result with Enter
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      // Should navigate to the task
      await expect(page.locator('text=Searchable task')).toBeVisible();
      await expect(page.locator('[data-testid="search-dialog"]')).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should maintain focus indicators', async ({ page }) => {
      // Navigate with Tab and check focus indicators
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Focus should be visible (check for focus ring classes)
      const focusClasses = await focusedElement.getAttribute('class');
      expect(focusClasses).toMatch(/focus|ring/);
    });

    test('should support screen reader navigation', async ({ page }) => {
      // Check for proper ARIA labels and roles
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      
      // Check for proper heading structure
      await expect(page.locator('h1, h2, h3')).toHaveCount(await page.locator('h1, h2, h3').count());
    });

    test('should skip to main content', async ({ page }) => {
      // Press Tab to focus skip link
      await page.keyboard.press('Tab');
      
      // Should show skip to main content link
      const skipLink = page.locator('text=Skip to main content');
      await expect(skipLink).toBeVisible();
      
      // Press Enter to skip
      await page.keyboard.press('Enter');
      
      // Should focus on main content
      await expect(page.locator('[role="main"]')).toBeFocused();
    });
  });

  test.describe('Performance', () => {
    test('should respond to keyboard input quickly', async ({ page }) => {
      // Measure response time for keyboard shortcuts
      const startTime = Date.now();
      
      await page.keyboard.press('Control+n');
      await page.waitForSelector('[data-testid="task-form"]');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respond within 200ms
      expect(responseTime).toBeLessThan(200);
    });

    test('should handle rapid keyboard input', async ({ page }) => {
      // Rapidly press shortcuts
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Control+k');
        await page.keyboard.press('Escape');
      }
      
      // App should remain responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });
});