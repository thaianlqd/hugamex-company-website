# Development

Prerequisites Node >=20.19, Java 21, Maven, Docker PostgreSQL. Exact setup, CMS access, build and test commands are in the root [README](../README.md).

User runs Vite locally. Backend is started with `scripts/backend.sh`, which loads ignored local environment values, selects installed Java 21 on this Mac, and removes an inherited DEBUG environment flag to avoid verbose framework logging. `.tools/m2` contains the project-local Maven cache; changing it is optional.

Do not replace existing `.env` files or regenerate application keys against a populated DB. Google is disabled until client configuration is present. Development email stays in protected local files, never the console. Bootstrap variables should be empty after the first local admin is created.

Testcontainers uses Docker's active context and does not reuse the website database. Browser tests intentionally create labelled fixtures through real APIs in the local dev DB. Playwright trace and automatic auth screenshots are disabled to keep credentials/codes out of artifacts; explicit screenshots contain only public pages. QA credentials/recovery codes are protected in ignored `.local/e2e.json`.

The fixture seed script downloads fixed temporary stock URLs and uploads them through the authenticated media API. This exercises BYTEA persistence, not remote-image ingestion by the backend. Placeholder notices must remain until the client approves/replaces the content.

When adding a new table or resource: add a new Flyway migration, update the constrained resource/metadata rules, scope RLS/grants, add DTOs and authorization tests, and document the content/editor workflow. Do not edit applied migrations or invent current company facts.
