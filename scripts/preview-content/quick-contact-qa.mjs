// Read-only supplement for Google Maps directions in the public contact popover.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "../../frontend/node_modules/@axe-core/playwright/dist/index.mjs";
const root = resolve(import.meta.dirname, "../..");
process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(root, ".tools/playwright");
const { chromium } =
  await import("../../frontend/node_modules/playwright/index.mjs");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
const directory = resolve(root, "docs/qa/public-refinement");
mkdirSync(directory, { recursive: true });
const report = [];
try {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("http://127.0.0.1:5173/lien-he");
    const trigger = page.getByRole("button", {
      name: "Mở liên hệ nhanh",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Liên hệ HUGAMEX",
      exact: true,
    });
    await dialog.waitFor();
    const directions = new URL(
      await dialog
        .getByRole("link", { name: "Đường đến trụ sở chính", exact: true })
        .getAttribute("href"),
    );
    if (
      !directions.searchParams
        .get("destination")
        .includes("636–638 Nguyễn Duy, Phường Phú Định")
    )
      throw new Error("Directions mismatch");
    const scan = await new AxeBuilder({ page }).analyze();
    if (scan.violations.length)
      throw new Error("Quick contact accessibility failed");
    await page.screenshot({
      path: resolve(directory, `quick-contact-${width}.png`),
    });
    const box = await dialog.boundingBox();
    if (
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.width > width + 1 ||
      box.y + box.height > 900
    )
      throw new Error("Quick contact overflow");
    await page.keyboard.press("Escape");
    if (!(await trigger.evaluate((node) => node === document.activeElement)))
      throw new Error("Focus restoration failed");
    report.push({
      width,
      directions: "head office",
      violations: 0,
      overflow: false,
      escapeRestoresFocus: true,
    });
  }
  writeFileSync(
    resolve(directory, "quick-contact-report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify({ quickContact: report }));
} finally {
  await browser.close();
}
