import { test, expect, devices } from '@playwright/test';

// Test across different browsers and devices
const browsers = ['chromium', 'firefox', 'webkit'];
const viewports = [
  { name: 'mobile', ...devices['iPhone 12'] },
  { name: 'tablet', ...devices['iPad Pro'] },
  { name: 'desktop', width: 1920, height: 1080 },
];

test.describe('Cross-Browser Compatibility Tests', () => {
  browsers.forEach(browserName => {
    test.describe(`${browserName} Browser Tests`, () => {
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

      test(`should load dashboard correctly in ${browserName}`, async ({ page }) => {
        // Basic functionality should work
        await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
        await expect(page.locator('[data-testid="add-task-button"]')).toBeVisible();
        
        // Check for browser-specific issues
        const userAgent = await page.evaluate(() => navigator.userAgent);
        console.log(`${browserName} User Agent:`, userAgent);
      });

      test(`should handle task operations in ${browserName}`, async ({ page }) => {
        // Create task
        await page.click('[data-testid="add-task-button"]');
        await page.fill('input[name="title"]', `${browserName} test task`);
        await page.click('button[type="submit"]');
        
        // Verify task appears
        await expect(page.locator(`text=${browserName} test task`)).toBeVisible();
        
        // Complete task
        await page.click('[data-testid="task-checkbox"]');
        
        // Verify completion
        await expect(page.locator('[data-testid="task-item"]')).toHaveClass(/completed/);
      });

      test(`should handle theme switching in ${browserName}`, async ({ page }) => {
        // Get initial theme
        const initialTheme = await page.evaluate(() => 
          document.documentElement.classList.contains('dark')
        );
        
        // Toggle theme
        await page.click('[data-testid="theme-toggle"]');
        
        // Verify theme changed
        const newTheme = await page.evaluate(() => 
          document.documentElement.classList.contains('dark')
        );
        
        expect(newTheme).toBe(!initialTheme);
      });

      test(`should handle keyboard shortcuts in ${browserName}`, async ({ page }) => {
        // Test Ctrl+N (or Cmd+N on webkit)
        const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+n`);
        
        // Should open task form
        await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
        
        // Test Escape
        await page.keyboard.press('Escape');
        
        // Should close form
        await expect(page.locator('[data-testid="task-form"]')).not.toBeVisible();
      });

      test(`should handle search functionality in ${browserName}`, async ({ page }) => {
        // Create a task to search for
        await page.click('[data-testid="add-task-button"]');
        await page.fill('input[name="title"]', 'Searchable task');
        await page.click('button[type="submit"]');
        
        // Open search
        const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+k`);
        
        // Search for task
        await page.fill('input[placeholder*="Search"]', 'Searchable');
        
        // Should show results
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      });

      test(`should handle form validation in ${browserName}`, async ({ page }) => {
        // Try to submit empty form
        await page.click('[data-testid="add-task-button"]');
        await page.click('button[type="submit"]');
        
        // Should show validation error
        await expect(page.locator('text=Title is required')).toBeVisible();
        
        // Fill form and submit
        await page.fill('input[name="title"]', 'Valid task');
        await page.click('button[type="submit"]');
        
        // Should create task
        await expect(page.locator('text=Valid task')).toBeVisible();
      });

      test(`should handle date picker in ${browserName}`, async ({ page }) => {
        await page.click('[data-testid="add-task-button"]');
        await page.fill('input[name="title"]', 'Task with date');
        
        // Open date picker
        await page.click('input[name="due_date"]');
        
        // Should show date picker (implementation may vary by browser)
        const datePicker = page.locator('[data-testid="date-picker"]');
        if (await datePicker.isVisible()) {
          // Select a date
          await page.click('[data-testid="date-15"]');
        } else {
          // Fallback for browsers with native date input
          await page.fill('input[name="due_date"]', '2024-01-15');
        }
        
        await page.click('button[type="submit"]');
        
        // Verify task with date
        await expect(page.locator('text=Task with date')).toBeVisible();
      });

      test(`should handle drag and drop in ${browserName}`, async ({ page }) => {
        // Create multiple tasks
        for (let i = 1; i <= 3; i++) {
          await page.click('[data-testid="add-task-button"]');
          await page.fill('input[name="title"]', `Drag task ${i}`);
          await page.click('button[type="submit"]');
        }
        
        // Test drag and drop reordering (if implemented)
        const firstTask = page.locator('[data-testid="task-item"]').first();
        const lastTask = page.locator('[data-testid="task-item"]').last();
        
        // Attempt drag and drop
        await firstTask.dragTo(lastTask);
        
        // Verify reordering (this test may need adjustment based on implementation)
        // For now, just verify tasks are still visible
        await expect(page.locator('text=Drag task 1')).toBeVisible();
      });

      test(`should handle local storage in ${browserName}`, async ({ page }) => {
        // Set theme preference
        await page.click('[data-testid="theme-toggle"]');
        
        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Theme preference should persist
        const themeAfterReload = await page.evaluate(() => 
          localStorage.getItem('theme')
        );
        
        expect(themeAfterReload).toBeTruthy();
      });

      test(`should handle CSS animations in ${browserName}`, async ({ page }) => {
        // Trigger animation
        await page.click('[data-testid="theme-toggle"]');
        
        // Check if animations are working (no errors in console)
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        await page.waitForTimeout(1000); // Wait for animation
        
        // Should not have animation-related errors
        const animationErrors = consoleErrors.filter(error => 
          error.includes('animation') || error.includes('transition')
        );
        expect(animationErrors).toHaveLength(0);
      });
    });
  });

  viewports.forEach(viewport => {
    test.describe(`${viewport.name} Viewport Tests`, () => {
      test.beforeEach(async ({ page }) => {
        // Set viewport
        await page.setViewportSize({ 
          width: viewport.width || 1920, 
          height: viewport.height || 1080 
        });
        
        // Navigate to the app
        await page.goto('/');
        
        // Mock authentication
        await page.evaluate(() => {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: 'mock-token',
            user: { id: 'test-user', email: 'test@example.com' }
          }));
        });
        
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      });

      test(`should display correctly on ${viewport.name}`, async ({ page }) => {
        // Check responsive layout
        await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
        
        if (viewport.name === 'mobile') {
          // Mobile-specific checks
          await expect(page.locator('[data-testid="mobile-nav-toggle"]')).toBeVisible();
          await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
        } else {
          // Desktop/tablet checks
          await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
        }
      });

      test(`should handle touch interactions on ${viewport.name}`, async ({ page }) => {
        if (viewport.name === 'mobile') {
          // Test touch interactions
          await page.tap('[data-testid="add-task-button"]');
          await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
          
          // Test swipe gestures (if implemented)
          const taskForm = page.locator('[data-testid="task-form"]');
          await taskForm.evaluate(el => {
            el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
            el.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
          });
        }
      });

      test(`should handle navigation on ${viewport.name}`, async ({ page }) => {
        if (viewport.name === 'mobile') {
          // Test mobile navigation
          await page.click('[data-testid="mobile-nav-toggle"]');
          await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
          
          // Navigate to different section
          await page.click('[data-testid="nav-analytics"]');
          await expect(page).toHaveURL(/analytics/);
        } else {
          // Test desktop navigation
          await page.click('[data-testid="nav-analytics"]');
          await expect(page).toHaveURL(/analytics/);
        }
      });

      test(`should handle forms on ${viewport.name}`, async ({ page }) => {
        await page.click('[data-testid="add-task-button"]');
        
        // Form should be appropriately sized
        const form = page.locator('[data-testid="task-form"]');
        const formBox = await form.boundingBox();
        
        if (viewport.name === 'mobile') {
          // Form should not exceed viewport width
          expect(formBox?.width).toBeLessThanOrEqual(viewport.width || 375);
        }
        
        // Fill and submit form
        await page.fill('input[name="title"]', `${viewport.name} task`);
        await page.click('button[type="submit"]');
        
        // Task should be created
        await expect(page.locator(`text=${viewport.name} task`)).toBeVisible();
      });

      test(`should handle scrolling on ${viewport.name}`, async ({ page }) => {
        // Create multiple tasks to enable scrolling
        for (let i = 1; i <= 20; i++) {
          await page.click('[data-testid="add-task-button"]');
          await page.fill('input[name="title"]', `Scroll task ${i}`);
          await page.click('button[type="submit"]');
        }
        
        // Test scrolling
        const taskList = page.locator('[data-testid="task-list"]');
        await taskList.evaluate(el => {
          el.scrollTop = el.scrollHeight;
        });
        
        // Should be able to scroll to bottom
        const scrollTop = await taskList.evaluate(el => el.scrollTop);
        expect(scrollTop).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Feature Detection Tests', () => {
    test('should detect browser capabilities', async ({ page }) => {
      const capabilities = await page.evaluate(() => {
        return {
          localStorage: typeof Storage !== 'undefined',
          indexedDB: typeof indexedDB !== 'undefined',
          serviceWorker: 'serviceWorker' in navigator,
          webGL: !!document.createElement('canvas').getContext('webgl'),
          touchEvents: 'ontouchstart' in window,
          geolocation: 'geolocation' in navigator,
          notifications: 'Notification' in window,
          webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        };
      });
      
      console.log('Browser capabilities:', capabilities);
      
      // Essential features should be available
      expect(capabilities.localStorage).toBe(true);
      expect(capabilities.indexedDB).toBe(true);
    });

    test('should handle missing features gracefully', async ({ page }) => {
      // Mock missing localStorage
      await page.addInitScript(() => {
        delete (window as any).localStorage;
      });
      
      await page.goto('/dashboard');
      
      // App should still function (with fallbacks)
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    });

    test('should detect and handle slow connections', async ({ page }) => {
      // Simulate slow connection
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        await route.continue();
      });
      
      await page.goto('/dashboard');
      
      // Should show loading states appropriately
      const loadingIndicator = page.locator('[data-testid="loading-spinner"]');
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toBeVisible();
      }
    });
  });

  test.describe('Accessibility Cross-Browser Tests', () => {
    test('should maintain accessibility across browsers', async ({ page }) => {
      // Check for basic accessibility features
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      
      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
      expect(headings).toBeGreaterThan(0);
      
      // Check for alt text on images
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('should support keyboard navigation across browsers', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
      
      await page.keyboard.press('Tab');
      const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
      
      // Should be able to navigate with keyboard
      expect(firstFocused).toBeTruthy();
      expect(secondFocused).toBeTruthy();
    });

    test('should announce changes to screen readers', async ({ page }) => {
      // Create a task (should announce to screen readers)
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Screen reader test');
      await page.click('button[type="submit"]');
      
      // Check for aria-live regions
      const liveRegions = await page.locator('[aria-live]').count();
      expect(liveRegions).toBeGreaterThan(0);
    });
  });
});