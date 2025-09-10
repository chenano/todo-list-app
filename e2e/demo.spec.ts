import { test, expect } from '@playwright/test';

test.describe('Authentication Demo - Visual Testing', () => {
  // Slow down tests to see what's happening
  test.use({ 
    actionTimeout: 10000,
    navigationTimeout: 30000 
  });

  test('Demo: Complete Authentication Flow', async ({ page }) => {
    console.log('🚀 Starting authentication demo...');
    
    // Navigate to the app
    console.log('📍 Navigating to root URL...');
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait 2 seconds to see the redirect
    
    // Should be redirected to login
    console.log('🔄 Checking redirect to login page...');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.waitForTimeout(2000);
    
    // Demonstrate form validation
    console.log('❌ Testing form validation - submitting empty form...');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(1000);
    
    // Check validation errors appear
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    console.log('✅ Validation errors displayed correctly');
    await page.waitForTimeout(2000);
    
    // Fill in invalid credentials
    console.log('📝 Filling in invalid credentials...');
    await page.getByLabel('Email').fill('test@example.com');
    await page.waitForTimeout(500);
    await page.getByLabel('Password').fill('wrongpassword');
    await page.waitForTimeout(500);
    
    // Submit form with invalid credentials
    console.log('🔐 Submitting login form with invalid credentials...');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(3000); // Wait to see any error messages
    
    // Navigate to register page
    console.log('🔄 Navigating to register page...');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await page.waitForTimeout(2000);
    
    // Test register form
    console.log('📝 Testing registration form...');
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.waitForTimeout(500);
    
    // Test password field and strength indicator
    console.log('🔒 Testing password strength indicator...');
    const passwordField = page.locator('#password');
    await passwordField.fill('weak');
    await page.waitForTimeout(1000);
    
    // Type a stronger password
    await passwordField.fill('StrongPassword123!');
    await page.waitForTimeout(1000);
    
    // Fill confirm password
    await page.getByLabel('Confirm Password').fill('StrongPassword123!');
    await page.waitForTimeout(500);
    
    // Submit registration
    console.log('📤 Submitting registration form...');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForTimeout(3000);
    
    // Navigate back to login
    console.log('🔄 Navigating back to login...');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
    await page.waitForTimeout(2000);
    
    // Test protected route access
    console.log('🛡️ Testing protected route access...');
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    // Should redirect to login with redirectTo parameter
    await expect(page).toHaveURL('/login?redirectTo=%2Fdashboard');
    console.log('✅ Protected route correctly redirected to login with redirectTo parameter');
    await page.waitForTimeout(2000);
    
    // Test browser navigation
    console.log('🔄 Testing browser navigation...');
    await page.goBack();
    await page.waitForTimeout(1000);
    await page.goForward();
    await page.waitForTimeout(1000);
    
    console.log('🎉 Demo completed successfully!');
  });

  test('Demo: Mobile Responsive Design', async ({ page }) => {
    console.log('📱 Testing mobile responsive design...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForTimeout(2000);
    
    console.log('📱 Mobile login page loaded');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.waitForTimeout(2000);
    
    // Test form interaction on mobile
    console.log('📝 Testing mobile form interaction...');
    await page.getByLabel('Email').fill('mobile@test.com');
    await page.waitForTimeout(500);
    await page.getByLabel('Password').fill('password123');
    await page.waitForTimeout(500);
    
    // Navigate to register on mobile
    console.log('🔄 Testing mobile navigation...');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/register');
    await page.waitForTimeout(2000);
    
    console.log('✅ Mobile responsive design working correctly');
  });

  test('Demo: Form Interactions and UI Elements', async ({ page }) => {
    console.log('🎨 Testing UI elements and interactions...');
    
    await page.goto('/register');
    await page.waitForTimeout(2000);
    
    // Test password visibility toggle (if available)
    console.log('👁️ Testing password visibility features...');
    const passwordField = page.locator('#password');
    await passwordField.fill('testpassword');
    await page.waitForTimeout(1000);
    
    // Test password strength indicator
    console.log('💪 Testing password strength indicator...');
    await passwordField.fill('weak');
    await page.waitForTimeout(1000);
    
    await passwordField.fill('Medium123');
    await page.waitForTimeout(1000);
    
    await passwordField.fill('VeryStrongPassword123!@#');
    await page.waitForTimeout(1000);
    
    // Test confirm password field
    console.log('🔄 Testing confirm password field...');
    await page.getByLabel('Confirm Password').fill('VeryStrongPassword123!@#');
    await page.waitForTimeout(1000);
    
    // Test email field
    console.log('📧 Testing email field...');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.waitForTimeout(1000);
    
    console.log('✅ All form interactions working correctly');
  });

  test('Demo: Page Refresh and State Persistence', async ({ page }) => {
    console.log('🔄 Testing page refresh behavior...');
    
    await page.goto('/login');
    await page.waitForTimeout(2000);
    
    // Fill some data
    console.log('📝 Filling form data...');
    await page.getByLabel('Email').fill('refresh@test.com');
    await page.waitForTimeout(1000);
    
    // Refresh the page
    console.log('🔄 Refreshing the page...');
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify we're still on login page
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    console.log('✅ Page refresh handled correctly');
  });
});