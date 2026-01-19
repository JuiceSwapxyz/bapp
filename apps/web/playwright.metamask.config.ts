import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import ms from 'ms'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  testDir: './src/playwright/metamask',
  testMatch: '**/*.spec.ts',
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  timeout: ms('5m'),
  expect: {
    timeout: ms('30s'),
  },
  use: {
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    baseURL: 'http://localhost:3001',
    headless: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: './test-results-metamask',
})
