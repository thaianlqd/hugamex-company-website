# Local handover — HUGAMEX

2026-10-05. The local application and CMS are implemented; external service configuration and verified business content remain pending. Nothing has been deployed, published to production or connected to a live Google/Supabase/SMTP account.

## 1. What was implemented

Editorial corporate public website, VI/EN, responsive navigation/footer, fixed corporate pages, manufacturing workflow, product/network/partner/certificate listings and details, news/search/category/pagination/share/related posts, careers/privacy/contact, real auth and RBAC CMS. Temporary stock images and content are visibly awaiting approval. Hero and homepage sections are controlled by CMS.

## 2. Architecture overview

React 19/Vite/strict TypeScript SPA calls one Java 21/Spring Boot 3.5.16 REST monolith. PostgreSQL 17 stores relational identities, JSONB content and BYTEA media. Query/Axios/RHF/Zod/i18next/Helmet/TipTap/Motion/Lucide are integrated. JPA repository + MapStruct handle user profile DTO mapping; parameterized JDBC handles security locks and content queries. No browser Supabase client or business data access. See ARCHITECTURE and DECISIONS.

## 3. Main routes

Public: `/`, `/gioi-thieu`, `/gioi-thieu/lich-su`, `/gioi-thieu/tam-nhin-su-menh`, `/nang-luc-san-xuat`, `/san-pham`, `/he-thong`, `/doi-tac`, `/chung-nhan`, `/phat-trien-ben-vung`, `/tin-tuc`, `/tuyen-dung`, `/lien-he`, `/chinh-sach-bao-mat`; resource detail slugs for news/products/branches/partners/certificates.

Auth: `/dang-nhap`, `/dang-ky`, `/xac-thuc-email`, `/quen-mat-khau`, `/dat-lai-mat-khau`, `/tai-khoan`.

CMS: `/admin`, posts/categories/pages/media/branches/products/partners/certifications/hero-slides/homepage/contact-messages/users/roles/audit-logs/settings beneath `/admin`. Resource editors use `/{resource}/new` or `/{resource}/{id}`. Unknown routes display 404.

## 4. Database schema summary

17 app tables across identity/roles, OTP/session/MFA, media, constrained content/translations/categories, homepage, contacts/settings/audit/rate limits. Four Flyway migrations; constraints and indexes; UTC timestamps and UUIDs. RLS default-deny for platform guest roles. Shared normalized content kinds preserve one identity across languages; lists omit rich bodies and binary data. See DATABASE.

## 5. Authentication/security model

Argon2id; purpose-bound OTP with expiry/attempt/resend controls; verified/active account checks; in-memory 10-minute access JWT; rotated HttpOnly refresh cookie/digest/family replay revocation; CSRF for cookie transitions. ADMIN/SUPER_ADMIN mandatory TOTP; optional EDITOR MFA enforced once configured; encrypted secrets, replay counter and single-use recovery codes. RBAC/recent-auth/last-super constraints and security audit are server enforced. Google OIDC/state/PKCE is wired conditionally but not tested externally.

## 6. Admin features

Real API-backed draft/edit/preview/publish/unpublish/archive, categories, bilingual translation and SEO. Image and PDF selectors, searchable media library, authenticated image preview, upload/edit/download/delete with reference/privacy guards. Fixed homepage order/visibility/copy/content selection. Contact status management; user invitations/status, SUPER_ADMIN role/MFA reset/audit/settings. Recovery regeneration under Account. Local access and editor workflow are documented in README.

## 7. Test results

Backend: 7 unit + 40 real PostgreSQL integration tests passed, no skipped tests. Frontend: 13 tests passed. Lint/typecheck/build passed. All 5 browser scenarios passed in 36.6 seconds. Browser flows cover real OTP/auth/MFA/upload/publish/contact plus all CMS screens and automated accessibility. Tests use disposable PostgreSQL or explicitly labelled local dev fixtures. Full results and public artifacts are in [TEST_REPORT](TEST_REPORT.md).

## 8. Build results

Java 21 executable jar built; Spotless check and Maven verify passed. Vite production dist built with lazy route chunks; TipTap excluded from public-route loading. Frontend dependency audit has zero findings. Lighthouse is isolated outside application dependencies and retains tool-only advisories documented in SECURITY_REVIEW.

