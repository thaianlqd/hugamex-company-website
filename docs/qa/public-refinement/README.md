# Public headquarters, catalog and article refinement

2026-10-05. Captures use the actual public Supabase-backed Spring API. No owner login, credentials or MFA setup is used. Photography remains temporary stock material.

| Screen | Desktop | Mobile |
| --- | --- | --- |
| Homepage/card alignment | [1440 px](home-1440.png) | [390 px](home-390.png) |
| Product filters/cards | [1440 px](products-1440.png) | [390 px](products-390.png) |
| Head office and factories | [1440 px](network-1440.png) | [390 px](network-390.png) |
| Contact and Google map | [1440 px](contact-1440.png) | [390 px](contact-390.png) |
| Expanded article | [1440 px](article-1440.png) | [390 px](article-390.png) |
| Quick contact/directions | [1440 px](quick-contact-1440.png) | [390 px](quick-contact-390.png) |

Reports: [layouts and interactions](report.json), [popover keyboard/layout](quick-contact-report.json). Google map screenshots show the loaded external map, not a fabricated placeholder. Factory region-only addresses are not precise GPS locations.

Replay from the repository root with the normal local API/public Vite running:

```sh
node scripts/preview-content/public-refinement-qa.mjs
node scripts/preview-content/quick-contact-qa.mjs
```
