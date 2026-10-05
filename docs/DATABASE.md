# Database

Flyway SQL is authoritative. PostgreSQL 17 uses UUID primary keys, UTC timestamptz, structured JSONB, BYTEA, foreign keys, checks and unique constraints. JPA identity validation uses `ddl-auto=validate`; transactional workflows use parameterized JDBC. No browser DB access.

| Tables | Purpose / integrity |
| --- | --- |
| users, roles, user_roles | Lowercase unique email, password hash, ACTIVE/DISABLED, verified status, four constrained roles. No password is returned by APIs. |
| auth_identities | Unique provider + subject; Google identity maps to an internal user, without silent email linking. |
| refresh_sessions | Digest only, rotation family, expiry/revocation, MFA flag and original authentication time. User/family indexes. |
| email_otp_challenges | Purpose/account-bound digest, expiry, persisted attempts, consumption and digest-only reset authorization. |
| mfa_totp, mfa_recovery_codes | AES-GCM encrypted TOTP secret, replay counter; hashed single-use recovery codes. |
| media_files | File metadata, checksum and BYTEA. Binary excluded from list queries; no OID/@Lob. |
| content_items, content_translations | Shared constrained resource kinds; DRAFT/PUBLISHED/ARCHIVED, featured media/actor/time; VI/EN translations unique per entity+locale and locale+slug. Corporate route key is unique. |
| post_categories | Normalized UUID join, validated POST/CATEGORY usage. |
| homepage_sections | Seven fixed section keys, position/visibility, VI/EN copy and at most 12 validated published references of the correct resource kind. |
| contact_messages | User enquiries and NEW/READ/REPLIED/ARCHIVED status. Privileged read access only. |
| site_settings | Allowlisted public contact/social settings. No secrets or arbitrary scripts in this table. |
| audit_logs | Actor/action/resource/id/time; operational API never rewrites past audit rows. No tokens/passwords/OTP content. |
| rate_limit_buckets | Hashed scope keys and atomic window counters; denied attempts persist independently. |

Migrations: V1 schema; V2 deterministic role/homepage seeds; V3 corporate route key constraint; V4 RLS and scoped platform grant revocation. Applied migrations are never edited. Seeded corporate fixtures are dev-only API operations, not migration data or verified business facts.

Content list/homepage queries return summary DTOs with empty rich-text documents; detail/editor endpoints return the full structured document. Category IDs and alt text are retrieved in the same query. Pagination is limited to 50, search length 200; media bytes are fetched only by the binary endpoint.

Security-sensitive workflows lock users/session/challenges; role changes serialize the last-super check with an advisory transaction lock. Content publishing and media mutation use compatible locks. Public media cache is 60 seconds with checksum ETag; private media no-store. Archived content retains references and cannot cause accidental binary deletion.

V4 enables RLS with no guest policy on the 17 application tables and revokes table rights from `anon`/`authenticated` if those platform roles exist. Local migration owner bypasses RLS. Production needs a dedicated authorized server role and a reviewed migration-role/runtime-role split; a plain non-owner role with no policy will be denied. No platform connection has been made.

Before growth: benchmark ILIKE filters, consider trigram indexes after measured need, monitor BYTEA DB size and egress, set retention for expired sessions/challenges/buckets and approved contact retention, test encrypted backup/restore including MFA key. No object storage migration or generic page builder is introduced.
