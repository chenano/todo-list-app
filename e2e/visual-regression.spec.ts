import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
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

  test.describe('Theme Switching Visual Tests', () => {
    test('should match light theme screenshot', async ({ page }) => {
      // Ensure light theme is active
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
      
      // Wait for theme to apply
      await page.waitForTimeout(500);
      
      // Take screenshot of main dashboard
      await expect(page).toHaveScreenshot('dashboard-light-theme.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match dark theme screenshot', async ({ page }) => {
      // Switch to dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      
      // Wait for theme to apply
      await page.waitForTimeout(500);
      
      // Take screenshot of main dashboard
      await expect(page).toHaveScreenshot('dashboard-dark-theme.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match theme toggle component in both states', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      
      // Light theme toggle
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      await expect(themeToggle).toHaveScreenshot('theme-toggle-light.png');
      
      // Dark theme toggle
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await expect(themeToggle).toHaveScreenshot('theme-toggle-dark.png');
    });

    test('should match task list in both themes', async ({ page }) => {
      // Create some tasks for visual testing
      for (let i = 1; i <= 3; i++) {
        await page.click('[data-testid="add-task-button"]');
        await page.fill('input[name="title"]', `Visual test task ${i}`);
        await page.selectOption('select[name="priority"]', i === 1 ? 'high' : i === 2 ? 'medium' : 'low');
        await page.click('button[type="submit"]');
      }
      
      const taskList = page.locator('[data-testid="task-list"]');
      
      // Light theme
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      await expect(taskList).toHaveScreenshot('task-list-light.png');
      
      // Dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await expect(taskList).toHaveScreenshot('task-list-dark.png');
    });

    test('should match form components in both themes', async ({ page }) => {
      // Open task creation form
      await page.click('[data-testid="add-task-button"]');
      
      const taskForm = page.locator('[data-testid="task-form"]');
      
      // Light theme
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      await expect(taskForm).toHaveScreenshot('task-form-light.png');
      
      // Dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await expect(taskForm).toHaveScreenshot('task-form-dark.png');
    });

    test('should match search interface in both themes', async ({ page }) => {
      // Open search
      await page.keyboard.press('Control+k');
      
      const searchDialog = page.locator('[data-testid="search-dialog"]');
      
      // Light theme
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      await expect(searchDialog).toHaveScreenshot('search-dialog-light.png');
      
      // Dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await expect(searchDialog).toHaveScreenshot('search-dialog-dark.png');
    });

    test('should match bulk action bar in both themes', async ({ page }) => {
      // Create tasks and select them
      for (let i = 1; i <= 2; i++) {
        await page.click('[data-testid="add-task-button"]');
        await page.fill('input[name="title"]', `Bulk task ${i}`);
        await page.click('button[type="submit"]');
      }
      
      // Select tasks
      await page.keyboard.press('Control+a');
      
      const bulkActionBar = page.locator('[data-testid="bulk-action-bar"]');
      
      // Light theme
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      await expect(bulkActionBar).toHaveScreenshot('bulk-action-bar-light.png');
      
      // Dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await expect(bulkActionBar).toHaveScreenshot('bulk-action-bar-dark.png');
    });
  });

  test.describe('Component State Visual Tests', () => {
    test('should match loading states', async ({ page }) => {
      // Mock loading state
      await page.evaluate(() => {
        // Add loading spinner to page
        const spinner = document.createElement('div');
        spinner.setAttribute('data-testid', 'loading-spinner');
        spinner.className = 'animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full';
        document.body.appendChild(spinner);
      });
      
      const spinner = page.locator('[data-testid="loading-spinner"]');
      await expect(spinner).toHaveScreenshot('loading-spinner.png');
    });

    test('should match error states', async ({ page }) => {
      // Trigger error state
      await page.evaluate(() => {
        const errorAlert = document.createElement('div');
        errorAlert.setAttribute('data-testid', 'error-alert');
        errorAlert.className = 'bg-destructive text-destructive-foreground p-4 rounded-md';
        errorAlert.textContent = 'An error occurred while processing your request.';
        document.body.appendChild(errorAlert);
      });
      
      const errorAlert = page.locator('[data-testid="error-alert"]');
      await expect(errorAlert).toHaveScreenshot('error-alert.png');
    });

    test('should match success states', async ({ page }) => {
      // Create a task to trigger success state
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Success test task');
      await page.click('button[type="submit"]');
      
      // Should show success notification
      const successNotification = page.locator('[data-testid="success-notification"]');
      await expect(successNotification).toHaveScreenshot('success-notification.png');
    });

    test('should match empty states', async ({ page }) => {
      // Navigate to empty list or create empty state
      await page.evaluate(() => {
        // Clear all tasks to show empty state
        const emptyState = document.createElement('div');
        emptyState.setAttribute('data-testid', 'empty-state');
        emptyState.className = 'text-center py-12 text-muted-foreground';
        emptyState.innerHTML = `
          <div class="text-6xl mb-4">📝</div>
          <h3 class="text-lg font-semibold mb-2">No tasks yet</h3>
          <p>Create your first task to get started.</p>
        `;
        document.body.appendChild(emptyState);
      });
      
      const emptyState = page.locator('[data-testid="empty-state"]');
      await expect(emptyState).toHaveScreenshot('empty-state.png');
    });
  });

  test.describe('Responsive Design Visual Tests', () => {
    test('should match mobile layout', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match tablet layout', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match desktop layout', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await expect(page).toHaveScreenshot('dashboard-desktop.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Open mobile navigation
      await page.click('[data-testid="mobile-nav-toggle"]');
      
      const mobileNav = page.locator('[data-testid="mobile-nav"]');
      await expect(mobileNav).toHaveScreenshot('mobile-navigation.png');
    });
  });

  test.describe('Animation Visual Tests', () => {
    test('should match theme transition states', async ({ page }) => {
      // Capture theme transition
      await page.click('[data-testid="theme-toggle"]');
      
      // Wait for transition to start
      await page.waitForTimeout(100);
      
      await expect(page).toHaveScreenshot('theme-transition-mid.png', {
        animations: 'allow',
      });
    });

    test('should match modal open animation', async ({ page }) => {
      // Open modal
      await page.click('[data-testid="add-task-button"]');
      
      // Capture during animation
      await page.waitForTimeout(150);
      
      const modal = page.locator('[data-testid="task-form"]');
      await expect(modal).toHaveScreenshot('modal-opening.png', {
        animations: 'allow',
      });
    });

    test('should match hover states', async ({ page }) => {
      // Create a task first
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Hover test task');
      await page.click('button[type="submit"]');
      
      // Hover over task item
      const taskItem = page.locator('[data-testid="task-item"]').first();
      await taskItem.hover();
      
      await expect(taskItem).toHaveScreenshot('task-item-hover.png');
    });

    test('should match focus states', async ({ page }) => {
      // Focus on search input
      await page.keyboard.press('Control+k');
      const searchInput = page.locator('input[placeholder*="Search"]');
      
      await expect(searchInput).toHaveScreenshot('search-input-focus.png');
    });
  });

  test.describe('Data Visualization Visual Tests', () => {
    test('should match analytics charts', async ({ page }) => {
      // Navigate to analytics page
      await page.goto('/dashboard/analytics');
      await page.waitForLoadState('networkidle');
      
      // Wait for charts to render
      await page.waitForTimeout(1000);
      
      const analyticsCharts = page.locator('[data-testid="analytics-charts"]');
      await expect(analyticsCharts).toHaveScreenshot('analytics-charts.png');
    });

    test('should match progress indicators', async ({ page }) => {
      // Create progress indicator
      await page.evaluate(() => {
        const progress = document.createElement('div');
        progress.setAttribute('data-testid', 'progress-indicator');
        progress.className = 'w-full bg-secondary rounded-full h-2';
        progress.innerHTML = '<div class="bg-primary h-2 rounded-full" style="width: 65%"></div>';
        document.body.appendChild(progress);
      });
      
      const progress = page.locator('[data-testid="progress-indicator"]');
      await expect(progress).toHaveScreenshot('progress-indicator.png');
    });
  });

  test.describe('Cross-browser Visual Tests', () => {
    test('should match in different browsers', async ({ page, browserName }) => {
      // Take browser-specific screenshots
      await expect(page).toHaveScreenshot(`dashboard-${browserName}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match font rendering across browsers', async ({ page, browserName }) => {
      // Focus on text-heavy areas
      const textContent = page.locator('[data-testid="task-list"]');
      await expect(textContent).toHaveScreenshot(`text-rendering-${browserName}.png`);
    });
  });
});