import process from 'node:process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const toolRequire = createRequire(resolve('../.tools/lighthouse/package.json'));
const { default: lighthouse } = await import(pathToFileURL(toolRequire.resolve('lighthouse')).href);
const { launch } = await import(pathToFileURL(toolRequire.resolve('chrome-launcher')).href);
process.env.PLAYWRIGHT_BROWSERS_PATH = resolve('../.tools/playwright');
mkdirSync('../docs/qa', { recursive: true });
const { chromium } = await import('@playwright/test');
const chromePath = chromium.executablePath();
if (!existsSync(chromePath))
  throw new Error(
    'Set chromePath for your platform using the installed Playwright Chromium binary.',
  );
const chrome = await launch({ chromePath, chromeFlags: ['--headless', '--disable-gpu'] });
try {
  const summaries = [];
  for (const desktop of [false, true]) {
    const name = desktop ? 'desktop' : 'mobile';
    const result = await lighthouse('http://127.0.0.1:4173/', {
      port: chrome.port,
      output: ['html'],
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      ...(desktop
        ? {
            formFactor: 'desktop',
            screenEmulation: {
              mobile: false,
              width: 1440,
              height: 1000,
              deviceScaleFactor: 1,
              disabled: false,
            },
            throttlingMethod: 'provided',
          }
        : {}),
    });
    if (!result) throw new Error('Lighthouse did not return a report.');
    writeFileSync(`../docs/qa/lighthouse-${name}.html`, result.report[0]);
    const scores = Object.fromEntries(
      Object.entries(result.lhr.categories).map(([key, value]) => [
        key,
        Math.round((value.score || 0) * 100),
      ]),
    );
    const metrics = Object.fromEntries(
      [
        'first-contentful-paint',
        'largest-contentful-paint',
        'total-blocking-time',
        'cumulative-layout-shift',
      ].map((key) => [key, result.lhr.audits[key].displayValue]),
    );
    summaries.push({
      viewport: name,
      scores,
      metrics,
      runtimeError: result.lhr.runtimeError || null,
      warnings: result.lhr.runWarnings,
      failedAudits: Object.entries(result.lhr.audits)
        .filter(([, audit]) => audit.score !== null && audit.score < 1)
        .map(([id, audit]) => ({
          id,
          title: audit.title,
          ...(['errors-in-console', 'inspector-issues'].includes(id)
            ? { details: audit.details }
            : {}),
        })),
    });
  }
  writeFileSync('../docs/qa/lighthouse-summary.json', JSON.stringify(summaries, null, 2));
  process.stdout.write(
    JSON.stringify(
      summaries.map(({ viewport, scores, metrics }) => ({ viewport, scores, metrics })),
      null,
      2,
    ),
  );
} finally {
  await chrome.kill();
}
