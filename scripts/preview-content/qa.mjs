// Read-only browser smoke. No account fixtures, SMTP actions or persistent authentication state.
import AxeBuilder from "../../frontend/node_modules/@axe-core/playwright/dist/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../..");
process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(root, ".tools/playwright");
const { chromium } =
  await import("../../frontend/node_modules/playwright/index.mjs");
export async function capturePreviewQa(cookies, options = {}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const directory = resolve(root, "docs/qa/phase2");
  mkdirSync(directory, { recursive: true });
  const report = {
    checkedAt: new Date().toISOString(),
    public: [],
    admin: [],
    accessibility: [],
    consoleErrors: [],
    mutationsBlocked: 0,
  };
  await context.route("**/api/v1/**", (route) => {
    const req = route.request();
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method()) &&
      !/\/auth\/(csrf|refresh|logout)(\?|$)/.test(req.url())
    ) {
      report.mutationsBlocked++;
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.consoleErrors.push(error.name));
  const publicBase = options.publicBase || "http://127.0.0.1:5173";
  const adminBase = options.adminBase || "http://127.0.0.1:5180";
  const settle = async () => {
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
  };
  const check = async (label) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    if (overflow) throw new Error(`Document overflow: ${label}`);
    return { label, overflow };
  };
  const screenshot = async (name, mask = []) => {
    await settle();
    const height = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle();
    await page.screenshot({
      path: resolve(directory, name + ".png"),
      fullPage: true,
      mask,
      maskColor: "#dce1ea",
    });
  };
  const axe = async (name) => {
    const scan = await new AxeBuilder({ page }).analyze();
    report.accessibility.push({
      name,
      violations: scan.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        count: v.nodes.length,
        targets: v.nodes.map((n) => n.target),
      })),
    });
    if (scan.violations.length)
      throw new Error(`Accessibility violations: ${name}`);
  };
  try {
    if (!options.adminOnly) {
      for (const width of [375, 390, 430, 768, 1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const [path, name] of [
          ["/", "home"],
          ["/gioi-thieu", "about"],
          ["/tin-tuc", "news"],
          ["/tin-tuc/tu-chat-lieu-den-thanh-pham", "article"],
        ]) {
          await page.goto(publicBase + path);
          await settle();
          report.public.push(await check(`${name}-${width}`));
          if (width === 390 || width === 1440)
            await screenshot(`public-${name}-${width}`);
        }
      }
      await axe("public-article-desktop");
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const [path, name] of [
          ["/he-thong", "network"],
          ["/nang-luc-san-xuat", "capabilities"],
          ["/lien-he", "contact"],
        ]) {
          await page.goto(publicBase + path);
          await settle();
          report.public.push(await check(`${name}-${width}`));
          await screenshot(`public-${name}-${width}`);
          await axe(`public-${name}-${width}`);
        }
        await page
          .getByRole("button", { name: "Mở liên hệ nhanh", exact: true })
          .click();
        await page
          .getByRole("dialog", { name: "Liên hệ HUGAMEX", exact: true })
          .waitFor();
        await screenshot(`public-quick-contact-${width}`);
        await axe(`public-quick-contact-${width}`);
        await page.keyboard.press("Escape");
        if (
          !(await page
            .getByRole("button", { name: "Mở liên hệ nhanh", exact: true })
            .evaluate((node) => node === document.activeElement))
        )
          throw new Error("Quick-contact trigger did not regain focus.");
      }

      for (const path of [
        "/gioi-thieu/lich-su",
        "/gioi-thieu/tam-nhin-su-menh",
        "/nang-luc-san-xuat",
        "/phat-trien-ben-vung",
        "/tuyen-dung",
        "/chinh-sach-bao-mat",
        "/san-pham",
        "/he-thong",
        "/doi-tac",
        "/chung-nhan",
        "/lien-he",
      ]) {
        await page.goto(publicBase + path);
        await settle();
        if (await page.getByText("404", { exact: true }).count())
          throw new Error(`Expected route unavailable: ${path}`);
        report.public.push(await check(path));
      }
      await page.goto(publicBase + "/khong-ton-tai");
      await settle();
      if (!(await page.getByText("404", { exact: true }).count()))
        throw new Error("Unknown route must be 404");
    }
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(adminBase + "/dang-nhap");
      await settle();
      await screenshot(`admin-login-${width}`);
      report.admin.push(await check(`admin-login-${width}`));
    }
    await axe("admin-login-desktop");
    if (cookies) {
      await context.addCookies(
        [...cookies]
          .filter(([, value]) => value)
          .map(([name, value]) => ({
            name,
            value,
            url: adminBase,
            httpOnly: true,
            sameSite: "Lax",
          })),
      );
      await page.goto(adminBase + "/admin");
      await settle();
      await page.locator(".admin-shell").waitFor();
      const postResponse = await context.request.get(
        adminBase + "/api/v1/public/posts?locale=vi&size=1",
      );
      const posts = await postResponse.json();
      for (const width of [375, 390, 430, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const screens = [
          ["/admin", "dashboard"],
          ["/admin/posts", "list"],
          [`/admin/posts/${posts.items[0].id}`, "editor"],
          ["/admin/media", "media"],
          ["/admin/users", "users"],
        ];
        for (const [path, name] of screens) {
          await page.goto(adminBase + path);
          await settle();
          await page.locator(".admin-shell").waitFor();
          report.admin.push(await check(`${name}-${width}`));
          if (width === 390 || width === 1440)
            await screenshot(
              `admin-${name}-${width}`,
              name === "users" ? [page.locator("tbody td:nth-child(2)")] : [],
            );
        }
        if (width === 390) {
          await page
            .getByRole("button", { name: /Menu|Mở menu|Trình đơn|Open menu/ })
            .click();
          await screenshot("admin-drawer-mobile");
          await page.keyboard.press("Escape");
        }
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(adminBase + `/admin/posts/${posts.items[0].id}`);
      await settle();
      await page
        .getByRole("button", { name: /Lưu trữ|Archive/, exact: true })
        .click();
      await page.locator(".admin-dialog[open]").waitFor();
      await screenshot("admin-confirm-dialog");
      await page.keyboard.press("Escape");
      await axe("admin-editor-desktop");
      await page.goto(adminBase + "/admin/media");
      await settle();
      await axe("admin-media-desktop");
      await page.goto(adminBase + "/admin/product-categories");
      await settle();
      await screenshot("admin-product-categories-desktop");
      const csrf = await (
        await context.request.get(adminBase + "/api/v1/auth/csrf")
      ).json();
      await context.request.post(adminBase + "/api/v1/auth/logout", {
        data: {},
        headers: { "X-CSRF-TOKEN": csrf.token },
      });
    }
    writeFileSync(
      resolve(
        directory,
        options.adminOnly
          ? "admin-read-only-smoke.json"
          : "read-only-smoke.json",
      ),
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify({
        browserQa: {
          public: report.public.length,
          admin: report.admin.length,
          violations: report.accessibility,
          consoleErrorCount: report.consoleErrors.length,
          mutationsBlocked: report.mutationsBlocked,
        },
      }),
    );
  } finally {
    await context.close();
    await browser.close();
  }
}
if (process.argv.includes("--public-only")) await capturePreviewQa();
