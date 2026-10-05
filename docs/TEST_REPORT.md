# Local verification report — 2026-10-05

Executed on macOS Apple Silicon, Node 20.20.2, Java 21, Docker 29; Spring Boot 3.5.16; PostgreSQL 17 Testcontainers. No tests used the external Supabase database, Google account or SMTP service.

| Check | Actual result |
| --- | --- |
| Backend security unit tests | 7 passed |
| PostgreSQL integration tests | 40 passed, no skipped tests; disposable PostgreSQL, real Flyway V1–V4, no H2 |
| Backend clean verify/package | Passed; executable Spring jar built |
| Backend Spotless | Applied, check passed in handover test script |
| Frontend strict TypeScript | Passed |
| Frontend ESLint | Passed |
| Frontend Vitest | 13 passed |
| Browser public/auth/CMS journeys | 5 passed in 36.6 seconds against the running local API |
| Automated accessibility | WCAG 2 A/AA + 2.1 AA: home/contact/register/news at 390 and 1440; CMS editor and mobile dialog focus checks |
| Layout widths | Public no overflow at 375, 390, 768, 1024, 1280, 1440; CMS editor checked at 390 |
| Frontend Vite production bundle | Passed, route splitting retained; TipTap loads only for CMS |
| Frontend npm audit | Zero findings at review time; Lighthouse is an isolated measurement tool, see SECURITY_REVIEW |
| Dev content seed | Ran successfully through authenticated local APIs; rerun reused existing fixture IDs; clearly labelled content and images, no production writes |

Backend coverage includes: real migrations/BYTEA/RLS default deny; duplicate registration, verification/expiry/purpose/attempt limits/resend; weak password/login/disabled accounts/rate limits; reset/change-password session revocation; refresh rotation/replay/concurrent revocation; roles/mixed-role MFA/last-active-super; TOTP replay and recovery code invalidation; account linking conflict; draft/public filtering and slug constraints; structured-content injection; private media, file validation, cache/ETag, reference deletion and publication/privacy guards; image/PDF media-kind separation; homepage updates; contact validation/rate limits; canonical translated detail routes and sitemap.

Browser scenarios exercise the running React app and real API: mobile/language/navigation/anonymous admin guard; register → dev mail OTP → verify → login → reload restore → account → USER admin rejection → logout → forgot/reset; privileged login → MFA/recovery → upload → draft → preview → publish → public article → contact/CMS inbox. Additional checks visit all management screens, the real TipTap editor and native mobile dialog. Credentials/codes never appear in trace files or committed screenshots.

Public screenshots: [desktop](qa/home-desktop.png), [mobile](qa/home-mobile.png). Lighthouse artifacts: [mobile report](qa/lighthouse-mobile.html), [desktop report](qa/lighthouse-desktop.html), [machine-readable summary](qa/lighthouse-summary.json). These are local build measurements using Lighthouse 10.1.1 and the installed Chromium, not production SLA values. Mobile uses simulated throttling; desktop uses the provided local connection. Development noindex deliberately reduces SEO score.

| Final local Lighthouse run | Mobile | Desktop |
| --- | --- | --- |
| Performance | 81 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 92 | 91 |
| First contentful paint | 2.3 s | 0.1 s |
| Largest contentful paint | 4.7 s | 0.5 s |
| Total blocking time | 20 ms | 0 ms |
| Cumulative layout shift | 0.035 | 0.012 |

Neither run reported a runtime error or warning. Mobile findings include the API-discovered hero image, JPEG size/format, cache policy and render-blocking resources. Production image variants, responsive sizing and proxy cache policy need review when final assets and hosting are selected. Accessibility scores describe the audited page; the separate browser accessibility checks cover the other listed routes and do not certify the entire application.

Lighthouse replay, with backend running:

```sh
cd frontend
npm install --prefix ../.tools/lighthouse --no-save lighthouse@10.1.1
npx vite preview --host 127.0.0.1 --port 4173
```

In another terminal at frontend:

```sh
node scripts/lighthouse.mjs
```

Install Chromium using the README command first. The measurement tool has known tool-only dependency advisories; it is outside the application lockfile/bundle and restricted to the fixed localhost URL. Review its version/dependencies before measuring arbitrary untrusted sites.

Limitations: no real Google OAuth roundtrip, Supabase role/grant inspection, live mail delivery, deployed HTTPS/cookies/CSP review, full Java automated SCA, penetration test, load test or backup-restore drill. Temporary photos and synthetic content are not company-verified. SPA metadata/social preview behavior and indexed EN URL strategy need a production decision.
