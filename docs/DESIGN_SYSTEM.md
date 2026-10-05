# HUGAMEX design system — Phase 2

## Public website

Burgundy `#7A1E2C`, warm white `#FAF8F6`, charcoal `#1D1D1F`, muted `#6F6B69`, border `#E5DFDC`. Be Vietnam Pro is packaged locally. Editorial spacing, large headings, thin dividers, garment photography and restrained asymmetric sections. No 3D/neon/card-wall treatment.

`HomeHero` uses a 46/54 desktop split, a stacked mobile layout, six-second auto-advance and opacity crossfades. Numbered controls, previous/next and pause are keyboard accessible. Hover, focus within, hidden document and reduced-motion preferences pause automatic switching. Manual selection restarts the timer; touch swipe is supported. Library media wins over the allowlisted external URL, then a local SVG fallback. Only the next image is prefetched, at low priority; remote image requests use anonymous CORS/no referrer. The first hero is eager/high priority. Below-fold images are lazy/async and reserve dimensions.

Reusable `Reveal`, `RevealGroup`, `RevealItem`, `FadeIn`, `ImageReveal`: 24px travel, 550ms ease-out, once at 18% visibility, 80ms group stagger. Reduced motion renders content immediately. Forms, tables and article prose do not animate wholesale. Corporate content groups are extracted from saved TipTap headings; history is a narrative column, manufacturing a numbered workflow, vision a three-column desktop treatment, other pages an editorial section grid.

## Admin

Background `#F6F7F9`, white `#FFFFFF`, ink `#16181D`, muted `#68707D`, borders `#E5E7EB`, primary charcoal `#22252B`, subtle indigo `#4F5D95`. Burgundy is confined to the brand. Sidebar 252px, topbar 68px, main content max 1560px and 24–32px padding. Grouped Lucide navigation keeps the existing role filters. Mobile uses a native dialog drawer with Escape/focus restoration.

Admin login is a 46/54 split with a garment photo and CMS introduction; mobile shows the form with 24px padding. No registration link. Google appears only if the backend enables it. Account and MFA security behaviours remain unchanged.

Editor: flexible main column plus 300px settings sidebar, single column below 1100px. Inputs 42px, radius 7px, 12px labels. TipTap has a grouped icon toolbar, selected formatting state and a 400px minimum writing area. SEO, image/category and resource metadata stay in the sidebar. Image previews use authenticated blob requests for private media.

Tables use compact 54px rows, status badges, contained horizontal scrolling and a sticky first column. The dashboard displays actual draft/published/media/contact counts and recent API items; no traffic charts are invented. Media is a thumbnail grid with filename, size, privacy, alt text and compact actions. Homepage panels collapse; up/down saves a validated, transactional complete section order.

Native `AdminDialog` handles archive, media deletion, status/role changes and MFA reset. It traps focus, returns focus, supports Escape/cancel and blocks dismissal while the action is pending. Toasts are polite status regions with close controls and five-second dismissal. Loading uses static/pulsing skeletons; reduced motion removes pulsing. Touch controls are at least 44px where interactive.

## Assets and approval

Photography remains illustrative stock. Current company facts, product specifications, certificates, addresses, logos and legal copy require owner approval. See [CONTENT_SOURCES](CONTENT_SOURCES.md), [ASSETS](ASSETS.md) and screenshots under [qa/phase2](qa/phase2).

## Profile, MFA and contact refinement

The photo/form split is restricted to authentication. `/tai-khoan`, `/tai-khoan/doi-mat-khau` and `/tai-khoan/bao-mat` use a compact account workspace: 230 px navigation beside a bounded form panel, stacked mobile navigation, a dedicated logout control and no full-height photograph. The profile supports display-name updates; email remains read-only. Password change includes confirmation and signs out after success. MFA is a 460 px card with 27 px heading, six-digit input and separated actions/footer; account settings embed it without nesting another page heading. CMS topbar has explicit logout in addition to the account avatar.

The network page uses a CMS-ordered facility list beside an editorial introduction, with stacked mobile rows. Data is read from API content; no factory figures or identities are hardcoded in React. Contact information is held in allowlisted settings maintained by developers. A 58 px circular phone button at the bottom-right opens a 330 px rounded contact panel with call/email/enquiry links. It supports keyboard Escape, close-button focus and focus restoration. The widget appears only on the public surface when a phone number is configured; it never initiates a call automatically.

## Public catalog and editorial follow-up

Product cards now stretch to the row height, reserve consistent heading space on desktop and anchor their text/action footer at the bottom. The image ratio stays 4:3; cards keep a thin lower rule rather than boxed surfaces. Both homepage and product listing share this component.

The product filter is one compact strip with a labelled search, product-group select and name sorting. Search folds Vietnamese accents; clear filters and no-results recovery are available. Current published CMS groups fit one 50-record API page; larger catalogs keep the existing bounded pagination and apply local filters/sorting to the displayed page. Category filtering uses the separate public product-category API across pagination. Default order follows the published catalogue; name sorting and accent-folded search apply within the displayed 50-record page.

Head office information is a burgundy panel alongside a real Google map, separate from manufacturing facilities. Contact places the map under the head-office address beside the enquiry form. Public headers are opaque so scrolled headings no longer show through navigation. Articles use a burgundy header, sticky contents sidebar on desktop, reading-time estimate, structured checklist/blockquote styles and a collaboration CTA. On mobile the contents and article stack. Anchor scroll margins account for the sticky navigation. Burgundy also accents section rules, results headings and action links; admin colors are unchanged.

## Content-only CMS popup

Homepage appearance and hero configuration are developer-owned in `src/content/sitePresentation.ts` and layout/CSS. The sidebar exposes editorial/business content and access management, without homepage/hero/global settings controls. Content creation/editing opens a centred native dialog with a bounded 1120 px width and 860 px desktop height, compact header/close control, scrollable form and visible sticky save/publish footer. Mobile uses 10 px side margins and stacked fields. Native focus containment, background scroll lock, Escape and discard confirmation keep the context clear. Product categories use their own resource and picker. The admin contact table also shows email notification state independently of the enquiry workflow status.
