# Latest follow-up — content-only CMS and contact email

2026-10-05. The CMS now manages editorial/business content without homepage, hero or global website configuration. Those routes are absent from navigation and denied by Spring for every CMS role, including SUPER_ADMIN. Developers edit presentation at `frontend/src/content/sitePresentation.ts`, layout components and CSS. Articles/products load automatically from published content.

Create/edit workflows use a centred, bounded popup with preview, translation selection, sticky actions, background scroll lock, focus containment and Escape/discard confirmation. Products have a separate category picker and validated category association. Supabase now contains **37 published shared entities / 74 translations**, including **seven products and five product categories**. The guarded service seed made **36 content operations** and its repeat pass made zero further content writes; owner edits remain fingerprint-protected.

Public contact submissions persist in the admin inbox and queue a plain-text notification to the fixed recipient **thaianvtk@gmail.com**, as requested. The admin inbox shows notification state. Failed delivery retries up to five times; old entries are not mailed retroactively. One labelled real submission was saved and reached **SENT on attempt 1**; Gmail SMTP accepted the message. Inbox receipt has not been independently confirmed. [Safe SMTP check](qa/content-admin/contact-smoke.json).

Final verification: **74 backend tests (49 real-PostgreSQL integration), 19 frontend tests, seven isolated browser scenarios**, lint/typecheck and both frontend builds. Public read-only QA covered 20 layouts and ten axe scans; isolated CMS capture covered 32 layouts and three axe scans. Scanned screens had zero violations/page errors. Browser tests used Docker/file-mail fixtures, without the owner login/MFA. Final Supabase postflight verified 18 tables, five successful migrations, RLS and BYTEA. Screenshots are in [qa/phase2](qa/phase2/) and [public-refinement](qa/public-refinement/). No deployment or DNS change took place. Earlier Lighthouse results below were not rerun.

# Previous public refinement: headquarters, catalog and articles

The client-confirmed head office is now **636–638 Nguyễn Duy, Phường Phú Định, TP. Hồ Chí Minh** in the CMS contact settings and company introduction. The network page separates this office/map from the four manufacturing facilities. Contact has a loaded Google map alongside its enquiry form; footer addresses open Maps and the public contact popover includes directions to the head office.

Product cards align their headings/actions and lower borders on homepage and catalog. A compact filter supports accent-insensitive search, CMS group selection, name sorting and clear/no-results recovery. Six bilingual articles now have additional practical sections, checklists and illustrative examples, a contents sidebar, reading estimate and burgundy collaboration CTA. Burgundy accents were added to public section headings, filters and contact layouts. Navigation now has an opaque background.

This follow-up passed lint, strict typecheck, 19 frontend tests and both builds. Read-only browser QA passed 20 layouts across 375/390/768/1440, ten axe scans, real filter/TOC/English interactions and loaded Google Maps. The contact supplement passed two further layout/axe/Escape-focus checks. There were zero page errors and attempted business writes. Twelve new safe captures and reports are in [public-refinement](qa/public-refinement/). The guarded seed made 33 content operations plus the audited address setting update; repeat pass added no content writes and published counts remain 30 shared entities / 60 translations. Java/auth code was unchanged in this follow-up; prior 71 backend and six isolated E2E results below were not rerun. Nothing was deployed.

# Client company profile and account layout

2026-10-05 follow-up. The old company website excerpt and supplied company-profile brief have now replaced applicable generic previews. That follow-up produced **30 published shared records / 60 VI–EN translations**, including **four facilities and five product groups**. Contact phone/email/address/fax are now CMS settings. Historical workforce/lines/turnover remain labelled 2023; customer references and composition remain labelled 2022. Factory figures are explicitly source snapshots, not current capacity. No customer logos or currently valid certificates are invented. Seven records were added and two obsolete seed-owned previews archived after fingerprint checks.

MFA layout is compact and aligned. Personal information, password change and MFA/recovery settings now have separate routes, independent of the login photograph. Display-name editing uses an authenticated, self-only API with strict fields and audit. Password change includes confirmation and signs out afterwards. Dedicated logout is visible in the CMS topbar, account header and MFA footer. A public circular phone button opens a rounded call/email/enquiry panel with Escape and focus restoration.

Verified: **71 backend tests, 19 frontend tests, six E2E scenarios**, lint/typecheck and both builds. Final read-only browser checks passed 45 public and 32 CMS layouts; scanned screens had zero axe violations and page errors. All 39 safe screenshots are available, including the new MFA/account/network/contact screens. Detailed results are in TEST_REPORT. Layout/data changes were made without changing owner credentials, RBAC/MFA requirements, SMTP or applied migrations. Normal backend startup keeps both seed flags disabled. The handover below reflects the completed Phase 2 and follow-up. Previous Lighthouse numbers predate this follow-up and were not rerun. Nothing was deployed.

# HUGAMEX — Phase 2 handover

2026-10-05. Implemented directly in the existing repository on main without scaffolding, changing architecture, creating a Git commit, deployment, DNS changes or Google OAuth configuration. The public app remains http://localhost:5173; the separate CMS remains http://localhost:5180; Spring remains on 8080. Editing repository code requires no admin login. CMS access still uses normal RBAC/MFA.

## Completed

Public burgundy/warm-white editorial design now has restrained one-time scroll reveal, heading/content stagger, reduced-motion support, image loading/fallback and responsive corporate layouts. History includes explicitly dated source figures and historical awards without invented milestone dates; vision, manufacturing and the four-facility network have dedicated layouts. Empty content states provide clear next actions instead of large approval warnings.

