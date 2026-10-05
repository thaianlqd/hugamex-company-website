# HUGAMEX corporate/editorial handover

2026-10-05. Public presentation is developer-owned; CMS manages business content. The running public app is http://localhost:5173; CMS is http://localhost:5180. Refresh the existing servers after code updates; do not start a duplicate Vite instance on an occupied port.

## Presentation changes

Large photographic hero with existing restrained carousel controls; burgundy brand ribbon; alternating company, production and network compositions; compact category showcases; dedicated customer references/composition and quality/award records; editorial journal and contact CTA. Main pages receive context-specific stock photography, multilingual alt text and local fallbacks. Responsive layouts cover 375/390/768/1440 widths; reduced motion and keyboard navigation are retained.

Products now show **category → products**, with four featured-category links, all-category filtering, server-side accent-insensitive search, bounded pagination, sorting and detail breadcrumbs. Published products still require valid published product categories on the backend. Customer/composition metadata is validated and managed through the existing partner resource; API names remain compatible.

## Where to edit

| Responsibility | Main files / workflow |
| --- | --- |
| Homepage composition | [Home.tsx](../frontend/src/pages/Home.tsx), [sitePresentation.ts](../frontend/src/content/sitePresentation.ts), [brand.css](../frontend/src/styles/brand.css) |
| Developer-owned photographs | [stockPhotos.json](../frontend/src/content/stockPhotos.json), [BrandImage.tsx](../frontend/src/components/public/BrandImage.tsx); use exact approved image hosts |
| Categories / products | CMS product categories and products; [ProductCatalog.tsx](../frontend/src/components/public/ProductCatalog.tsx), [CategoryShowcase.tsx](../frontend/src/components/public/CategoryShowcase.tsx) |
| Customers / 2022 composition | CMS customers & partners: reference year, names separated by `|`, chart `Name:40|Name:36|Other:24` totalling 100; [CustomerReferences.tsx](../frontend/src/components/public/CustomerReferences.tsx) |
| Quality / awards / uploaded documents | CMS quality & awards; [QualityRecords.tsx](../frontend/src/components/public/QualityRecords.tsx), [CorporateBody.tsx](../frontend/src/components/public/CorporateBody.tsx) |
| Business seed copy | [brand-completion.mjs](../scripts/preview-content/brand-completion.mjs), [company-profile.mjs](../scripts/preview-content/company-profile.mjs), [catalog.mjs](../scripts/preview-content/catalog.mjs) |

Unused homepage builder and settings editor components were removed. Presentation routes stay absent from navigation and denied by Spring for every CMS role. Existing neutral popup editors, media, contacts, account pages, user/role/audit management remain. Auth, privileged TOTP, RBAC, audit, structured-content and media validation are unchanged. No owner admin login is needed to edit source code or use the explicitly guarded seed job.

## Data and replacement notes

43 shared published records / 86 translations, including 11 products in 7 categories. Six evergreen bilingual articles remain editorial material, not invented company events. The older 3,000-staff/2,800-machine/annual-capacity/factory snapshot stays separate from the newer profile. Customers/composition are dated 2022; awards/certificates are historical references.

Replace temporary photos with approved company, factory and actual garment images. Confirm current certificate PDFs, dates, company facts and final bilingual wording before publication. No decision from the owner is required to review this local implementation. Asset and business-source details: [ASSETS](ASSETS.md), [CONTENT_SOURCES](CONTENT_SOURCES.md).

## Local commands

From repository root, backend: `bash scripts/backend.sh spring-boot:run`.

From `frontend`, public: `npm run dev`; CMS in a separate terminal: `npm run dev:admin`.

Verification commands and actual results are recorded in [TEST_REPORT](TEST_REPORT.md). Preview seed remains opt-in and fingerprint-protected; normal startup keeps both seed flags disabled. Existing command/guard details are in [DEVELOPMENT](DEVELOPMENT.md). Browser mutations use only Docker/file-mail fixtures. This task sent no live email and made no deployment, DNS or real-secret changes.
