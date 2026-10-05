import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
const backendEnv = readFileSync(resolve('../backend/.env'), 'utf8');
if (
  !/^DATABASE_URL=['"]?jdbc:postgresql:\/\/(?:127\.0\.0\.1|localhost):5432\/hugamex['"]?$/m.test(
    backendEnv,
  ) ||
  !/^MAIL_MODE=['"]?file['"]?$/m.test(backendEnv)
)
  throw new Error(
    'Playwright fixtures require the local Docker database and MAIL_MODE=file. Do not run against Supabase or live SMTP.',
  );
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('../.tools/playwright');
export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'off', screenshot: 'off', headless: true },
  webServer: [
    { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
    { command: 'npm run dev:admin', url: 'http://127.0.0.1:5180', reuseExistingServer: true },
  ],
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
