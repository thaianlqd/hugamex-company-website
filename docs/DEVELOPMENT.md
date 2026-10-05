# Development

Prerequisites Node >=20.19, Java 21, Maven, Docker PostgreSQL. Exact setup, CMS access, build and test commands are in the root [README](../README.md).

User runs Vite locally. Backend is started with `scripts/backend.sh`, which loads ignored local environment values, selects installed Java 21 on this Mac, and removes an inherited DEBUG environment flag to avoid verbose framework logging. `.tools/m2` contains the project-local Maven cache; changing it is optional.

Do not replace existing `.env` files or regenerate application keys against a populated DB. Google is disabled until client configuration is present. Development email stays in protected local files, never the console. Bootstrap variables should be empty after the first local admin is created.

Testcontainers uses Docker's active context and does not reuse the website database. Browser tests intentionally create labelled fixtures through real APIs in the local dev DB. Playwright trace and automatic auth screenshots are disabled to keep credentials/codes out of artifacts; explicit screenshots contain public pages and authenticated Docker CMS screens with user email cells masked; no login fields, MFA setup, OTP or credentials are captured. QA credentials/recovery codes are protected in ignored `.local/e2e.json`.

The fixture seed script downloads fixed temporary stock URLs and uploads them through the authenticated media API. This exercises BYTEA persistence, not remote-image ingestion by the backend. Phase 2 uses one discreet public preview badge. Approval status and TODO_CLIENT_CONTENT details remain in CONTENT_SOURCES and ASSETS; stock photography is never described as a company photo.

When adding a new table or resource: add a new Flyway migration, update the constrained resource/metadata rules, scope RLS/grants, add DTOs and authorization tests, and document the content/editor workflow. Do not edit applied migrations or invent current company facts.

## Phase 2 Supabase preview content

The original Docker-only `seed-dev-content.mjs` and E2E guards remain intact. A separate, explicitly opted-in **dev service job** seeds only the reviewed Supabase development project through the existing ContentService, MediaService and HomepageService validation/audit paths. It does not create a browser session, fabricate MFA, or modify users/passwords/roles/TOTP. It is excluded from the prod profile.

At repository root, with the existing private backend environment and owner record:

```sh
ALLOW_SUPABASE_PREVIEW_SEED=true node scripts/preview-content/prepare-job.mjs
bash scripts/backend.sh spring-boot:run -Dspring-boot.run.arguments="--server.port=8081 --ALLOW_SUPABASE_PREVIEW_SEED=true --RUN_SUPABASE_PREVIEW_SEED_JOB=true"
```

Both opt-ins are required. The job checks the exact reviewed JDBC host/port/database/project username/SSL parameter and manifest fingerprint. The client preparation downloads five fixed stock image URLs; Java never fetches an arbitrary external hero URL. Seed state and manifest stay ignored under `.local/` with restrictive permissions. Preserve the state: stable keys and fingerprints prevent duplicates and skip owner edits. The one-shot job exits after seeding and a second pass confirms no additional content writes. Normal backend startup has both flags false. Never run it against production or replace existing application keys.

The authenticated REST helper `scripts/seed-supabase-preview.mjs` remains available for content with real MFA, the same target guard and memory-only tokens; it was not used successfully in this phase. The service job also handles per-key contact settings and archives only unchanged, seed-owned retired previews after checking both translations. Existing nonblank untracked settings and owner edits are preserved. Editing the repository does not require an admin login.

## Isolated browser regression

With the existing Docker PostgreSQL and private Docker QA fixture, run from repository root:

```sh
node scripts/preview-content/isolated-admin-qa.mjs --e2e
```

This starts Spring on 8082 and public/admin Vite on 5176/5186, overrides the database to Docker and mail to protected files, blanks SMTP/bootstrap values, and disables preview seeding. The dedicated Playwright config validates these targets. Only the Docker QA account's recovery codes are regenerated for repeatable tests. Child servers stop in a finally block. The normal `npm run test:e2e` still refuses Supabase/live SMTP. Public preview capture against the normal local Supabase-backed API is read-only:

```sh
node scripts/preview-content/qa.mjs --public-only
```

Safe screenshots and count-only reports are under `docs/qa/phase2/`. Test logs, credentials, mail and state remain ignored. No deployment takes place.

## Developer-owned presentation and content-only CMS

Edit `frontend/src/content/sitePresentation.ts` for VI/EN homepage section order, headings and illustrative hero slides; edit `pages/Home.tsx`, shared components and CSS for layout. Published articles/products are loaded automatically through public Spring APIs. CMS homepage/settings/HERO APIs reject every role, including SUPER_ADMIN. Content editors retain structured text, media, SEO, translations, publishing and category associations; creating/editing opens a native modal with focus containment, Escape/close and discard confirmation.

Product categories are distinct PRODUCT_CATEGORY entities, connected through `product_categories` (V5). Create and publish a category before publishing its products. Existing source-backed previews now include seven product entries in five categories, with VI/EN translations. No retail prices, SKUs or fabricated current specifications are introduced.

Configure contact notifications in protected `backend/.env`: `CONTACT_NOTIFICATIONS_ENABLED=true`, `CONTACT_NOTIFICATION_EMAIL=<fixed recipient>` and the existing SMTP/from configuration. The current local recipient requested by the owner is `thaianvtk@gmail.com`. Restart Spring after environment changes. The public form always saves the admin inbox entry before asynchronous mail delivery. The worker checks every 10 seconds, locks due rows with SKIP LOCKED and tries up to five times with increasing delay. Old inbox entries stay DISABLED and are not mailed retroactively. Reply-To uses the sender email; To/from/subject headers are server-controlled. SMTP acceptance is not an inbox-delivery guarantee. A crash after SMTP acceptance but before DB commit can cause a duplicate notification (at-least-once delivery).

Isolated QA overrides contact recipient to `qa-contact@example.invalid` and transport to protected local files; it never sends real mail or uses the Supabase owner session. File mode remains restricted to dev/test. Run migrations with the normal dev startup; never edit existing migrations.
