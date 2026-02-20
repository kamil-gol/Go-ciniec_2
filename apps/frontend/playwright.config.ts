import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Configuration for Rezerwacje System
 * 
 * See https://playwright.dev/docs/test-configuration
 * 
 * On Alpine Linux (Docker), set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
 */

const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : 4,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Maximum time each action can take */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },
  
  /* Global timeout for each test */
  timeout: 30000,
  
  /* Timeout for expect() assertions */
  expect: {
    timeout: 5000,
  },
  
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Use system Chromium when PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is set (Alpine/Docker)
        ...(chromiumExecutable ? {
          launchOptions: {
            executablePath: chromiumExecutable,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
            ],
          },
        } : {}),
      },
    },
    
    // Firefox & WebKit only when NOT using system Chromium (i.e., not in Docker Alpine)
    ...(!chromiumExecutable ? [
      {
        name: 'firefox',
        use: { 
          ...devices['Desktop Firefox'],
          viewport: { width: 1920, height: 1080 },
        },
      },
      {
        name: 'webkit',
        timeout: 60000,
        use: { 
          ...devices['Desktop Safari'],
          viewport: { width: 1920, height: 1080 },
          navigationTimeout: 45000,
        },
      },
      {
        name: 'mobile-chrome',
        timeout: 60000,
        use: { 
          ...devices['Pixel 5'],
        },
      },
      {
        name: 'mobile-safari',
        timeout: 60000,
        use: { 
          ...devices['iPhone 12'],
          navigationTimeout: 45000,
        },
      },
    ] : []),
  ],
  
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
