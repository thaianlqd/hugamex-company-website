import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID, createHmac, randomBytes } from 'node:crypto';
const fixturePath = resolve('../.local/e2e.json');
type Fixture = { email: string; password: string; secret?: string; recoveryCodes?: string[] };
function otp(secret: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0,
    buffer = 0;
  const bytes: number[] = [];
  for (const c of secret) {
    buffer = (buffer << 5) | alphabet.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
    }
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac('sha1', Buffer.from(bytes)).update(counter).digest();
  const offset = hash[19] & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
async function adminLogin(page: Page) {
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as Fixture;
  await page.goto('/dang-nhap');
  await page.getByLabel('Email', { exact: true }).fill(fixture.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(fixture.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/tai-khoan/);
  await page.getByRole('link', { name: 'CMS / Admin' }).click();
  if (!fixture.secret) {
    await page.getByRole('button', { name: 'Thiết lập ứng dụng xác thực' }).click();
    fixture.secret = await page.locator('.mfa-secret').innerText();
    await page.getByLabel('Mã OTP').fill(otp(fixture.secret));
    await page.getByRole('button', { name: 'Xác thực', exact: true }).click();
    await expect(page.locator('.recovery-codes li')).toHaveCount(8);
    fixture.recoveryCodes = await page.locator('.recovery-codes code').allInnerTexts();
    writeFileSync(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
    await page.getByRole('button', { name: 'Đã lưu mã · Tiếp tục' }).click();
  } else {
    const recovery = fixture.recoveryCodes?.pop();
    if (!recovery)
      throw new Error('Regenerate local QA recovery codes before rerunning the suite.');
    await page.getByRole('button', { name: 'Recovery code', exact: true }).click();
    await page.getByLabel('Recovery code', { exact: true }).fill(recovery);
    await page.getByRole('button', { name: 'Xác thực', exact: true }).click();
    writeFileSync(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
  }
  await expect(page.getByRole('navigation', { name: 'Admin' })).toBeVisible();
}
test('Public layouts, language, mobile navigation and anonymous admin guard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Từ từng');
  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('body')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '../docs/qa/home-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Change language' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Thoughtfully');
  await page.getByRole('button', { name: 'Change language' }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '../docs/qa/home-desktop.png', fullPage: true });
  await page.goto('/admin');
  await expect(page).toHaveURL(/dang-nhap/);
});
test('Register → verify → login → refresh restore → account → password reset', async ({ page }) => {
  const email = `journey-${randomUUID()}@example.invalid`;
  const password = randomBytes(24).toString('base64url');
  await page.goto('/dang-ky');
  await page.getByLabel('Họ và tên', { exact: true }).fill('QA development fixture');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/auth/register') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  const { challengeId } = (await (await response).json()) as { challengeId: string };
  await expect(page).toHaveURL(/xac-thuc-email/);
  const mail = readFileSync(resolve(`../backend/.dev-mail/${challengeId}.txt`), 'utf8');
  const code = mail.match(/OTP: (\d{6})/)?.[1];
  if (!code) throw new Error('Development email not delivered');
  await page.getByLabel('Mã OTP').fill(code);
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Email đã xác thực');
  await page.goto('/dang-nhap');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/tai-khoan/);
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
  expect(storage.local).not.toContain('accessToken');
  expect(storage.local).not.toContain('refreshToken');
  expect(storage.session).toEqual([]);
  await page.goto('/admin');
  await expect(page).toHaveURL(/tai-khoan/);
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await page.goto('/quen-mat-khau');
  await page.getByLabel('Email', { exact: true }).fill(email);
  const resetResponse = page.waitForResponse(
    (r) => r.url().endsWith('/auth/forgot-password') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Quên mật khẩu', exact: true }).click();
  const reset = (await (await resetResponse).json()) as { challengeId: string };
  await expect(page).toHaveURL(/dat-lai-mat-khau/);
  const resetCode = readFileSync(
    resolve(`../backend/.dev-mail/${reset.challengeId}.txt`),
    'utf8',
  ).match(/OTP: (\d{6})/)?.[1];
  if (!resetCode) throw new Error('Reset email not delivered');
  await page.getByLabel('Mã OTP').fill(resetCode);
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByLabel('Mật khẩu', { exact: true }).fill(randomBytes(24).toString('base64url'));
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page).toHaveURL(/dang-nhap/);
});
test('Admin login → MFA → upload → create draft → preview → publish → public news → contact', async ({
  page,
}) => {
  page.on('pageerror', (error) => {
    throw new Error(`Browser error: ${error.stack}`);
  });
  await adminLogin(page);
  await page.goto('/admin/media');
  await page.locator('#mediaFile').setInputFiles({
    name: 'qa-illustration.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page.getByLabel('Alt text').fill('Development illustration');
  await page.getByLabel('Công khai').check();
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Thông tin đã được gửi');
  await page.goto('/admin/posts/new');
  const slug = `qa-story-${randomUUID()}`;
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Nội dung minh họa — hành trình sản xuất');
  await page.getByLabel('Đường dẫn', { exact: true }).fill(slug);
  await page
    .getByLabel('Tóm tắt', { exact: true })
    .fill('Development fixture — requires client approval.');
  await page
    .getByRole('textbox', { name: 'Content editor' })
    .fill('Nội dung minh họa để kiểm thử CMS. Không phải thông tin chính thức của doanh nghiệp.');
  await page.getByLabel('Media', { exact: true }).selectOption({ label: 'qa-illustration.png / public' });
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page).toHaveURL(/admin\/posts\/[0-9a-f-]+/);
  await page.getByRole('button', { name: 'Xem trước', exact: true }).click();
  await expect(page.locator('.preview')).toContainText('Nội dung minh họa');
  await expect(page.locator('.preview img')).toBeVisible();
  await page.getByRole('button', { name: 'Xem trước', exact: true }).click();
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await expect(page.locator('.form-actions .status')).toHaveText('PUBLISHED');
  await page.goto('/tin-tuc');
  await page.locator(`a[href="/tin-tuc/${slug}"]`).click();
  await expect(page).toHaveURL(new RegExp(slug));
  await expect(page.locator('.prose')).toContainText('Không phải thông tin chính thức');
  await page.goto('/lien-he');
  await page.getByLabel('Họ và tên *').fill('QA fixture');
  await page.getByLabel('Email *').fill(`contact-${randomUUID()}@example.invalid`);
  await page.getByLabel('Chủ đề *').fill('QA contact test');
  await page.getByLabel('Nội dung *').fill('Development-only contact enquiry.');
  await page.getByRole('button', { name: 'Gửi thông tin', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Thông tin đã được gửi');
  await page.goto('/admin/contact-messages');
  await expect(
    page.getByRole('cell', { name: 'QA contact test', exact: true }).first(),
  ).toBeVisible();
});

test('CMS management screens, editor accessibility and mobile focus navigation', async ({
  page,
}) => {
  await adminLogin(page);
  for (const path of [
    'pages',
    'categories',
    'branches',
    'products',
    'partners',
    'certifications',
    'hero-slides',
    'homepage',
    'users',
    'roles',
    'audit-logs',
    'settings',
  ]) {
    await page.goto(`/admin/${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.state[role="alert"]')).toHaveCount(0);
  }
  await page.goto('/admin/posts/new');
  await expect(page.getByRole('textbox', { name: 'Content editor' })).toBeVisible();
  const desktop = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    desktop.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
  await expect(page.locator('#admin-drawer')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#admin-drawer')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Mở menu', exact: true })).toBeFocused();
});
