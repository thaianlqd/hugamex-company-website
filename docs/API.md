# API

Base `/api/v1`. Dev OpenAPI `/v3/api-docs`, Swagger `/swagger-ui/index.html`; both disabled/denied in production. Generated spec is saved as `openapi.json` after verification. DTOs and validation are authoritative; pagination defaults to 12 and accepts at most 50, page >=0.

| Endpoints | Purpose / authorization |
| --- | --- |
| GET /auth/config | Google availability and a refresh-cookie presence hint; presence never authorizes access. |
| GET /auth/csrf | Sets HttpOnly XSRF cookie and returns token for X-CSRF-TOKEN header. |
| POST /auth/register | email/password/name; assigns USER, creates email verification challenge. |
| POST /auth/verify-email, /auth/verify-reset-otp | challengeId/email/code; checks matching purpose/expiry/attempts. Reset verifier returns memory-only resetToken. |
| POST /auth/resend-verification, /auth/forgot-password | email; generic response with challengeId and expiry. |
| POST /auth/reset-password | resetToken/password; single use, revokes all sessions. |
| POST /auth/login, /auth/refresh, /auth/logout | Access JWT response or logout acknowledgement; refresh rotation is in HttpOnly HUGAMEX_REFRESH cookie. All require CSRF. |
| GET /auth/me | Bearer; safe user summary and current MFA state. |
| POST /account/change-password | Bearer; currentPassword/password; revokes all sessions and clears refresh cookie. |
| POST /auth/mfa/setup, /enable, /verify, /recovery, /recovery/regenerate | Bearer; first setup requires recent auth; enable/verify/recovery consume code; regeneration requires recent auth + completed MFA. |
| GET /public/{resource}, /{resource}/{slug} | Published content list/detail with locale=vi/en, search, page, size; posts support category UUID. Corporate pages resolve stable routeKey; details use stable VI canonical slug across translations. |
| GET /public/site, /public/featured/{section} | Published homepage references, fixed sections and allowlisted public settings. |
| GET /public/sitemap.xml | XML of public canonical routes and published VI detail slugs; excludes auth/admin/drafts. |
| POST /contact | CSRF; fullName/company/email/phone/subject/message/website honeypot. Saves enquiry; never sends mail to arbitrary addresses. |
| GET /media/{id} | Public binary or CMS-authorized private binary. Safe MIME, disposition, ETag, cache policy. |
| GET/POST /admin/{resource}; GET/PUT /admin/{resource}/{id}; PATCH /admin/{resource}/{id}/status | EDITOR: posts/pages/categories. ADMIN/SUPER_ADMIN with MFA: all content resources. Save DTO excludes actor/status/publish date. Status enum DRAFT/PUBLISHED/ARCHIVED. |
| GET/POST /admin/media; PATCH/DELETE /admin/media/{id} | CMS; multipart upload file/altText/isPublic, metadata update; referenced deletion blocked. |
| GET /admin/homepage; PUT /admin/homepage/{id} | ADMIN/SUPER_ADMIN with MFA; immutable fixed section identity; validated content references. |
| GET /admin/contact-messages; PATCH /admin/contact-messages/{id} | Business CMS only; search/status/pagination and status update. |
| GET/POST /admin/users; PATCH /admin/users/{id}/status | Business CMS; ADMIN cannot manage privileged accounts. Creation sends verification, then user sets password via reset. |
| PATCH /admin/users/{id}/role; POST /admin/users/{id}/reset-mfa | SUPER_ADMIN + MFA + recent auth; sessions revoked; last-active-super protection. |
| GET /admin/roles, /admin/audit-logs | SUPER_ADMIN with MFA; immutable role catalogue and paginated audit read. |
| GET/PUT /admin/settings | SUPER_ADMIN with MFA; update also requires recent auth. No secrets or arbitrary keys. |
| GET /admin/dashboard | CMS role-aware summary; enquiry counts hidden from EDITOR. |

Resources: posts, pages, categories, branches, products, partners, certifications, hero-slides. Public category/hero resources are list only. Content status transitions use a separate endpoint. Soft archive replaces hard content delete.

CSRF flow: GET `/auth/csrf`, retain returned cookie, pass JSON `token` in `X-CSRF-TOKEN` for cookie/public contact mutations. A cross-origin client must use credentials and an explicitly allowed origin. Bearer-only admin/account/MFA requests do not rely on cookie authentication. OAuth entry `/oauth2/authorization/google`, callback `/login/oauth2/code/google` are framework-managed and enabled only when configured; state/PKCE/OIDC validation is framework-side.

Errors are RFC ProblemDetail-style JSON with status/detail and field errors where appropriate. Common status: 400 invalid input, 401 session/account unavailable, 403 permission/MFA/CSRF, 404 unpublished/missing/private media, 409 unique/reference/last-super constraint, 413 upload too large, 429 rate limit, 503 DB unavailable during bearer verification. SQL/stack/request secrets are not returned.

Binary media is never embedded in JSON responses. Avoid caching auth/private requests. No browser Supabase endpoint or database key exists.
