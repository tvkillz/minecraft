import { defineConfig, devices } from '@playwright/test'

/**
 * Landing: visual snapshots (public).
 * Portal: visual smoke with auth via storageState (setup project).
 *
 * Credentials: copy ui-tests/.env.example → ui-tests/.env
 * Servers: voidborn :3100, komorebi/iyashikei :3102 (auth must be enabled for portal).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 120_000,
  use: {
    trace: 'on-first-retry',
    actionTimeout: 30_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 180_000,
    },
    {
      name: 'landing',
      testMatch: /landing\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'landing-firefox',
      testMatch: /landing\/.*\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'portal',
      testMatch: /portal\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
