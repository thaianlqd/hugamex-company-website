# Latest corporate/editorial verification — 2026-10-05

| Executed check | Final result |
| --- | --- |
| `bash scripts/test-backend.sh` | **76 passed**, zero failures/errors/skips; **50 real PostgreSQL integration tests**; Spotless and Maven verify/package passed (23.079 s) |
| `npm run lint` / `npm run typecheck` | Both passed |
| `npm run test` | **21 passed**, four files (1.75 s) |
| `npm run build` / `npm run build:admin` | Both passed; 4.79 s / 4.04 s |
| `node scripts/preview-content/isolated-admin-qa.mjs --e2e` | **Seven scenarios passed** (59.7 s), real Docker PostgreSQL, file-only email |
| Isolated CMS read-only capture | **32 layouts, three axe scans**, zero violations/page errors/business writes |
| `node scripts/preview-content/brand-qa.mjs` | **32 public layouts**, eight main pages at 375/390/768/1440; **20 WCAG A/AA scans**, zero violations/page errors/overflow/business writes |
| Public photos | **97 image checks**: all loaded, all have alt text, zero fallback substitutions |
| Guarded Supabase service seed | 43 shared published entities / 86 translations; 11 products, seven product categories; latest pass 15 content operations, repeat pass zero |
| `bash scripts/verify-supabase.sh postflight` | 18/18 core tables, five successful migrations, RLS/media BYTEA, one active SUPER_ADMIN; read-only passed |

New backend regressions cover server sorting/accent-insensitive product search across pagination and rejection of an unsupported sort, plus dated customer-name/composition validation (100% total, unique labels and bounded format). Existing security, publication/category locks, media, mail/inbox and role/MFA regressions remain. New frontend cases exercise category/sort retention on pagination, debounced server search/reset and readable historical customer composition.

Read-only public interaction checks verify **11 products in seven groups**, category deep links and product breadcrumbs, actual accent-insensitive API search (`so mi` → Sơ mi), six customer names, 2022 composition 40/36/24, historical factory counts and full quality/award references, article desktop/mobile accessibility, VI/EN and mobile-menu Escape. Headquarters map query contains the client-confirmed 636–638 Nguyễn Duy address. The gallery includes full-page and focused section/viewport screenshots; selected desktop/mobile hero, category, production and customer layouts were visually inspected.

The mutating browser suite uses an explicitly guarded Docker database and `MAIL_MODE=file`, never the owner Supabase user/MFA or live SMTP. Seven scenarios cover public layouts/anonymous guard; registration/file OTP/login/refresh/account/password reset; privileged MFA/media/draft/preview/publish/contact inbox; CMS/editor/mobile focus; account/password/security/logout; product-category popup creation/publication/public filtering; and automated accessibility. CMS read-only capture blocks business writes after authentication.

Failed intermediate attempts were corrected and rerun: contrast in footer/filter labels; QA packaging overwriting a live test JAR (the runner now uses its own copy); unbounded Google Maps/lazy-image waits; and a premature debounced-search DOM assertion (now waits for the actual API response and rendered result). Repeated QA MFA attempts hit the normal five-minute limit; the successful rerun occurred after expiry. No rate limit, MFA, access control or accessibility rule was disabled.

Evidence: [public report](qa/brand/report.json), [CMS report](qa/phase2/admin-read-only-smoke.json), [seed summary](qa/phase2/seed-summary.json), [safe verification summary](qa/brand/verification-summary.json), [screenshots](qa/brand/). Private runtime logs, credentials, OTP/TOTP/recovery fixtures and downloaded seed assets remain ignored.

Scope: no live SMTP test, Google OAuth, deployment, DNS, production performance/load/security certification or real-company-photo/certificate verification in this refinement. Historical Lighthouse values below were not rerun. The pooler JDBC requires TLS, but the upstream `pg_stat_ssl=false` observation does not establish end-to-end TLS. Earlier reports below are retained as history.

# Latest content-only CMS follow-up — 2026-10-05

- `bash scripts/test-backend.sh`: **74 passed**, zero failures/errors/skips, final run 21.192 s. Includes **49 PostgreSQL integration tests**. Regressions cover all-role presentation denial, separate product categories/filtering, category/publication validation, durable admin inbox, notification deduplication on repeat processing, SMTP failure/backoff/max-attempt handling and fixed recipient/Reply-To. Category validation takes transaction-scoped shared locks while publication changes take exclusive locks.
- Frontend: lint clean, strict typecheck via both builds, **19 tests passed**, public/admin production builds passed. Latest unit run: 1.44 s; admin build: 3.81 s.
- Isolated browser: **seven scenarios passed in 59.7 s** on Docker/file-mail. New tests exercise native popup centring/mobile footer bounds, dirty-field Escape/discard cancellation/focus restoration, product-category creation, product publication and public filtering. Existing account/auth/media/editor/contact/RBAC checks remain. Safe CMS capture: **32 layouts, three axe scans, zero violations/page errors**.
- Read-only public browser: **20 layouts, ten axe scans**, seven-product catalogue, real category filtering, Vietnamese accent search, name sorting/reset, English article contents and loaded Google Maps; zero violations/page errors/business writes.
- Guarded Supabase seed: **36 content operations**, zero-write repeat pass, 37 published shared entities / 74 translations; **seven products, five product categories**. Owner edits preserved. V5 applied without modifying V1–V4. Read-only postflight: **18/18 core tables, five migrations, RLS and BYTEA passed**. The existing upstream pg_stat_ssl=false observation is not a production TLS certification.
- One explicitly requested live contact notification: public API 200, entry saved in Supabase, **SENT / attempt 1 / SMTP accepted** to the fixed owner recipient. Receipt in the mailbox is unconfirmed. Only safe delivery-state evidence is saved in [contact-smoke.json](qa/content-admin/contact-smoke.json); credentials and message data remain ignored/private.

