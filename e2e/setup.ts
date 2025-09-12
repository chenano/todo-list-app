import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Global setup for all tests
  console.log('Running global setup...');
  
  // You can add any global setup here
  // For example, setting up test data, starting services, etc.
  
  return async () => {
    // Global teardown
    console.log('Running global teardown...');
  };
}

export default globalSetup;