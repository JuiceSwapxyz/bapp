import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'

/**
 * Playwright configuration for MetaMask E2E tests
 * Uses Synpress for MetaMask integration
 */
export default defineConfig({
  testDir: './src/playwright/metamask',

  // Disabled for wallet state consistency
  fullyParallel: false,

  // Fail on CI if test.only is left in
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Single worker for wallet consistency
  workers: 1,

  reporter: [['html', { outputFolder: 'playwright-metamask-report' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use headed mode for MetaMask interaction
        headless: false,
      },
    },
  ],

  // Global timeout for each test
  timeout: 120 * 1000, // 120 seconds per test (longer for cross-chain)

  expect: {
    timeout: 15 * 1000, // 15 seconds for assertions
  },

  // Snapshot settings
  snapshotDir: './src/playwright/metamask/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',
})