Final local Lighthouse scores (performance/accessibility/best practices/SEO): mobile **81/100/100/92**, desktop **100/100/100/91**. LCP was 4.7 s on simulated mobile and 0.5 s on desktop. Development noindex is intentional. Temporary JPEGs, API image discovery and production cache policy remain performance considerations; these measurements are not production guarantees.

## 9. Remaining placeholders/credentials

Google OAuth and Supabase JDBC configuration, production keys, SMTP sender/delivery and HTTPS domain/CORS. Company-approved logo/photos, factual metrics/history/vision, factory addresses, contacts, product specifications, partner rights, current certificates, jobs, final VI/EN copy and privacy/retention policy. No invented employee/factory/capacity/partner/certificate claims.

## 10. Known limitations

SPA metadata is client-rendered; social bots may need prerender/SSR. VI canonical URLs are shared across language preferences; separately indexed English URLs need a decision. Sitemap is bounded at 10,000 detail paths. Mobile performance depends on image sizes and API/network latency. No absolute session-family lifetime; concurrent tab rotations may require sign-in again. Media validation is not antivirus. BYTEA scale and backup recovery remain unbenchmarked. No external production service, HTTPS proxy or live SMTP validation.

## 11. Security review findings

CSRF header/cookie mismatch, metadata publish conversion, read-only field submission, MFA role-combination bypass, refresh/revoke race, media reference/privacy/type checks, React 19 title and TipTap lifecycle issues were fixed and regression tested. RLS default deny is tested with a guest role. Full risk/code/mitigation/remaining-risk matrix is in SECURITY_REVIEW. Spring Security DPoP-specific dependency advisory is assessed as outside this app's configured auth flow; review maintenance/security strategy before production. No full Java SCA or independent penetration test has run; no claim of complete production security.

## 12. Exact local run commands

At `hugamex-company-website`, first setup only if environments do not exist:

```sh
cd /Users/thaian/Documents/CongTyMayHuuNghi_WebSite/hugamex-company-website
python3 scripts/setup-local.py
docker compose up -d postgres
cd frontend
npm ci
cd ..
bash scripts/backend.sh spring-boot:run
```

Separate terminal:

```sh
cd /Users/thaian/Documents/CongTyMayHuuNghi_WebSite/hugamex-company-website/frontend
npm run dev
```

Open `http://localhost:5173`. Keep existing environment keys and Docker volume. CMS QA access is in private `.local/e2e.json`; use this only on local. Exact build/test/bootstrap/dev-mail instructions are in README. The user's Vite process is not intentionally stopped or replaced.

## 13. Exact next step before production

Approve content/assets and provide Google/Supabase staging configuration, then execute the staging verification in DEPLOYMENT_PLAN: DB grants/RLS/SSL, secrets, Google callback, SMTP, HTTPS cookie/CSP/headers, backups, dependency scan and owner MFA enrollment. Review the concrete staging result. Production deployment/DNS/live SMTP must be explicitly instructed in a later task.

## Intentionally uncommitted / ignored files

Root `.env`, `backend/.env`, optional frontend `.env` files; `.local/` QA credentials/recovery codes/seed-state; `backend/.dev-mail/` OTP messages; `.tools/` Maven/browser/Lighthouse caches; `.local-*` diagnostics and `*.log`; node_modules/dist/target; Playwright test-results/report/trace; coverage/tsbuildinfo/OS metadata. Env examples, source, migrations, docs, lockfile and public-only QA artifacts are reviewable. No Git commit was created in this task.

## Environment variables still required for external services

- Supabase backend: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`.
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- Production: `SPRING_PROFILES_ACTIVE=prod`; independent `JWT_SIGNING_KEY`, `TOKEN_HASH_KEY`, `OTP_HMAC_KEY`, `MFA_ENCRYPTION_KEY`; `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`; SMTP_HOST/PORT/USERNAME/PASSWORD and MAIL_FROM.
- Frontend: `VITE_APP_ENV=production`, `VITE_SITE_URL`, same-origin `VITE_API_BASE_URL=/api/v1`.
- One-time owner bootstrap only: BOOTSTRAP_ADMIN_EMAIL/PASSWORD, removed after initial creation. Dev uses DEV_MAIL_MODE=file; never enable file delivery for prod.

No Supabase service-role/anon key is needed in frontend. Local values already exist and are not production credentials.
