import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Automated Accessibility Tests', () => {
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

  test.describe('Page-Level Accessibility', () => {
    test('should pass accessibility audit on dashboard', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility audit on analytics page', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility audit on search page', async ({ page }) => {
      await page.goto('/dashboard/search');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Component-Level Accessibility', () => {
    test('should pass accessibility audit for task form', async ({ page }) => {
      await page.click('[data-testid="add-task-button"]');
      await page.waitForSelector('[data-testid="task-form"]');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="task-form"]')
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility audit for search dialog', async ({ page }) => {
      await page.keyboard.press('Control+k');
      await page.waitForSelector('[data-testid="search-dialog"]');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="search-dialog"]')
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});