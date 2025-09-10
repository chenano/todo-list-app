import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should redirect unauthenticated users from root to login', async ({ page }) => {
    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
    
    // Should show login form
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check page title and form elements
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText('Enter your email and password to access your account')).toBeVisible();
    
    // Check form fields
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    
    // Check password visibility toggle (SVG icon)
    await expect(page.locator('svg.lucide-eye').first()).toBeVisible();
    
    // Check submit button
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Check switch to register link
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible();
  });

  test('should display register page correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Check page title and form elements
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByText('Enter your information to create a new account')).toBeVisible();
    
    // Check form fields
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    
    // Check password visibility toggles (SVG icons)
    const eyeIcons = page.locator('svg.lucide-eye');
    await expect(eyeIcons).toHaveCount(2);
    
    // Check submit button
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    
    // Check switch to login link
    await expect(page.getByText('Already have an account?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/login');
    
    // Click "Sign up" to go to register
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    
    // Click "Sign in" to go back to login
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should show form validation errors on login', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should show validation errors (these will appear based on the form validation)
    // Note: The exact error messages depend on your validation schema
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('should show form validation errors on register', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('should toggle password visibility on login', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('#password');
    const toggleButton = page.locator('button').filter({ has: page.locator('svg.lucide-eye') }).first();
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should toggle password visibility on register', async ({ page }) => {
    await page.goto('/register');
    
    const passwordInput = page.locator('#password');
    const confirmPasswordInput = page.locator('#confirmPassword');
    const toggleButtons = page.locator('button').filter({ has: page.locator('svg.lucide-eye') });
    
    // Initially passwords should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    
    // Click first toggle (password field)
    await toggleButtons.first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click second toggle (confirm password field)
    await toggleButtons.last().click();
    await expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });

  test('should show password strength indicator on register', async ({ page }) => {
    await page.goto('/register');
    
    const passwordInput = page.locator('#password');
    
    // Type a weak password
    await passwordInput.fill('123');
    
    // Should show password strength indicator
    await expect(page.locator('text=At least 8 characters')).toBeVisible();
    await expect(page.locator('text=One lowercase letter')).toBeVisible();
    await expect(page.locator('text=One uppercase letter')).toBeVisible();
    await expect(page.locator('text=One number')).toBeVisible();
    
    // Type a stronger password
    await passwordInput.fill('StrongPass123!');
    
    // Should show improved strength (green indicators)
    // Note: The exact implementation depends on your password strength component
  });

  test('should redirect to dashboard when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to login with redirectTo parameter
    await expect(page).toHaveURL('/login?redirectTo=%2Fdashboard');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should handle invalid login attempt', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should show loading state briefly
    await expect(page.getByText('Signing In...')).toBeVisible();
    
    // Should show error message (this will depend on your Supabase setup)
    // Note: Since we don't have real Supabase credentials, this will show an error
    await expect(page.locator('[class*="text-red"]')).toBeVisible();
  });

  test('should handle registration attempt', async ({ page }) => {
    await page.goto('/register');
    
    // Fill in registration form
    await page.getByLabel('Email').fill('test@example.com');
    await page.locator('#password').fill('StrongPassword123!');
    await page.getByLabel('Confirm Password').fill('StrongPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Should show loading state briefly
    await expect(page.getByText('Creating Account...')).toBeVisible();
    
    // Should show error or success message (depends on Supabase setup)
    // Note: Since we don't have real Supabase credentials, this will show an error
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    // Should still show all elements properly on mobile
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Form should be properly sized for mobile
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });
});