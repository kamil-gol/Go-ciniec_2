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
  testDir: './e2e/specs',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,

  /* Run 2 workers on CI for faster execution (~50% speedup) */
  workers: process.env.CI ? 2 : 4,
  
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
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },

  /* Directory for visual regression snapshots */
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  
  /* Configure projects for major browsers */
  projects: [
    // ── Auth setup — logs in once, saves storageState ──
    {
      name: 'setup',
      testDir: './e2e',
      testMatch: /auth\.setup\.ts/,
    },

    // ── Auth tests — run WITHOUT storageState (tests login itself) ──
    {
      name: 'no-auth',
      testMatch: /01-auth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        ...(chromiumExecutable ? {
          launchOptions: {
            executablePath: chromiumExecutable,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
          },
        } : {}),
      },
      // No dependencies, no storageState — starts fresh
    },

    // ── Main browser — pre-authenticated via storageState ──
    {
      name: 'chromium',
      testIgnore: /01-auth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        storageState: 'e2e/.auth/admin.json',
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
      dependencies: ['setup'],
    },

    // Firefox & WebKit only when NOT using system Chromium (i.e., not in Docker Alpine)
    ...(!chromiumExecutable ? [
      {
        name: 'firefox',
        testIgnore: /01-auth\.spec\.ts/,
        use: {
          ...devices['Desktop Firefox'],
          viewport: { width: 1920, height: 1080 },
          storageState: 'e2e/.auth/admin.json',
        },
        dependencies: ['setup'],
      },
      {
        name: 'webkit',
        timeout: 60000,
        testIgnore: /01-auth\.spec\.ts/,
        use: {
          ...devices['Desktop Safari'],
          viewport: { width: 1920, height: 1080 },
          navigationTimeout: 45000,
          storageState: 'e2e/.auth/admin.json',
        },
        dependencies: ['setup'],
      },
      {
        name: 'mobile-chrome',
        timeout: 60000,
        testIgnore: /01-auth\.spec\.ts/,
        use: {
          ...devices['Pixel 5'],
          storageState: 'e2e/.auth/admin.json',
        },
        dependencies: ['setup'],
      },
      {
        name: 'mobile-safari',
        timeout: 60000,
        testIgnore: /01-auth\.spec\.ts/,
        use: {
          ...devices['iPhone 12'],
          navigationTimeout: 45000,
          storageState: 'e2e/.auth/admin.json',
        },
        dependencies: ['setup'],
      },
    ] : []),
  ],
  
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