An initial migration-count assertion was updated for V5. Browser testing exposed unsaved field state not being subscribed in React Hook Form; the editor now subscribes during render, and the discard regression passes. Visual inspection also corrected default dialog margins and a clipped sticky footer. Failed attempts were corrected and rerun; no security controls were relaxed.

Prior phase reports and Lighthouse measurements follow; they predate this follow-up. Google OAuth, production configuration/deployment and inbox receipt remain unverified.

# Phase 2 verification — 2026-10-05

Latest headquarters/catalog/article follow-up: lint, strict TypeScript, 19 frontend tests and both builds passed again. [Targeted public browser report](qa/public-refinement/report.json) records 20 layouts across 375/390/768/1440, ten axe scans with zero violations, zero page errors and zero blocked business-write attempts. It verifies card/action alignment, accent-insensitive product search, group filtering, name sorting, clear/no-results reset, factory search retaining the separate headquarters, article contents anchors, expanded English copy and actual Google map rendering. The [contact popover supplement](qa/public-refinement/quick-contact-report.json) passes 390/1440 direction-link, viewport, axe and Escape/focus checks. Twelve captures are in the [new gallery](qa/public-refinement/). The service seed updated 11 existing bilingual entities (33 content operations) and the audited contact-address setting; repeat pass remained idempotent. Java/auth code was unchanged; the 71 backend tests and six isolated E2E results below belong to the preceding account/profile follow-up and were not rerun for these public changes. Lighthouse was not rerun.

Executed on macOS Apple Silicon with Node 20.20.2, Java 21, Spring Boot 3.5.16, Chromium/Playwright and Docker PostgreSQL 17. Unit/integration tests use Testcontainers; mutating browser journeys use explicitly isolated Docker PostgreSQL and MAIL_MODE=file. Supabase checks and public browser capture are read-only, apart from the separately authorized preview content service job. No live SMTP test, Google configuration or deployment was performed in this phase.

| Check / command | Actual result |
| --- | --- |
| `bash scripts/test-backend.sh` | Passed Spotless/check, Maven verify and executable jar packaging; 71 tests, zero failures/errors/skips |
| Backend breakdown | 7 security + 13 mail configuration + 2 HERO validation + 3 preview target guards + 46 PostgreSQL integration |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed strict TypeScript |
| `npm run test` | 19 tests passed, three files |
| `npm run build` | Public dist passed |
| `npm run build:admin` | Admin dist passed |
| `node scripts/preview-content/isolated-admin-qa.mjs --e2e` | Six Playwright scenarios passed in 56.2 seconds, followed by read-only CMS screenshots |
| Default E2E target guard | Kept intact: `npm run test:e2e -- --list` refused the current Supabase/live SMTP environment before starting tests; isolated config requires Docker/file-mail/8082 |
| Supabase preview job | 30 published shared entities / 60 VI/EN translations, five BYTEA photos; repeat pass added no content writes |
| Supabase read-only postflight | 17/17 app tables, four successful migrations, RLS on all tables, media BYTEA, one SUPER_ADMIN |
| Public responsive smoke | 45 checks: home/about/news/article at 375/390/430/768/1024/1280/1440 plus 11 expected routes and six network/capabilities/contact checks; unknown route remains 404 |
| Admin responsive smoke | 32 checks: login at 390/1440; dashboard/list/editor/media/users at 375/390/430/768/1024/1440 |
| Browser console / document overflow | Zero page errors; zero document overflow in both smoke reports |
| Accessibility | Zero axe violations in final scanned screens; unchanged WCAG A/AA journeys also pass |

Backend regression retains USER rejection, EDITOR scope, privileged role/MFA guards, last SUPER_ADMIN protection, CSRF, OTP, refresh rotation/replay/revocation, draft filtering, structured content, upload signatures/sizes, private media, referenced deletion and publication constraints. New PostgreSQL cases verify HERO URL list roundtrip and atomic homepage reorder, including MFA rejection and invalid membership leaving state unchanged. Hero frontend cases exercise timer/manual/hover/focus behavior and URL allowlisting; reduced motion has immediate reveal/manual-only carousel behavior.

