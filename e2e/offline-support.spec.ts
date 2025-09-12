import { test, expect } from '@playwright/test';

test.describe('Offline Support E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
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

  test.describe('Offline Detection', () => {
    test('should detect when going offline', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      await expect(page.locator('text=You are offline')).toBeVisible();
    });

    test('should detect when coming back online', async ({ page, context }) => {
      // Go offline first
      await context.setOffline(true);
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Come back online
      await context.setOffline(false);
      
      // Should hide offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
      
      // Should show sync indicator
      await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
    });

    test('should show connection status in header', async ({ page, context }) => {
      // Should show online status initially
      await expect(page.locator('[data-testid="connection-status"]')).toHaveText(/online/i);
      
      // Go offline
      await context.setOffline(true);
      await expect(page.locator('[data-testid="connection-status"]')).toHaveText(/offline/i);
      
      // Come back online
      await context.setOffline(false);
      await expect(page.locator('[data-testid="connection-status"]')).toHaveText(/online/i);
    });
  });

  test.describe('Offline Task Operations', () => {
    test('should create tasks while offline', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);
      
      // Create a task
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Offline task');
      await page.fill('textarea[name="description"]', 'Created while offline');
      await page.click('button[type="submit"]');
      
      // Task should appear in UI immediately
      await expect(page.locator('text=Offline task')).toBeVisible();
      
      // Should show queued indicator
      await expect(page.locator('[data-testid="task-queued-indicator"]')).toBeVisible();
    });

    test('should edit tasks while offline', async ({ page, context }) => {
      // Create a task while online first
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Task to edit offline');
      await page.click('button[type="submit"]');
      
      // Go offline
      await context.setOffline(true);
      
      // Edit the task
      await page.click('[data-testid="edit-task-button"]');
      await page.fill('input[name="title"]', 'Edited offline task');
      await page.click('button[type="submit"]');
      
      // Changes should appear immediately
      await expect(page.locator('text=Edited offline task')).toBeVisible();
      
      // Should show queued indicator
      await expect(page.locator('[data-testid="task-queued-indicator"]')).toBeVisible();
    });

    test('should complete tasks while offline', async ({ page, context }) => {
      // Create a task while online
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Task to complete offline');
      await page.click('button[type="submit"]');
      
      // Go offline
      await context.setOffline(true);
      
      // Complete the task
      await page.click('[data-testid="task-checkbox"]');
      
      // Task should appear completed
      await expect(page.locator('[data-testid="task-item"]')).toHaveClass(/completed/);
      
      // Should show queued indicator
      await expect(page.locator('[data-testid="task-queued-indicator"]')).toBeVisible();
    });

    test('should delete tasks while offline', async ({ page, context }) => {
      // Create a task while online
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Task to delete offline');
      await page.click('button[type="submit"]');
      
      // Go offline
      await context.setOffline(true);
      
      // Delete the task
      await page.click('[data-testid="delete-task-button"]');
      await page.click('button:has-text("Delete")'); // Confirm deletion
      
      // Task should disappear from UI
      await expect(page.locator('text=Task to delete offline')).not.toBeVisible();
    });
  });

  test.describe('Offline List Operations', () => {
    test('should create lists while offline', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);
      
      // Create a list
      await page.click('[data-testid="add-list-button"]');
      await page.fill('input[name="name"]', 'Offline list');
      await page.fill('textarea[name="description"]', 'Created while offline');
      await page.click('button[type="submit"]');
      
      // List should appear in UI
      await expect(page.locator('text=Offline list')).toBeVisible();
      
      // Should show queued indicator
      await expect(page.locator('[data-testid="list-queued-indicator"]')).toBeVisible();
    });

    test('should edit lists while offline', async ({ page, context }) => {
      // Create a list while online
      await page.click('[data-testid="add-list-button"]');
      await page.fill('input[name="name"]', 'List to edit offline');
      await page.click('button[type="submit"]');
      
      // Go offline
      await context.setOffline(true);
      
      // Edit the list
      await page.click('[data-testid="edit-list-button"]');
      await page.fill('input[name="name"]', 'Edited offline list');
      await page.click('button[type="submit"]');
      
      // Changes should appear immediately
      await expect(page.locator('text=Edited offline list')).toBeVisible();
    });

    test('should delete lists while offline', async ({ page, context }) => {
      // Create a list while online
      await page.click('[data-testid="add-list-button"]');
      await page.fill('input[name="name"]', 'List to delete offline');
      await page.click('button[type="submit"]');
      
      // Go offline
      await context.setOffline(true);
      
      // Delete the list
      await page.click('[data-testid="delete-list-button"]');
      await page.click('button:has-text("Delete")'); // Confirm deletion
      
      // List should disappear from UI
      await expect(page.locator('text=List to delete offline')).not.toBeVisible();
    });
  });

  test.describe('Operation Queue Management', () => {
    test('should show queued operations count', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);
      
      // Perform multiple operations
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Task 1');
      await page.click('button[type="submit"]');
      
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Task 2');
      await page.click('button[type="submit"]');
      
      // Should show queued operations count
      await expect(page.locator('[data-testid="queued-operations-count"]')).toHaveText('2');
    });

    test('should show operation queue details', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);
      
      // Perform operations
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Queued task');
      await page.click('button[type="submit"]');
      
      // Click on queue indicator to show details
      await page.click('[data-testid="queued-operations-count"]');
      
      // Should show operation details
      await expect(page.locator('[data-testid="operation-queue-dialog"]')).toBeVisible();
      await expect(page.locator('text=Create task: Queued task')).toBeVisible();
    });

    test('should allow manual retry of failed operations', async ({ page, context }) => {
      // Go offline and create task
      await context.setOffline(true);
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Failed task');
      await page.click('button[type="submit"]');
      
      // Come back online but simulate server error
      await context.setOffline(false);
      await page.route('**/api/**', route => route.abort());
      
      // Wait for sync attempt and failure
      await page.waitForSelector('[data-testid="sync-error"]');
      
      // Should show retry button
      await expect(page.locator('[data-testid="retry-sync-button"]')).toBeVisible();
      
      // Click retry
      await page.unroute('**/api/**'); // Remove error simulation
      await page.click('[data-testid="retry-sync-button"]');
      
      // Should attempt sync again
      await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
    });
  });

  test.describe('Synchronization', () => {
    test('should sync queued operations when coming online', async ({ page, context }) => {
      // Go offline and create tasks
      await context.setOffline(true);
      
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Sync task 1');
      await page.click('button[type="submit"]');
      
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Sync task 2');
      await page.click('button[type="submit"]');
      
      // Come back online
      await context.setOffline(false);
      
      // Should show sync progress
      await expect(page.locator('[data-testid="sync-progress"]')).toBeVisible();
      
      // Wait for sync to complete
      await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 10000 });
      
      // Queued indicators should disappear
      await expect(page.locator('[data-testid="task-queued-indicator"]')).not.toBeVisible();
    });

    test('should show sync progress with details', async ({ page, context }) => {
      // Create multiple operations offline
      await context.setOffline(true);
      
      for (let i = 1; i <= 5; i++) {
        await page.click('[data-testid="add-task-button"]');
        await page.fill('input[name="title"]', `Sync task ${i}`);
        await page.click('button[type="submit"]');
      }
      
      // Come back online
      await context.setOffline(false);
      
      // Should show detailed sync progress
      await expect(page.locator('[data-testid="sync-progress-bar"]')).toBeVisible();
      await expect(page.locator('[data-testid="sync-progress-text"]')).toContainText('Syncing 5 operations');
    });

    test('should handle sync conflicts', async ({ page, context }) => {
      // Create a task while online
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Conflict task');
      await page.click('button[type="submit"]');
      
      // Go offline and edit the task
      await context.setOffline(true);
      await page.click('[data-testid="edit-task-button"]');
      await page.fill('input[name="title"]', 'Offline edit');
      await page.click('button[type="submit"]');
      
      // Simulate server-side change while offline
      await page.evaluate(() => {
        // Mock a server-side change that would conflict
        localStorage.setItem('mock-server-change', JSON.stringify({
          taskId: 'conflict-task-id',
          title: 'Server edit',
          timestamp: Date.now()
        }));
      });
      
      // Come back online
      await context.setOffline(false);
      
      // Should show conflict resolution dialog
      await expect(page.locator('[data-testid="conflict-resolution-dialog"]')).toBeVisible();
      await expect(page.locator('text=Conflict detected')).toBeVisible();
      
      // Should show both versions
      await expect(page.locator('text=Offline edit')).toBeVisible();
      await expect(page.locator('text=Server edit')).toBeVisible();
    });

    test('should resolve conflicts by choosing local version', async ({ page, context }) => {
      // Set up conflict scenario (simplified)
      await context.setOffline(true);
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Local version');
      await page.click('button[type="submit"]');
      
      await context.setOffline(false);
      
      // Simulate conflict dialog
      await page.evaluate(() => {
        // Trigger conflict resolution UI
        window.dispatchEvent(new CustomEvent('sync-conflict', {
          detail: {
            local: { title: 'Local version' },
            remote: { title: 'Remote version' }
          }
        }));
      });
      
      // Choose local version
      await page.click('[data-testid="choose-local-version"]');
      
      // Should keep local version
      await expect(page.locator('text=Local version')).toBeVisible();
      await expect(page.locator('text=Remote version')).not.toBeVisible();
    });

    test('should resolve conflicts by choosing remote version', async ({ page, context }) => {
      // Similar setup but choose remote version
      await context.setOffline(true);
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Local version');
      await page.click('button[type="submit"]');
      
      await context.setOffline(false);
      
      // Simulate conflict
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('sync-conflict', {
          detail: {
            local: { title: 'Local version' },
            remote: { title: 'Remote version' }
          }
        }));
      });
      
      // Choose remote version
      await page.click('[data-testid="choose-remote-version"]');
      
      // Should use remote version
      await expect(page.locator('text=Remote version')).toBeVisible();
      await expect(page.locator('text=Local version')).not.toBeVisible();
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist offline data across page reloads', async ({ page, context }) => {
      // Go offline and create task
      await context.setOffline(true);
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Persistent task');
      await page.click('button[type="submit"]');
      
      // Reload page while offline
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Task should still be visible
      await expect(page.locator('text=Persistent task')).toBeVisible();
      await expect(page.locator('[data-testid="task-queued-indicator"]')).toBeVisible();
    });

    test('should maintain operation queue across page reloads', async ({ page, context }) => {
      // Create multiple operations offline
      await context.setOffline(true);
      
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Queue task 1');
      await page.click('button[type="submit"]');
      
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Queue task 2');
      await page.click('button[type="submit"]');
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Queue count should be maintained
      await expect(page.locator('[data-testid="queued-operations-count"]')).toHaveText('2');
    });
  });

  test.describe('Performance', () => {
    test('should handle large offline datasets efficiently', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);
      
      const startTime = Date.now();
      
      // Create many tasks offline
      for (let i = 1; i <= 50; i++) {
        await page.click('[data-testid="add-task-button"]');
        await page.fill('input[name="title"]', `Bulk task ${i}`);
        await page.click('button[type="submit"]');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (10 seconds for 50 tasks)
      expect(duration).toBeLessThan(10000);
      
      // All tasks should be visible
      await expect(page.locator('[data-testid="task-item"]')).toHaveCount(50);
    });

    test('should sync large datasets efficiently', async ({ page, context }) => {
      // Create many operations offline
      await context.setOffline(true);
      
      for (let i = 1; i <= 20; i++) {
        await page.click('[data-testid="add-task-button"]');
        await page.fill('input[name="title"]', `Sync task ${i}`);
        await page.click('button[type="submit"]');
      }
      
      // Come back online and measure sync time
      const startTime = Date.now();
      await context.setOffline(false);
      
      // Wait for sync to complete
      await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 30000 });
      
      const endTime = Date.now();
      const syncDuration = endTime - startTime;
      
      // Should sync within reasonable time (30 seconds for 20 operations)
      expect(syncDuration).toBeLessThan(30000);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle storage quota exceeded', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);
      
      // Mock storage quota exceeded error
      await page.evaluate(() => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('QuotaExceededError');
        };
      });
      
      // Try to create task
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Storage full task');
      await page.click('button[type="submit"]');
      
      // Should show storage error
      await expect(page.locator('[data-testid="storage-error"]')).toBeVisible();
      await expect(page.locator('text=Storage quota exceeded')).toBeVisible();
    });

    test('should handle corrupted offline data', async ({ page, context }) => {
      // Corrupt offline storage
      await page.evaluate(() => {
        localStorage.setItem('offline-tasks', 'invalid-json');
      });
      
      // Go offline and try to load
      await context.setOffline(true);
      await page.reload();
      
      // Should handle gracefully and show error
      await expect(page.locator('[data-testid="data-corruption-error"]')).toBeVisible();
      
      // Should offer to clear corrupted data
      await page.click('[data-testid="clear-corrupted-data"]');
      
      // Should recover and allow normal operation
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Recovery task');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Recovery task')).toBeVisible();
    });
  });
});