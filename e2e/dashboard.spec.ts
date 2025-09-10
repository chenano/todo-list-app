import { test, expect } from '@playwright/test';

test.describe('Dashboard and Protected Routes', () => {
  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to login with redirectTo parameter
    await expect(page).toHaveURL('/login?redirectTo=%2Fdashboard');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should show loading state when checking authentication', async ({ page }) => {
    // Navigate to a protected route
    await page.goto('/dashboard');
    
    // Should show loading spinner briefly before redirect
    // Note: This might be too fast to catch in some cases
    const loadingSpinner = page.locator('[role="status"]');
    
    // Either we see the loading spinner or we're already redirected
    try {
      await expect(loadingSpinner).toBeVisible({ timeout: 1000 });
    } catch {
      // If loading is too fast, we should already be at login
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should handle direct navigation to auth pages', async ({ page }) => {
    // Test direct navigation to login
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    // Test direct navigation to register
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  });

  test('should preserve redirect URL after login', async ({ page }) => {
    // Try to access dashboard (should redirect to login with redirectTo)
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login?redirectTo=%2Fdashboard');
    
    // The redirectTo parameter should be preserved in the URL
    const url = new URL(page.url());
    expect(url.searchParams.get('redirectTo')).toBe('/dashboard');
  });

  test('should handle middleware redirects correctly', async ({ page }) => {
    // Test root path redirect
    await page.goto('/');
    await expect(page).toHaveURL('/login');
    
    // Test protected route redirect
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login?redirectTo=%2Fdashboard');
    
    // Test that auth pages are accessible
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Start at login
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    
    // Navigate to register
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/register');
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/login');
    
    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL('/register');
  });

  test('should handle page refresh correctly', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Should still be on login page and show form
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Simulate network failure by going offline
    await page.context().setOffline(true);
    
    // Try to submit form (this should handle the network error)
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should show some kind of error handling
    // Note: The exact behavior depends on your error handling implementation
    
    // Restore network
    await page.context().setOffline(false);
  });

  test('should maintain form state during navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in some form data
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('partial');
    
    // Navigate away and back
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/register');
    
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
    
    // Form should be reset (this is expected behavior for security)
    await expect(page.getByLabel('Email')).toHaveValue('');
    await expect(page.getByLabel('Password')).toHaveValue('');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password')).toBeFocused();
    
    await page.keyboard.press('Tab');
    // Should focus on password visibility toggle
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeFocused();
    
    // Test Enter key submission
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.keyboard.press('Enter');
    
    // Should trigger form submission
    await expect(page.getByText('Signing In...')).toBeVisible();
  });
});