Hero uses three CMS-controlled stock image slides, six-second automatic rotation, previous/next, numbered controls, pause/play and swipe. It pauses on hover, focus and a hidden document; reduced motion disables autoplay. Library media takes precedence over an optional HTTPS external URL. Only the next slide is prefetched. External images use anonymous CORS/no-referrer and exact approved image hosts.

The admin uses a neutral white/gray/charcoal system with restrained indigo, grouped 252 px sidebar, 68 px topbar, breadcrumbs and mobile drawer. Authentication has a desktop image/form split and compact mobile form. Dashboard values come from real APIs. Lists, status/date/language columns, editor/SEO/media sidebar, searchable thumbnail library, collapsed upload/homepage controls, native confirmation dialogs, toast feedback and loading states are polished. Homepage reorder is atomic and audited. Existing user/security/settings workflows retain backend authorization.

## Supabase development content

| Shared content kind | Records | VI / EN |
| --- | --- | --- |
| Corporate pages | 7 | 7 / 7 |
| Evergreen news | 6 | 6 / 6 |
| Products | 5 | 5 / 5 |
| HERO slides | 3 | 3 / 3 |
| Categories | 3 | 3 / 3 |
| Factories / historical customers / quality | 6 | 6 / 6 |
| Total | 30 | 30 / 30 |

Seven populated pages: introduction, history, vision/mission, manufacturing, sustainability, careers and privacy. Applicable pages use the client-supplied profile and legacy website excerpt in VI/EN. Five product groups cover outerwear, fleece, shirts, pants/shorts and toddler garments. Four facility pages contain source-backed addresses and capacity snapshots. Customer references are explicitly dated 2022; quality awards and certificates are historical references without a current-validity claim. The six articles remain evergreen garment topics. Seven homepage sections reference the published content.

Five fixed temporary stock photos are stored through existing BYTEA media validation, with alt text identifying them as illustrations. Three HERO URLs use Pexels/Unsplash. No ImageGen was used. [CONTENT_SOURCES](CONTENT_SOURCES.md) records source URLs, verified scope and the internal approval/TODO register; [ASSETS](ASSETS.md) records temporary photos.

The separate explicit **dev service job** was used, as permitted by the plan. It requires two opt-ins and exact reviewed-project/manifest checks, calls existing validated/audited domain services, tracks stable keys/fingerprints, preserves owner edits and exits. The company-profile update added seven entities, saved/published 15 bilingual records and archived two unchanged obsolete previews: 47 content operations. Contact settings use the same validated/audited settings service. The built-in repeat pass added zero content writes. It does not change users, passwords, roles, MFA or SMTP. The original Docker-only seed/E2E refusal guards remain unchanged. Normal backend startup has both seed flags disabled.

## Verified

- Backend: 71 tests passed, zero failures/skips; Spotless, Maven verify and executable jar passed.
- Frontend: ESLint, strict TypeScript, 19 tests, public build and admin build passed.
- Browser: six E2E scenarios passed in 56.2 s with real Docker API/file OTP; responsive smoke passed 45 public and 32 admin checks with no document overflow or page errors.
- Final scanned accessibility screens had zero axe violations; mobile drawer Escape/focus restoration passed.
- Supabase read-only postflight confirmed 17 tables, four migrations, RLS, BYTEA and one SUPER_ADMIN.
- Safe screenshots and count-only reports are in [qa/phase2](qa/phase2/); detailed scope and limitations are in [TEST_REPORT](TEST_REPORT.md).

Earlier Phase 2 Lighthouse performance/accessibility/best practices/SEO: mobile **81/100/100/92**, desktop **91/100/100/91**. LCP: mobile 3.7 s, desktop 1.2 s. These measurements predate the account/company-profile follow-up. Mobile image performance still needs final asset/cache optimization. These measurements describe local preview, not production readiness.

## Security and approval

JWT/refresh/OTP/TOTP, mandatory privileged MFA, RBAC, private media, publish guards, TipTap allowlists and audit remain enforced. HERO external URLs accept only exact HTTPS images.pexels.com / images.unsplash.com, no userinfo/nondefault ports; Java never fetches them. No arbitrary HTML or remote import endpoint was added. Secret environment/state/mail files remain ignored; safe screenshots omit credentials and MFA setup. No secrets were printed by the task or committed.

Owner action remains: rotate previously shared admin credentials, revoke old sessions and rotate Google App Password, then re-enroll the exposed MFA setup secret. This task did not silently invalidate existing owner access. The backend environment must remain private. Production runtime grants/TLS/static-host CSP/security and dependency review remain required; the Supabase pooler observation does not certify end-to-end TLS.

Client approval is still needed for official metrics, precise history dates, current factories/addresses/contact details, partner permissions, certificate records, product specifications, real photography/logo, open jobs, final VI/EN copy and privacy/retention/legal policy. One discreet preview badge is retained publicly; detailed approval status stays in the internal register.

Remaining work: Google OAuth, final client content/assets, production domain/CORS/HTTPS/runtime configuration and a separately authorized deployment review. No deployment or production-ready claim is made. See [DEPLOYMENT_PLAN](DEPLOYMENT_PLAN.md) and prior [SUPABASE_SMTP_REPORT](SUPABASE_SMTP_REPORT.md) for external integration history.

## Local commands

Backend, from repository root:

```sh
bash scripts/backend.sh spring-boot:run
```

Public frontend, in a separate terminal:

```sh
cd frontend
npm run dev
```

Admin frontend, in another terminal:

```sh
cd frontend
npm run dev:admin
```

Use the existing running Vite servers when those ports are already occupied. Their fixed ports are intentional; do not start a duplicate process. No environment keys or Docker volumes need to be reset. Full guarded preview seed/isolated QA commands are in [DEVELOPMENT](DEVELOPMENT.md).
