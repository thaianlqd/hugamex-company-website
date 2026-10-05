// Read-only public QA. No Supabase login, account mutations, or SMTP.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "../../frontend/node_modules/@axe-core/playwright/dist/index.mjs";
const root = resolve(import.meta.dirname, "../..");
process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(root, ".tools/playwright");
const { chromium } =
  await import("../../frontend/node_modules/playwright/index.mjs");
const { expect } =
  await import("../../frontend/node_modules/@playwright/test/index.mjs");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
const dir = resolve(root, "docs/qa/brand");
mkdirSync(dir, { recursive: true });
const report = {
  checkedAt: new Date().toISOString(),
  layouts: [],
  accessibility: [],
  interactions: [],
  pageErrors: [],
  images: [],
  mutationsBlocked: 0,
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
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
};
const scan = async (name) => {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const violations = result.violations.map((v) => ({
    id: v.id,
    targets: v.nodes.map((n) => n.target),
  }));
  report.accessibility.push({ name, violations });
  assert(
    !violations.length,
    "Accessibility " + name + " " + JSON.stringify(violations),
  );
};
const shot = async (name) => {
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(30);
  }
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.locator("#main img").evaluateAll((images) =>
    images.forEach((image) => {
      image.loading = "eager";
    }),
  );
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("#main img")].every(
        (image) => image.complete,
      ),
    {},
    { timeout: 20000 },
  );
  const images = await page.locator("#main img").evaluateAll((images) =>
    images.map((image) => ({
      src: image.getAttribute("src"),
      alt: !!image.alt,
      loaded: image.complete && image.naturalWidth > 0,
      fallback: image.getAttribute("data-fallback") === "true",
    })),
  );
  report.images.push({ name, images });
  assert(
    images.every((image) => image.loaded),
    "Image failure " + name,
  );
  await page.evaluate(() => {
    document.activeElement?.blur();
    scrollTo(0, 0);
  });
  await page.screenshot({ path: resolve(dir, name + ".png"), fullPage: true });
  if (name.startsWith("home-")) {
    await page.screenshot({ path: resolve(dir, name + "-viewport.png") });
    for (const section of [
      "brand-production",
      "home-categories",
      "home-customers",
    ])
      await page.locator("." + section).screenshot({
        path: resolve(dir, name + "-" + section + ".png"),
        style:
          ".site-header,.skip,.floating-contact{visibility:hidden!important}",
      });
  }
};
try {
  const pages = [
    ["/", "home"],
    ["/gioi-thieu", "about"],
    ["/san-pham", "products"],
    ["/he-thong", "network"],
    ["/doi-tac", "customers"],
    ["/chung-nhan", "quality"],
    ["/tin-tuc", "news"],
    ["/lien-he", "contact"],
  ];
  for (const width of [375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [path, name] of pages) {
      await go(path);
      assert(
        !(await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )),
        "Overflow " + name + " " + width,
      );
      report.layouts.push({ name, width, overflow: false });
      writeFileSync(
        resolve(dir, "report.json"),
        JSON.stringify(report, null, 2),
      );
      console.log("Checked " + name + " " + width);
      if (["network", "contact"].includes(name)) {
        const map = await page
          .locator(".location-map iframe")
          .first()
          .getAttribute("src");
        assert(
          new URL(map).searchParams.get("q").includes("636–638 Nguyễn Duy"),
          "Head office map",
        );
      }
      if ([390, 1440].includes(width)) {
        await shot(name + "-" + width);
        await scan(name + "-" + width);
      }
    }
  }
  await go("/san-pham");
  const initial = await page.locator(".catalog-grid .content-card").count();
  assert(initial === 11, "Expected 11 products, got " + initial);
  assert(
    (await page.locator(".catalog-category").count()) === 7,
    "Seven category groups",
  );
  const searchResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname.endsWith("/public/products") &&
      url.searchParams.get("search") === "so mi"
    );
  });
  await page
    .getByRole("searchbox", { name: "Tìm kiếm sản phẩm", exact: true })
    .fill("so mi");
  const searched = await (await searchResponse).json();
  assert(
    searched.total === 1 && searched.items[0].title === "Sơ mi",
    "API accent search",
  );
  await expect(page.locator(".catalog-grid .content-card")).toHaveCount(1, {
    timeout: 15000,
  });
  assert(
    (await page.locator(".catalog-grid .content-card").count()) === 1,
    "Server accent-insensitive search",
  );
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.locator(".catalog-grid .content-card")).toHaveCount(11, {
    timeout: 15000,
  });
  await page.locator(".category-feature").first().click();
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  assert(
    new URL(page.url()).searchParams.has("category"),
    "Category deep link",
  );
  await expect(page.locator(".catalog-category")).toHaveCount(1, {
    timeout: 15000,
  });
  await page.locator(".catalog-grid .content-card a").first().click();
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await expect(page.locator(".product-category-trail a").nth(1)).toBeVisible({
    timeout: 15000,
  });
  await shot("product-detail-1440");
  await scan("product-detail");
  report.interactions.push(
    "Category deep link → filtered group → product category trail; API search without accents",
  );
  await go("/doi-tac");
  for (const name of [
    "Columbia Sportswear",
    "Toray Group",
    "L.L.Bean",
    "Lufian",
    "Lacoste",
    "Talbots",
  ])
    assert(
      (await page.locator(".customer-names").innerText()).includes(name),
      "Customer " + name,
    );
  for (const percent of ["40%", "36%", "24%"])
    assert(
      (await page.locator(".composition").innerText()).includes(percent),
      "Composition " + percent,
    );
  report.interactions.push(
    "Six historical customer names and 2022 composition 40/36/24",
  );
  await go("/chung-nhan");
  const quality = await page.locator(".quality-records").innerText();
  for (const text of [
    "Arch of Europe",
    "GQM",
    "2006",
    "2007",
    "SA 8000",
    "ISO 9001:2000",
  ])
    assert(quality.includes(text), "Quality " + text);
  await go("/gioi-thieu");
  const about = await page.locator(".corporate-body").innerText();
  for (const text of [
    "3.000",
    "2.800",
    "1.300",
    "600",
    "550",
    "1.200",
    "1.100",
    "1.000",
    "4 phân xưởng",
  ])
    assert(about.includes(text), "Legacy " + text);
  report.interactions.push(
    "Legacy factory snapshot and certificates/awards with historical context",
  );
  await go("/tin-tuc/chuan-bi-yeu-cau-hop-tac");
  await shot("article-1440");
  await scan("article-desktop");
  await page.setViewportSize({ width: 390, height: 1000 });
  await shot("article-390");
  await scan("article-mobile");
  await go("/");
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  assert(await page.locator("dialog").isVisible(), "Mobile menu");
  await page.keyboard.press("Escape");
  assert(!(await page.locator("dialog").isVisible()), "Escape closes menu");
  await page
    .getByRole("button", { name: "Change language", exact: true })
    .click();
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  assert(
    (await page.locator("h1").innerText()).includes("Thoughtfully"),
    "English hero",
  );
  await go("/doi-tac");
  assert(
    (await page.locator(".composition").innerText()).includes("2022"),
    "English customers",
  );
  await scan("customers-en");
  report.interactions.push(
    "Mobile menu keyboard close, VI/EN hero and customer composition, reduced motion",
  );
  assert(!report.pageErrors.length, "Browser errors");
  console.log(
    "Read-only brand QA passed: " +
      report.layouts.length +
      " layouts, " +
      report.accessibility.length +
      " accessibility scans.",
  );
} finally {
  writeFileSync(resolve(dir, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
}
