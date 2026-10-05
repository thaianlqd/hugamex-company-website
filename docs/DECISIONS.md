# Decisions
1. Single Spring Boot monolith; no deployment. Java 21 is installed at /opt/homebrew/opt/openjdk@21.
2. No credentials required for source work. Dev email writes protected local files; production requires SMTP and cryptographic keys. Local keys generated once by a script, never committed.
3. JPA validates identity mapping; explicit JdbcTemplate SQL handles locked session/OTP/RBAC workflows and content queries. This avoids large JPA graphs and provides visible ownership/status filters.
4. Corporate resources use normalized shared `content_items` / `content_translations` with a constrained kind (POST, PAGE, BRANCH, PRODUCT, PARTNER, CERTIFICATION, CATEGORY, HERO). This replaces repetitive resource tables without a generic page-builder. Metadata is narrowly validated per kind. Posts have normalized category join. Homepage sections are separately persisted.
5. Old site contains legacy telephone formats and inconsistent historical statistics; no numeric metrics, active certificate or partner claims will be promoted without client confirmation. No automatic article import.

6. User explicitly approved temporary internet image links on 2026-10-05. Pexels stock links are used for the preview, with a local SVG fallback. They are not HUGAMEX factory photos; replace with approved uploaded DB media before production. No further image generation.

7. Docker 29 rejects the old API client in Testcontainers 1.21.3. Testcontainers is upgraded to 1.21.4; PostgreSQL integration coverage is preserved (no H2 substitution). Upstream: https://github.com/testcontainers/testcontainers-java/issues/11235 . Vitest upgraded to 4.1.11 after dependency audit.

8. Update Spring Boot within the requested 3.x family to 3.5.16, verified against Maven Central metadata and the official managed dependency table on 2026-10-05. No migration to Boot 4. Spring Security 6.5.11 fixes the SAML output advisory; the DPoP-specific CVE-2026-41707 remains a dependency advisory but this application does not enable DPoP. Reassess maintained 3.x support before production. Sources: https://docs.spring.io/spring-boot/3.5/appendix/dependency-versions/coordinates.html and https://spring.io/security/cve-2026-41707/ .

9. User profile reads use UserRepository and a MapStruct DTO that excludes password hashes. Lombok/MapStruct processor coordination uses lombok-mapstruct-binding 0.2.0, required by the official guide: https://mapstruct.org/documentation/stable/reference/html/#_lombok . Locked authentication/session mutations remain explicit JDBC transactions.
