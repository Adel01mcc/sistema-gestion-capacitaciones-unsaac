import { defineConfig } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Chrome creates a temporary profile. Keep it on the project drive because
// the host system drive may have no free space.
const browserTemp = resolve('.verification/browser-tmp');
mkdirSync(browserTemp, { recursive: true });
process.env.TEMP = browserTemp;
process.env.TMP = browserTemp;

export default defineConfig({
  testDir: './tests',
  testMatch: 'ui.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  outputDir: '.verification/playwright',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3101',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-e2e.js',
    url: 'http://127.0.0.1:3101/api/health',
    timeout: 60_000,
    reuseExistingServer: false,
    env: { TEMP: browserTemp, TMP: browserTemp },
  },
});
