import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
const target = JSON.parse(readFileSync(resolve('../.local/isolated-qa-target.json'), 'utf8'));
if (
  process.env.HUGAMEX_ISOLATED_QA !== 'true' ||
  target.database !== 'jdbc:postgresql://127.0.0.1:5432/hugamex' ||
  target.mailMode !== 'file' ||
  target.backend !== 'http://127.0.0.1:8082'
)
  throw new Error('The isolated E2E suite requires the controlled Docker/mail-file runner.');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('../.tools/playwright');
export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5176', trace: 'off', screenshot: 'off', headless: true },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