The six actual browser scenarios cover: public widths/language/native mobile navigation and anonymous admin guard; registration → file OTP → verification → login → refresh restore → reset; privileged login/MFA/recovery → upload → draft → preview → publish → public news → contact/inbox; all CMS management screens, real TipTap editor accessibility and mobile drawer focus restoration; public accessibility at desktop/mobile widths.

Initial browser failures exposed a mid-animation contrast measurement and a delayed upload toast caused by broad media refetch. The accessibility scan now waits for the displayed hero copy to settle while the existing hover pause is active; upload feedback is immediate after success and invalidation is scoped to media. A further rerun needed fresh Docker recovery codes; the isolated orchestrator now regenerates that QA fixture through the normally authenticated MFA API. No checks were deleted or owner authentication weakened.

## Artifacts and scope

[Public smoke](qa/phase2/read-only-smoke.json), [CMS smoke](qa/phase2/admin-read-only-smoke.json), [seed counts](qa/phase2/seed-summary.json), and 39 safe [Phase 2 screenshots](qa/phase2/) are available. Public screenshots use actual Supabase preview content. Authenticated CMS screenshots use labelled Docker fixture content and mask user email cells. No password, OTP, TOTP setup, recovery code or token is captured. Screenshot routes include home/about/news/article, admin login/dashboard/list/editor/media/users, drawer/confirmation and homepage editor.

The screenshots were visually inspected at desktop and mobile sizes. No general claim of complete accessibility certification is made: axe is scoped to listed screens, and keyboard/drawer focus checks complement it. The smoke browser blocks business writes and reported zero attempts.

## Earlier Phase 2 local Lighthouse

The Phase 2 public dist was measured before the account/company-profile follow-up at fixed localhost:4173 with Lighthouse 10.1.1 and installed Chromium. Mobile is simulated throttling; these are local preview measurements, not production SLAs. Temporary remote hero URLs and BYTEA JPEGs affect image discovery/cache/size. Anonymous image CORS/no-referrer removed the prior third-party-cookie inspection finding.

| Measurement | Mobile | Desktop |
| --- | --- | --- |
| Performance | 81 | 91 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 92 | 91 |
| FCP | 3.3 s | 0.4 s |
| LCP | 3.7 s | 1.2 s |
| TBT | 0 ms | 0 ms |
| CLS | 0.066 | 0.012 |

No runtime error or warning was reported. Development noindex intentionally reduces SEO. Mobile performance remains below a 90 target; final responsive image variants, smaller WebP/AVIF assets, caching and production latency need review once approved images/hosting are selected. TipTap remains lazy and the largest emitted JS chunk is below 500 kB. [Mobile HTML report](qa/lighthouse-mobile.html), [desktop HTML report](qa/lighthouse-desktop.html), [JSON summary](qa/lighthouse-summary.json).

Lighthouse remains an isolated tool under ignored `.tools/lighthouse`, outside application dependencies; its tool-only advisories are documented in SECURITY_REVIEW. Replay with the backend running: start Vite preview at 4173 from frontend, then run `node scripts/lighthouse.mjs`.

## Not executed / remaining

Real Google OAuth, this phase's live SMTP/inbox confirmation, production HTTPS/cookie/static-host CSP, dedicated production DB runtime grants, complete Java SCA, penetration/load tests and backup-restore drill. Existing external integration history remains in SUPABASE_SMTP_REPORT. JDBC pooler uses sslmode=require; the upstream pg_stat_ssl observation was false and does not establish end-to-end TLS. Content/photography/legal claims still require client approval. No production deployment or DNS change took place.

## Client-profile follow-up

The 71-test backend run includes two new real-PostgreSQL regressions for own-profile editing, field-injection rejection, validation and retained MFA enforcement. The final six-browser-scenario run additionally verifies display-name save/reload, mismatch validation, actual password change/re-login, separated account/profile/password/security pages at 390/1440, compact MFA accessibility, explicit logout and anonymous CMS rejection afterwards. Tests use the same isolated Docker/file-mail target; Supabase owner credentials and MFA were not changed. A repeat run temporarily hit the normal QA MFA rate window and was retried only after expiry, with no limit changes.

The source update produced 30 published bilingual entities: seven pages, six articles, five products, four facilities, three heroes, three categories, one 2022 customer overview and one explicitly historical quality overview. Seven entities were added; 15 source-backed entities were saved/published and two untouched obsolete seeded previews archived (47 content operations). Contact settings were populated through the existing validated/audited service path. The seed's repeat pass added zero further content writes. Public captures cover the actual profile-backed data and quick-contact keyboard/focus behavior. The decorative network lettering's contrast was corrected rather than suppressing the accessibility rule.

The Lighthouse numbers above were measured before this company-profile/account follow-up; Lighthouse was not rerun for this follow-up. Current build, browser, accessibility and API checks are separately listed. No production performance score is asserted.
