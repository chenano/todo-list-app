import { test, expect } from '@playwright/test';

test.describe('Basic Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Navigate to root
    await page.goto('/');
    
    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check main elements
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Check navigation link
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible();
  });

  test('should display register page correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Check main elements
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    
    // Check navigation link
    await expect(page.getByText('Already have an account?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/login');
    
    // Navigate to register
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    
    // Navigate back to login
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should redirect protected routes to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to login with redirectTo parameter
    await expect(page).toHaveURL('/login?redirectTo=%2Fdashboard');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should show form validation errors', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should handle form submission with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should show loading state or error (depending on Supabase configuration)
    // Since we don't have real Supabase setup, we just verify the form was submitted
    // In a real environment, this would show an authentication error
    
    // The form should remain on the login page (not redirect)
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    // Should display properly on mobile
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should handle page refresh correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Should still show login page
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should handle browser navigation', async ({ page }) => {
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
});