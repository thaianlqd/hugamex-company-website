// Read-only QA for the client's headquarters/catalog/editorial follow-up.
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "../../frontend/node_modules/@axe-core/playwright/dist/index.mjs";
const root = resolve(import.meta.dirname, "../..");
process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(root, ".tools/playwright");
const { chromium } =
  await import("../../frontend/node_modules/playwright/index.mjs");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
const dir = resolve(root, "docs/qa/public-refinement");
mkdirSync(dir, { recursive: true });
const report = {
  checkedAt: new Date().toISOString(),
  layouts: [],
  accessibility: [],
  interactions: [],
  pageErrors: [],
  mutationsBlocked: 0,
  maps: [],
};
page.on("pageerror", (error) => report.pageErrors.push(error.name));
await context.route("**/api/v1/**", (route) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(route.request().method()) &&
    !/\/auth\/(csrf|refresh|logout)(\?|$)/.test(route.request().url())
  ) {
    report.mutationsBlocked++;
    return route.abort();
  }
  return route.continue();
});
const assert = (value, message) => {
  if (!value) throw new Error(message);
};
const go = async (path) => {
  await page.goto("http://127.0.0.1:5173" + path);
  await page.locator("h1").waitFor();
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
};
const scan = async (name) => {
  const result = await new AxeBuilder({ page }).analyze();
  const violations = result.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    targets: v.nodes.map((n) => n.target),
  }));
  report.accessibility.push({ name, violations });
  assert(!violations.length, "Accessibility violations: " + name);
};
const shot = async (name) => {
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForLoadState("networkidle");
  await page.evaluate(() =>
    Promise.all(
      [...document.images].map((image) => image.decode().catch(() => {})),
    ),
  );
  await page.screenshot({ path: resolve(dir, name + ".png"), fullPage: true });
};
try {
  for (const width of [375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [path, name] of [
      ["/", "home"],
      ["/san-pham", "products"],
      ["/he-thong", "network"],
      ["/lien-he", "contact"],
      ["/tin-tuc/chuan-bi-yeu-cau-hop-tac", "article"],
    ]) {
      await go(path);
      assert(
        !(await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )),
        "Overflow: " + name + "-" + width,
      );
      report.layouts.push({ name, width, overflow: false });
      if ([390, 1440].includes(width)) {
        await shot(name + "-" + width);
        await scan(name + "-" + width);
      }
      if (name === "network" || name === "contact") {
        assert(
          (
            await page
              .locator(".headquarters-address, .contact-office-address")
              .innerText()
          ).includes("636–638 Nguyễn Duy, Phường Phú Định"),
          "Head office address mismatch",
        );
        const url = await page
          .locator(".location-map iframe")
          .first()
          .getAttribute("src");
        assert(
          new URL(url).searchParams.get("q").includes("636–638 Nguyễn Duy"),
          "Map query mismatch",
        );
      }
      if (name === "home" && width >= 768) {
        const aligned = await page
          .locator(".product-grid .content-card")
          .evaluateAll((cards) => {
            const rows = new Map();
            for (const card of cards) {
              const box = card.getBoundingClientRect();
              const key = Math.round(box.top);
              const row = rows.get(key) || [];
              row.push({
                bottom: box.bottom,
                action: card
                  .querySelector(".card-action")
                  .getBoundingClientRect().top,
              });
              rows.set(key, row);
            }
            return [...rows.values()].every(
              (row) =>
                Math.max(...row.map((x) => x.bottom)) -
                  Math.min(...row.map((x) => x.bottom)) <
                  2 &&
                Math.max(...row.map((x) => x.action)) -
                  Math.min(...row.map((x) => x.action)) <
                  2,
            );
          });
        assert(aligned, "Product card row alignment failed");
      }
    }
  }
  await go("/san-pham");
  assert(
    (await page.locator(".catalog-grid .content-card").count()) === 7,
    "Expected seven products",
  );
  await page
    .getByRole("searchbox", { name: "Tìm kiếm sản phẩm", exact: true })
    .fill("so mi");
  assert(
    (await page.locator(".catalog-grid .content-card").count()) === 1,
    "Accent-insensitive search failed",
  );
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  const group = page.getByRole("combobox", {
    name: "Nhóm sản phẩm",
    exact: true,
  });
  const option = await group.locator("option").nth(2).getAttribute("value");
  await group.selectOption(option);
  await page.waitForLoadState("networkidle");
  const filtered = await (
    await context.request.get(
      "http://127.0.0.1:5173/api/v1/public/products?locale=vi&category=" +
        option,
    )
  ).json();
  assert(
    (await page.locator(".catalog-grid .content-card").count()) ===
      filtered.total,
    "Group filter failed",
  );
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("combobox", { name: "Sắp xếp", exact: true })
    .selectOption("az");
  const titles = await page.locator(".catalog-grid h3").allTextContents();
  assert(
    JSON.stringify(titles) ===
      JSON.stringify([...titles].sort((a, b) => a.localeCompare(b, "vi"))),
    "Name sort failed",
  );
  await page
    .getByRole("searchbox", { name: "Tìm kiếm sản phẩm", exact: true })
    .fill("khongcotukhoa123");
  await page
    .getByRole("button", { name: "Xem tất cả sản phẩm", exact: true })
    .click();
  assert(
    (await page.locator(".catalog-grid .content-card").count()) === 7,
    "Empty-state reset failed",
  );
  report.interactions.push(
    "product search / group / sort / clear / empty-state reset",
  );
  await go("/he-thong");
  await page
    .getByRole("searchbox", { name: "Tìm cơ sở sản xuất", exact: true })
    .fill("sa dec");
  assert(
    (await page.locator(".factory-network-item").count()) === 1,
    "Facility search failed",
  );
  assert(
    (await page.locator(".headquarters").count()) === 1,
    "Search hid headquarters",
  );
  report.interactions.push("facility search keeps separate headquarters");
  await go("/tin-tuc/chuan-bi-yeu-cau-hop-tac");
  assert(
    (await page.locator(".editorial-toc > a").count()) === 6,
    "Expected expanded article contents",
  );
  assert(
    (await page.locator(".editorial-prose li").count()) >= 5,
    "Expected practical checklist",
  );
  await page.locator(".editorial-toc > a").nth(3).click();
  const id = new URL(page.url()).hash;
  assert(id.startsWith("#article-section-"), "TOC did not navigate");
  assert(
    (await page.locator(id).boundingBox()).y >= 103,
    "Sticky header obscures article anchor",
  );
  report.interactions.push("article TOC / checklist / anchor offset");
  await page
    .getByRole("button", { name: "Change language", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Article contents", exact: true })
    .waitFor();
  assert(
    (await page.locator(".editorial-toc > a").count()) === 6,
    "English article missing",
  );
  report.interactions.push("expanded English article");
  await go("/lien-he");
  const frame = page
    .frames()
    .find((frame) => frame.url().startsWith("https://www.google.com/maps"));
  const mapState = frame
    ? await frame.evaluate(() => ({
        loaded: document.readyState === "complete",
        hasMap: !!document.querySelector(".gm-style"),
        text: document.body.innerText.slice(0, 300),
      }))
    : null;
  report.maps.push({
    externalFrameLoaded: !!mapState?.loaded,
    hasMap: !!mapState?.hasMap,
    frameCount: page.frames().length,
  });
  assert(mapState?.hasMap, "Google map did not render");
  assert(
    !report.pageErrors.length && !report.mutationsBlocked,
    "Unexpected page error or attempted business mutation",
  );
  rmSync(resolve(dir, "failed-report.json"), { force: true });
  writeFileSync(
    resolve(dir, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      layouts: report.layouts.length,
      axeScreens: report.accessibility.length,
      violations: 0,
      interactions: report.interactions,
      maps: report.maps,
      pageErrors: 0,
      businessWrites: 0,
    }),
  );
} catch (error) {
  writeFileSync(
    resolve(dir, "failed-report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  throw error;
} finally {
  await browser.close();
}
