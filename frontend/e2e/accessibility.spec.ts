import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Public pages meet automated WCAG A/AA checks at desktop and mobile widths', async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/lien-he', '/dang-ky', '/tin-tuc']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForLoadState('networkidle');
      if (path === '/') {
        await page.locator('.hero').hover();
        await expect(page.locator('.hero-copy > div').nth(1)).toHaveCSS('opacity', '1');
      }
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        `${path} at ${width}px`,
      ).toEqual([]);
    }
  }
});
