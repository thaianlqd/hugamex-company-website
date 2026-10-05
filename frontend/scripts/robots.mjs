import process from 'node:process';
import { writeFileSync } from 'node:fs';
import { loadEnv } from 'vite';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const production = env.VITE_APP_ENV === 'production';
if (production && !/^https:\/\//.test(env.VITE_SITE_URL || ''))
  throw new Error('Production SEO requires an HTTPS VITE_SITE_URL.');
const text = production
  ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /tai-khoan\nDisallow: /dang-nhap\nDisallow: /dang-ky\nDisallow: /xac-thuc-email\nDisallow: /quen-mat-khau\nDisallow: /dat-lai-mat-khau\nSitemap: ${env.VITE_SITE_URL.replace(/\/$/, '')}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n';
writeFileSync('public/robots.txt', text);
