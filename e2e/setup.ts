import { test as setup } from '@playwright/test';

// Global setup for all tests
setup('global setup', async ({ page }) => {
  // Any global setup can go here
  // For example, setting up test data, clearing cookies, etc.
  
  // Clear any existing cookies/localStorage
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

export {};