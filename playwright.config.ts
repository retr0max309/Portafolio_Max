import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { getTestDatabaseUrl } from './scripts/test-database';

if (existsSync(resolve('.env'))) process.loadEnvFile(resolve('.env'));
const testDatabaseUrl = getTestDatabaseUrl();
const apiPort = Number(process.env.E2E_API_PORT || 3001);
const webPort = Number(process.env.E2E_WEB_PORT || 3000);
const localChrome = process.platform === 'win32' && existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: `http://localhost:${webPort}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: localChrome ? { executablePath: localChrome } : undefined } }],
  webServer: [
    {
      command: 'npm run dev:api',
      url: `http://127.0.0.1:${apiPort}/api/health`,
      reuseExistingServer: false,
      env: { DATABASE_PROVIDER: 'postgres', DATABASE_URL: testDatabaseUrl, PORT: String(apiPort) },
      timeout: 60000,
    },
    {
      command: process.env.E2E_USE_PRODUCTION_WEB ? 'npm run start -w @portafolio/web' : 'npm run dev:web',
      url: `http://localhost:${webPort}`,
      reuseExistingServer: false,
      env: { API_INTERNAL_URL: `http://127.0.0.1:${apiPort}`, PORT: String(webPort) },
      timeout: 90000,
    },
  ],
  globalSetup: './tests/e2e/global-setup.ts',
});
