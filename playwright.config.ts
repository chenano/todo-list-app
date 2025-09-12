import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },

    /* Performance testing project */
    {
      name: 'performance',
      testMatch: '**/performance-benchmarks.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      timeout: 60000, // Longer timeout for performance tests
    },

    /* Visual regression testing project */
    {
      name: 'visual-regression',
      testMatch: '**/visual-regression.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },

    /* Accessibility testing project */
    {
      name: 'accessibility',
      testMatch: '**/accessibility-automation.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    /* Cross-browser testing project */
    {
      name: 'cross-browser',
      testMatch: '**/cross-browser.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },

  /* Global test timeout */
  timeout: 30 * 1000, // 30 seconds

  /* Expect timeout for assertions */
  expect: {
    timeout: 10 * 1000, // 10 seconds
    // Animation handling
    toHaveScreenshot: {
      threshold: 0.2,
      animations: 'disabled',
    },
  },

  /* Test output directory */
  outputDir: 'test-results/',

  /* Global setup and teardown */
  globalSetup: require.resolve('./e2e/setup.ts'),
});