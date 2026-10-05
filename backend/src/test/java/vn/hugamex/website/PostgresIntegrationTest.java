package vn.hugamex.website;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.*;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import vn.hugamex.website.auth.*;
import vn.hugamex.website.common.*;
import vn.hugamex.website.content.*;
import vn.hugamex.website.media.*;
import vn.hugamex.website.security.*;
import vn.hugamex.website.user.*;

@SpringBootTest
@AutoConfigureMockMvc(
    print = org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint.NONE)
@ActiveProfiles("test")
@Testcontainers
class PostgresIntegrationTest {
  @Container
  static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>("postgres:17-alpine");

  static String key() {
    return Base64.getEncoder().encodeToString(new java.security.SecureRandom().generateSeed(32));
  }

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", PG::getJdbcUrl);
    r.add("spring.datasource.username", PG::getUsername);
    r.add("spring.datasource.password", PG::getPassword);
    for (String p : List.of("app.jwt-key", "app.token-key", "app.otp-key", "app.mfa-key")) {
      String value = key();
      r.add(p, () -> value);
    }
    r.add("debug", () -> false);
    r.add("app.origins", () -> "http://127.0.0.1:5173");
    r.add("app.frontend-url", () -> "http://127.0.0.1:5173");
  }

  @Autowired MockMvc mvc;
  @Autowired JdbcTemplate db;
  @Autowired ObjectMapper json;
  @Autowired AuthService auth;
  @Autowired SessionService sessions;
  @Autowired MfaService mfa;
  @Autowired Totp totp;
  @Autowired Crypto crypto;
  @Autowired ContentService content;
  @Autowired MediaService media;
  @Autowired PasswordEncoder encoder;
  @Autowired AdminUserService users;
  @Autowired GoogleService google;
  @MockitoSpyBean EmailService mail;
  String password = "Test password phrase 2026";

  @BeforeEach
  void clean() {
    db.execute("TRUNCATE users,rate_limit_buckets CASCADE");
  }

  UUID user(String role) {
    UUID id = UUID.randomUUID();
    db.update(
        "INSERT INTO users(id,email,name,password_hash,verified) VALUES (?,?,?, ?,true)",
        id,
        id + "@example.invalid",
        "Test fixture",
        encoder.encode(password));
    db.update("INSERT INTO user_roles VALUES (?,?)", id, role);
    return id;
  }

  Actor actor(UUID uid, String role, boolean verified) {
    var s = sessions.create(uid);
    if (verified)
      db.update("UPDATE refresh_sessions SET mfa_verified=true WHERE id=?", s.sessionId());
    return new Actor(uid, s.sessionId(), Set.of(role), verified, Instant.now());
  }

  String bearer(UUID uid, boolean verified) {
    var s = sessions.create(uid);
    if (verified)
      db.update("UPDATE refresh_sessions SET mfa_verified=true WHERE id=?", s.sessionId());
    return s.accessToken();
  }

  String email(UUID uid) {
    return db.queryForObject("SELECT email FROM users WHERE id=?", String.class, uid);
  }

  String code(UUID id) throws Exception {
    return Files.readAllLines(Path.of(".dev-mail", id + ".txt")).stream()
        .filter(s -> s.startsWith("OTP: "))
        .findFirst()
        .orElseThrow()
        .substring(5);
  }

  AuthService.Challenge register(String email) {
    return auth.register(
        new AuthRequests.Register(email, password, "Test fixture"), UUID.randomUUID().toString());
  }

  @Test
  void authSendsPurposeBoundOtpThroughSelectedEmailService() {
    String address = UUID.randomUUID() + "@example.invalid";
    var verification = register(address);
    org.mockito.Mockito.verify(mail)
        .send(
            org.mockito.ArgumentMatchers.eq(address),
            org.mockito.ArgumentMatchers.eq("EMAIL_VERIFICATION"),
            org.mockito.ArgumentMatchers.eq(verification.challengeId()),
            org.mockito.ArgumentMatchers.matches("\\d{6}"));
    var reset =
        auth.send(
            new AuthRequests.EmailOnly(address), "PASSWORD_RESET", UUID.randomUUID().toString());
    org.mockito.Mockito.verify(mail)
        .send(
            org.mockito.ArgumentMatchers.eq(address),
            org.mockito.ArgumentMatchers.eq("PASSWORD_RESET"),
            org.mockito.ArgumentMatchers.eq(reset.challengeId()),
            org.mockito.ArgumentMatchers.matches("\\d{6}"));
  }

  @Test
  void smtpFailureDoesNotExposeExistingAccountInForgotPasswordResponse() {
    UUID id = user("USER");
    org.mockito.Mockito.doThrow(new EmailDeliveryException())
        .when(mail)
        .send(
            org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.eq("PASSWORD_RESET"),
            org.mockito.ArgumentMatchers.any(UUID.class),
            org.mockito.ArgumentMatchers.anyString());
    var existing =
        auth.send(
            new AuthRequests.EmailOnly(email(id)), "PASSWORD_RESET", UUID.randomUUID().toString());
    var missing =
        auth.send(
            new AuthRequests.EmailOnly(UUID.randomUUID() + "@example.invalid"),
            "PASSWORD_RESET",
            UUID.randomUUID().toString());
    assertEquals(missing.message(), existing.message());
    assertNotNull(existing.challengeId());
    assertEquals(
        1L,
        db.queryForObject(
            "SELECT count(*) FROM email_otp_challenges WHERE id=? AND purpose='PASSWORD_RESET' AND reset_token_hash IS NULL AND attempts=0 AND expires_at>now()",
            Long.class,
            existing.challengeId()));
  }

  ContentRequests.Save articleFixture(String slug) {
    return new ContentRequests.Save(
        "vi",
        "Test article",
        slug,
        "Test excerpt",
        json.createObjectNode()
            .put("type", "doc")
            .set(
                "content",
                json.createArrayNode()
                    .add(
                        json.createObjectNode()
                            .put("type", "paragraph")
                            .set(
                                "content",
                                json.createArrayNode()
                                    .add(
                                        json.createObjectNode()
                                            .put("type", "text")
                                            .put("text", "Test content"))))),
        "SEO title",
        "SEO description",
        null,
        false,
        Map.of(),
        List.of());
  }

  @Test
  void migrationsValidateAndMediaIsBytea() {
    assertEquals(
        4L,
        db.queryForObject(
            "SELECT count(*) FROM flyway_schema_history WHERE success=true", Long.class));
    assertEquals(
        "bytea",
        db.queryForObject(
            "SELECT data_type FROM information_schema.columns WHERE table_name='media_files' AND column_name='data'",
            String.class));
    assertEquals(4L, db.queryForObject("SELECT count(*) FROM roles", Long.class));
  }

  @Test
  void registrationHashesPasswordAssignsOnlyUserAndVerificationWorks() throws Exception {
    String email = "new@example.invalid";
    var c = register(email);
    String hash =
        db.queryForObject("SELECT password_hash FROM users WHERE email=?", String.class, email);
    assertNotEquals(password, hash);
    assertTrue(encoder.matches(password, hash));
    UUID uid = db.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, email);
    assertEquals(
        List.of("USER"),
        db.queryForList("SELECT role_name FROM user_roles WHERE user_id=?", String.class, uid));
    auth.verifyEmail(new AuthRequests.Verify(c.challengeId(), code(c.challengeId())), "ip");
    assertTrue(db.queryForObject("SELECT verified FROM users WHERE id=?", Boolean.class, uid));
    assertNotNull(auth.login(new AuthRequests.Login(email, password), "ip").accessToken());
  }

  @Test
  void duplicateEmailDoesNotReplacePasswordOrRevealAccount() {
    String email = "duplicate@example.invalid";
    register(email);
    var c =
        auth.register(
            new AuthRequests.Register(email, "Another password phrase", "Other"), "other-ip");
    assertNotNull(c.challengeId());
    assertEquals(
        1L, db.queryForObject("SELECT count(*) FROM users WHERE email=?", Long.class, email));
    assertTrue(
        encoder.matches(
            password,
            db.queryForObject(
                "SELECT password_hash FROM users WHERE email=?", String.class, email)));
  }

  @Test
  void passwordValidation() {
    assertThrows(
        ApiException.class,
        () ->
            auth.register(
                new AuthRequests.Register("weak@example.invalid", "short", "Test"), "ip"));
  }

  @Test
  void wrongOtpAttemptsPersistAndLockAfterFive() throws Exception {
    var c = register("wrong@example.invalid");
    String correct = code(c.challengeId());
    String wrong = correct.equals("000000") ? "000001" : "000000";
    for (int i = 0; i < 5; i++)
      assertThrows(
          ApiException.class,
          () -> auth.verifyEmail(new AuthRequests.Verify(c.challengeId(), wrong), "ip"));
    assertEquals(
        5,
        db.queryForObject(
            "SELECT attempts FROM email_otp_challenges WHERE id=?",
            Integer.class,
            c.challengeId()));
    assertThrows(
        ApiException.class,
        () -> auth.verifyEmail(new AuthRequests.Verify(c.challengeId(), correct), "ip"));
  }

  @Test
  void expiredOtpRejected() throws Exception {
    var c = register("expired@example.invalid");
    String code = code(c.challengeId());
    db.update(
        "UPDATE email_otp_challenges SET expires_at=now()-interval '1 second' WHERE id=?",
        c.challengeId());
    assertThrows(
        ApiException.class,
        () -> auth.verifyEmail(new AuthRequests.Verify(c.challengeId(), code), "ip"));
  }

  @Test
  void reusedOtpRejected() throws Exception {
    var c = register("reused@example.invalid");
    var verify = new AuthRequests.Verify(c.challengeId(), code(c.challengeId()));
    auth.verifyEmail(verify, "ip");
    assertThrows(ApiException.class, () -> auth.verifyEmail(verify, "ip"));
  }

  @Test
  void otpBoundToPurpose() throws Exception {
    var c = register("purpose@example.invalid");
    String code = code(c.challengeId());
    assertThrows(
        ApiException.class,
        () -> auth.verifyReset(new AuthRequests.Verify(c.challengeId(), code), "ip"));
  }

  @Test
  void resendCooldown() {
    var c = register("cooldown@example.invalid");
    assertNotNull(c);
    assertThrows(
        ApiException.class,
        () ->
            auth.send(
                new AuthRequests.EmailOnly("cooldown@example.invalid"),
                "EMAIL_VERIFICATION",
                "ip"));
  }

  @Test
  void forgotResponseDoesNotRevealAccount() {
    UUID uid = user("USER");
    var existing = auth.send(new AuthRequests.EmailOnly(email(uid)), "PASSWORD_RESET", "ip1");
    var missing =
        auth.send(new AuthRequests.EmailOnly("missing@example.invalid"), "PASSWORD_RESET", "ip2");
    assertEquals(existing.message(), missing.message());
  }

  @Test
  void resetSingleUseAndRevokesOldSessions() throws Exception {
    UUID uid = user("USER");
    var s = sessions.create(uid);
    var c = auth.send(new AuthRequests.EmailOnly(email(uid)), "PASSWORD_RESET", "ip");
    String token =
        auth.verifyReset(new AuthRequests.Verify(c.challengeId(), code(c.challengeId())), "ip");
    var r = new AuthRequests.Reset(token, "Updated password phrase 2026");
    auth.reset(r, "ip");
    assertThrows(ApiException.class, () -> auth.reset(r, "ip"));
    assertThrows(ApiException.class, () -> sessions.refresh(s.refreshToken()));
    mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + s.accessToken()))
        .andExpect(status().isUnauthorized());
    assertTrue(
        encoder.matches(
            r.password(),
            db.queryForObject("SELECT password_hash FROM users WHERE id=?", String.class, uid)));
  }

  @Test
  void invalidLoginAndDisabledUserRejected() {
    UUID uid = user("USER");
    assertThrows(
        ApiException.class, () -> auth.login(new AuthRequests.Login(email(uid), "wrong"), "ip"));
    db.update("UPDATE users SET status='DISABLED' WHERE id=?", uid);
    assertThrows(
        ApiException.class, () -> auth.login(new AuthRequests.Login(email(uid), password), "ip2"));
  }

  @Test
  void unverifiedCannotLogin() {
    register("unverified@example.invalid");
    assertThrows(
        ApiException.class,
        () -> auth.login(new AuthRequests.Login("unverified@example.invalid", password), "ip"));
  }

  @Test
  void refreshRotationAndReuseRevokesFamily() {
    UUID uid = user("USER");
    var old = sessions.create(uid);
    var next = sessions.refresh(old.refreshToken());
    assertNotEquals(old.refreshToken(), next.refreshToken());
    assertThrows(ApiException.class, () -> sessions.refresh(old.refreshToken()));
    assertThrows(ApiException.class, () -> sessions.refresh(next.refreshToken()));
    assertNotEquals(
        next.refreshToken(),
        db.queryForObject(
            "SELECT token_hash FROM refresh_sessions WHERE id=?", String.class, next.sessionId()));
  }

  @Test
  void logoutRevokesSession() throws Exception {
    UUID uid = user("USER");
    var s = sessions.create(uid);
    sessions.logout(s.refreshToken());
    mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + s.accessToken()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void csrfRequiredOnCookieTransitions() throws Exception {
    mvc.perform(post("/api/v1/auth/refresh")).andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/auth/logout")).andExpect(status().isForbidden());
  }

  @Test
  void loginSetsHttpOnlyCookieAndDoesNotExposeRefreshToken() throws Exception {
    UUID uid = user("USER");
    var result =
        mvc.perform(
                post("/api/v1/auth/login")
                    .with(csrf())
                    .contentType("application/json")
                    .content(json.writeValueAsString(new AuthRequests.Login(email(uid), password))))
            .andExpect(status().isOk())
            .andReturn();
    assertTrue(result.getResponse().getHeader("Set-Cookie").contains("HttpOnly"));
    assertTrue(result.getResponse().getHeader("Set-Cookie").contains("SameSite=Lax"));
    assertFalse(result.getResponse().getContentAsString().contains("refreshToken"));
  }

  @Test
  void userCannotAccessAdmin() throws Exception {
    mvc.perform(
            get("/api/v1/admin/posts")
                .header("Authorization", "Bearer " + bearer(user("USER"), false)))
        .andExpect(status().isForbidden());
  }

  @Test
  void editorRestrictionsAndAdminMfa() throws Exception {
    String editor = bearer(user("EDITOR"), false);
    mvc.perform(get("/api/v1/admin/posts").header("Authorization", "Bearer " + editor))
        .andExpect(status().isOk());
    mvc.perform(get("/api/v1/admin/branches").header("Authorization", "Bearer " + editor))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/admin/users").header("Authorization", "Bearer " + editor))
        .andExpect(status().isForbidden());
    String admin = bearer(user("ADMIN"), false);
    mvc.perform(get("/api/v1/admin/posts").header("Authorization", "Bearer " + admin))
        .andExpect(status().isForbidden());
  }

  @Test
  void adminCannotPromoteSuperAdminOrAccessAudit() throws Exception {
    UUID target = user("USER");
    String admin = bearer(user("ADMIN"), true);
    mvc.perform(
            patch("/api/v1/admin/users/" + target + "/role")
                .header("Authorization", "Bearer " + admin)
                .contentType("application/json")
                .content("{\"role\":\"SUPER_ADMIN\"}"))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/admin/audit-logs").header("Authorization", "Bearer " + admin))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/v1/admin/users")
                .header("Authorization", "Bearer " + admin)
                .contentType("application/json")
                .content(
                    "{\"email\":\"escalate@example.invalid\",\"name\":\"Test\",\"role\":\"SUPER_ADMIN\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void lastSuperAdminProtected() {
    UUID uid = user("SUPER_ADMIN");
    Actor a = actor(uid, "SUPER_ADMIN", true);
    assertThrows(ApiException.class, () -> users.role(a, uid, "ADMIN"));
    assertThrows(ApiException.class, () -> users.status(a, uid, "DISABLED"));
  }

  @Test
  void superAdminAllowedAndRecentAuthenticationRequired() throws Exception {
    UUID uid = user("SUPER_ADMIN");
    Actor a = actor(uid, "SUPER_ADMIN", true);
    mvc.perform(
            get("/api/v1/admin/audit-logs").header("Authorization", "Bearer " + bearer(uid, true)))
        .andExpect(status().isOk());
    UUID target = user("USER");
    users.role(a, target, "EDITOR");
    assertEquals(
        "EDITOR",
        db.queryForObject(
            "SELECT role_name FROM user_roles WHERE user_id=?", String.class, target));
    Actor stale = new Actor(uid, a.sessionId(), a.roles(), true, Instant.now().minusSeconds(600));
    assertThrows(ApiException.class, () -> users.role(stale, target, "ADMIN"));
  }

  @Test
  void invalidRoleAndMassAssignmentRejected() throws Exception {
    String token = bearer(user("SUPER_ADMIN"), true);
    mvc.perform(
            patch("/api/v1/admin/users/" + user("USER") + "/role")
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .content("{\"role\":\"ROOT\"}"))
        .andExpect(status().isBadRequest());
    mvc.perform(
            post("/api/v1/auth/register")
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"email\":\"mass@example.invalid\",\"password\":\"Test password phrase\",\"name\":\"Test\",\"role\":\"SUPER_ADMIN\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void mfaSetupEncryptedVerifyAndRecoverySingleUse() {
    UUID uid = user("ADMIN");
    Actor a = actor(uid, "ADMIN", false);
    String secret = mfa.setup(a).get("secret");
    assertNotEquals(
        secret,
        db.queryForObject(
            "SELECT encrypted_secret FROM mfa_totp WHERE user_id=?", String.class, uid));
    String code = totp.code(secret, Instant.now().getEpochSecond() / 30);
    List<String> codes = mfa.verify(a, code, true);
    assertEquals(8, codes.size());
    assertThrows(ApiException.class, () -> mfa.verify(a, code, false));
    mfa.recover(a, codes.getFirst());
    assertThrows(ApiException.class, () -> mfa.recover(a, codes.getFirst()));
    assertTrue(
        db.queryForObject(
            "SELECT mfa_verified FROM refresh_sessions WHERE id=?", Boolean.class, a.sessionId()));
  }

  @Test
  void oldRecoveryCodesInvalidAfterRegeneration() {
    UUID uid = user("ADMIN");
    Actor a = actor(uid, "ADMIN", false);
    String secret = mfa.setup(a).get("secret");
    List<String> old = mfa.verify(a, totp.code(secret, Instant.now().getEpochSecond() / 30), true);
    Actor verified = new Actor(a.id(), a.sessionId(), a.roles(), true, a.authenticatedAt());
    List<String> next = mfa.regenerate(verified);
    assertThrows(ApiException.class, () -> mfa.recover(a, old.getFirst()));
    assertDoesNotThrow(() -> mfa.recover(a, next.getFirst()));
  }

  @Test
  void draftAndArchiveHiddenPublishedVisibleAndUniqueSlug() {
    UUID uid = user("EDITOR");
    Actor a = actor(uid, "EDITOR", false);
    var item = content.save("POST", null, articleFixture("test-article"), a);
    assertThrows(ApiException.class, () -> content.detail("POST", "test-article", "vi"));
    content.status("POST", item.id(), "PUBLISHED", a);
    assertEquals(item.id(), content.detail("POST", "test-article", "vi").id());
    assertThrows(
        org.springframework.dao.DataIntegrityViolationException.class,
        () -> content.save("POST", null, articleFixture("test-article"), a));
    content.status("POST", item.id(), "ARCHIVED", a);
    assertThrows(ApiException.class, () -> content.detail("POST", "test-article", "vi"));
  }

  @Test
  void invalidRichTextAndJavascriptUrlRejected() {
    UUID uid = user("EDITOR");
    Actor a = actor(uid, "EDITOR", false);
    var p = articleFixture("unsafe");
    var bad =
        new ContentRequests.Save(
            "vi",
            p.title(),
            p.slug(),
            p.excerpt(),
            json.createObjectNode().put("type", "script"),
            p.seoTitle(),
            p.seoDescription(),
            null,
            false,
            Map.of(),
            List.of());
    assertThrows(ApiException.class, () -> content.save("POST", null, bad, a));
  }

  @Test
  void mediaRejectsMimeExtensionSignatureAndOversize() {
    UUID uid = user("EDITOR");
    assertThrows(
        ApiException.class,
        () ->
            media.upload(
                new MockMultipartFile("file", "x.svg", "image/svg+xml", "<svg/>".getBytes()),
                "",
                false,
                uid));
    assertThrows(
        ApiException.class,
        () ->
            media.upload(
                new MockMultipartFile(
                    "file", "x.exe", "application/pdf", "%PDF-1.7 content".getBytes()),
                "",
                false,
                uid));
    assertThrows(
        ApiException.class,
        () ->
            media.upload(
                new MockMultipartFile(
                    "file", "x.pdf", "application/pdf", "<html>spoof</html>".getBytes()),
                "",
                false,
                uid));
    assertThrows(
        ApiException.class,
        () ->
            media.upload(
                new MockMultipartFile("file", "x.png", "image/png", new byte[5 * 1024 * 1024 + 1]),
                "",
                false,
                uid));
  }

  @Test
  void privateMediaProtectedAndReferenceDeletionGuarded() throws Exception {
    UUID uid = user("EDITOR");
    var info =
        media.upload(
            new MockMultipartFile(
                "file",
                "x.png",
                "image/png",
                Base64.getDecoder()
                    .decode(
                        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=")),
            "Test",
            false,
            uid);
    mvc.perform(get("/api/v1/media/" + info.id())).andExpect(status().isNotFound());
    mvc.perform(
            get("/api/v1/media/" + info.id())
                .header("Authorization", "Bearer " + bearer(uid, false)))
        .andExpect(status().isOk());
    var p = articleFixture("reference");
    var referenced =
        new ContentRequests.Save(
            p.locale(),
            p.title(),
            p.slug(),
            p.excerpt(),
            p.content(),
            p.seoTitle(),
            p.seoDescription(),
            info.id(),
            false,
            Map.of(),
            List.of());
    var item = content.save("POST", null, referenced, actor(uid, "EDITOR", false));
    assertThrows(ApiException.class, () -> media.delete(info.id(), uid));
    assertThrows(
        ApiException.class,
        () -> content.status("POST", item.id(), "PUBLISHED", actor(uid, "EDITOR", false)));
  }

  @Test
  void publicMediaCacheAndEtag() throws Exception {
    UUID uid = user("EDITOR");
    var info =
        media.upload(
            new MockMultipartFile(
                "file", "x.pdf", "application/pdf", "%PDF-1.7 document".getBytes()),
            "Test",
            true,
            uid);
    var result =
        mvc.perform(get("/api/v1/media/" + info.id())).andExpect(status().isOk()).andReturn();
    mvc.perform(
            get("/api/v1/media/" + info.id())
                .header("If-None-Match", result.getResponse().getHeader("ETag")))
        .andExpect(status().isNotModified());
  }

  @Test
  void contentMediaKindsAndCertificateReferencesAreValidated() {
    UUID uid = user("ADMIN");
    var a = actor(uid, "ADMIN", true);
    var pdf =
        media.upload(
            new MockMultipartFile(
                "file", "x.pdf", "application/pdf", "%PDF-1.7 fixture".getBytes()),
            "Document",
            true,
            uid);
    var image =
        media.upload(
            new MockMultipartFile(
                "file",
                "x.png",
                "image/png",
                Base64.getDecoder()
                    .decode(
                        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=")),
            "Image",
            true,
            uid);
    var p = articleFixture("media-kinds");
    assertThrows(
        ApiException.class,
        () ->
            content.save(
                "POST",
                null,
                new ContentRequests.Save(
                    p.locale(),
                    p.title(),
                    p.slug(),
                    p.excerpt(),
                    p.content(),
                    p.seoTitle(),
                    p.seoDescription(),
                    pdf.id(),
                    false,
                    Map.of(),
                    List.of()),
                a));
    assertThrows(
        ApiException.class,
        () ->
            content.save(
                "CERTIFICATION",
                null,
                new ContentRequests.Save(
                    p.locale(),
                    p.title(),
                    p.slug(),
                    p.excerpt(),
                    p.content(),
                    p.seoTitle(),
                    p.seoDescription(),
                    null,
                    false,
                    Map.of("documentMediaId", image.id().toString()),
                    List.of()),
                a));
    var certificate =
        content.save(
            "CERTIFICATION",
            null,
            new ContentRequests.Save(
                p.locale(),
                p.title(),
                p.slug(),
                p.excerpt(),
                p.content(),
                p.seoTitle(),
                p.seoDescription(),
                image.id(),
                false,
                Map.of("documentMediaId", pdf.id().toString()),
                List.of()),
            a);
    content.status("CERTIFICATION", certificate.id(), "PUBLISHED", a);
    assertThrows(ApiException.class, () -> media.delete(pdf.id(), uid));
    assertThrows(ApiException.class, () -> media.update(pdf.id(), "Document", false, uid));
  }

  @Test
  void mediaMetadataProtectsPublishedReferences() {
    UUID uid = user("EDITOR");
    var a = actor(uid, "EDITOR", false);
    var uploaded =
        media.upload(
            new MockMultipartFile(
                "file",
                "x.png",
                "image/png",
                Base64.getDecoder()
                    .decode(
                        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=")),
            "Original",
            true,
            uid);
    var p = articleFixture("media-update");
    var item =
        content.save(
            "POST",
            null,
            new ContentRequests.Save(
                p.locale(),
                p.title(),
                p.slug(),
                p.excerpt(),
                p.content(),
                p.seoTitle(),
                p.seoDescription(),
                uploaded.id(),
                false,
                Map.of(),
                List.of()),
            a);
    content.status("POST", item.id(), "PUBLISHED", a);
    media.update(uploaded.id(), "Updated description", true, uid);
    assertEquals(
        "Updated description", content.detail("POST", "media-update", "vi").featuredMediaAlt());
    assertThrows(ApiException.class, () -> media.update(uploaded.id(), "Updated", false, uid));
    content.status("POST", item.id(), "DRAFT", a);
    assertFalse(media.update(uploaded.id(), "Private", false, uid).isPublic());
  }

  @Test
  void platformGuestCannotReadBusinessRowsEvenWithAccidentalSelectGrant() {
    user("USER");
    db.execute(
        (org.springframework.jdbc.core.ConnectionCallback<Void>)
            connection -> {
              try (var statement = connection.createStatement()) {
                statement.execute("CREATE ROLE hugamex_test_guest NOLOGIN");
                statement.execute("GRANT SELECT ON users TO hugamex_test_guest");
                try {
                  statement.execute("SET ROLE hugamex_test_guest");
                  try (var rows = statement.executeQuery("SELECT count(*) FROM users")) {
                    rows.next();
                    assertEquals(0, rows.getLong(1));
                  }
                } finally {
                  statement.execute("RESET ROLE");
                  statement.execute("REVOKE SELECT ON users FROM hugamex_test_guest");
                  statement.execute("DROP ROLE hugamex_test_guest");
                }
              }
              return null;
            });
  }

  @Test
  void translatedDetailsUseStableCanonicalRoute() {
    UUID uid = user("EDITOR");
    var a = actor(uid, "EDITOR", false);
    var p = articleFixture("stable-vietnamese-route");
    var item = content.save("POST", null, p, a);
    content.save(
        "POST",
        item.id(),
        new ContentRequests.Save(
            "en",
            "English title",
            "translated-english-slug",
            p.excerpt(),
            p.content(),
            p.seoTitle(),
            p.seoDescription(),
            null,
            false,
            Map.of(),
            List.of()),
        a);
    content.status("POST", item.id(), "PUBLISHED", a);
    var translated = content.detail("POST", "stable-vietnamese-route", "en");
    assertEquals("English title", translated.title());
    assertEquals("stable-vietnamese-route", translated.canonicalSlug());
    assertEquals(item.id(), content.detail("POST", "translated-english-slug", "vi").id());
  }

  @Test
  void sitemapIncludesOnlyPublishedContent() throws Exception {
    UUID uid = user("EDITOR");
    var a = actor(uid, "EDITOR", false);
    var published = content.save("POST", null, articleFixture("sitemap-published"), a);
    content.save("POST", null, articleFixture("sitemap-draft"), a);
    content.status("POST", published.id(), "PUBLISHED", a);
    var result =
        mvc.perform(get("/api/v1/public/sitemap.xml")).andExpect(status().isOk()).andReturn();
    String xml = result.getResponse().getContentAsString();
    assertTrue(xml.contains("/tin-tuc/sitemap-published"));
    assertFalse(xml.contains("sitemap-draft"));
    assertFalse(xml.contains("/admin"));
    javax.xml.parsers.DocumentBuilderFactory.newInstance()
        .newDocumentBuilder()
        .parse(
            new java.io.ByteArrayInputStream(
                xml.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
  }

  @Test
  void contactValidationAndRateLimit() throws Exception {
    mvc.perform(post("/api/v1/contact").with(csrf()).contentType("application/json").content("{}"))
        .andExpect(status().isBadRequest());
    String c =
        "{\"fullName\":\"Test\",\"company\":\"\",\"email\":\"contact@example.invalid\",\"phone\":\"\",\"subject\":\"Test enquiry\",\"message\":\"Test message\",\"website\":\"\"}";
    for (int i = 0; i < 3; i++)
      mvc.perform(post("/api/v1/contact").with(csrf()).contentType("application/json").content(c))
          .andExpect(status().isOk());
    mvc.perform(post("/api/v1/contact").with(csrf()).contentType("application/json").content(c))
        .andExpect(status().isTooManyRequests());
  }

  @Test
  void googleDoesNotSilentlyLinkLocalAccount() {
    UUID uid = user("USER");
    var g =
        org.mockito.Mockito.mock(org.springframework.security.oauth2.core.oidc.user.OidcUser.class);
    org.mockito.Mockito.when(g.getEmailVerified()).thenReturn(true);
    org.mockito.Mockito.when(g.getEmail()).thenReturn(email(uid));
    org.mockito.Mockito.when(g.getSubject()).thenReturn("google-test-subject");
    assertThrows(ApiException.class, () -> google.login(g));
    assertEquals(0L, db.queryForObject("SELECT count(*) FROM auth_identities", Long.class));
  }

  @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;

  @Test
  void sessionRevocationSerializesConcurrentRefresh() throws Exception {
    UUID uid = user("USER");
    var session = sessions.create(uid);
    var locked = new java.util.concurrent.CountDownLatch(1);
    var release = new java.util.concurrent.CountDownLatch(1);
    try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
      var revoke =
          pool.submit(
              () ->
                  new org.springframework.transaction.support.TransactionTemplate(
                          transactionManager)
                      .executeWithoutResult(
                          tx -> {
                            db.queryForObject(
                                "SELECT id FROM users WHERE id=? FOR UPDATE", UUID.class, uid);
                            sessions.revoke(uid);
                            locked.countDown();
                            try {
                              if (!release.await(5, java.util.concurrent.TimeUnit.SECONDS))
                                throw new IllegalStateException("Test timeout");
                            } catch (InterruptedException e) {
                              Thread.currentThread().interrupt();
                              throw new IllegalStateException(e);
                            }
                          }));
      assertTrue(locked.await(5, java.util.concurrent.TimeUnit.SECONDS));
      var refresh = pool.submit(() -> sessions.refresh(session.refreshToken()));
      release.countDown();
      revoke.get(5, java.util.concurrent.TimeUnit.SECONDS);
      var failed =
          assertThrows(
              java.util.concurrent.ExecutionException.class,
              () -> refresh.get(5, java.util.concurrent.TimeUnit.SECONDS));
      assertInstanceOf(ApiException.class, failed.getCause());
    }
    assertEquals(
        0L,
        db.queryForObject(
            "SELECT count(*) FROM refresh_sessions WHERE user_id=? AND revoked_at IS NULL",
            Long.class,
            uid));
  }

  @Test
  void homepageConfigurationUpdateWorks() throws Exception {
    UUID uid = user("ADMIN");
    String token = bearer(uid, true);
    String id = "00000000-0000-0000-0000-000000000001";
    mvc.perform(
            put("/api/v1/admin/homepage/" + id)
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .content(
                    "{\"id\":\""
                        + id
                        + "\",\"key\":\"about\",\"enabled\":true,\"position\":0,\"headlineVi\":\"Test title\",\"headlineEn\":\"Test title\",\"subheadlineVi\":\"\",\"subheadlineEn\":\"\",\"contentIds\":[]}"))
        .andExpect(status().isOk());
  }

  // Spring csrf() test helpers replace the filter repository; verify the wire contract in a fresh
  // context.
  @org.springframework.test.annotation.DirtiesContext(
      methodMode = org.springframework.test.annotation.DirtiesContext.MethodMode.BEFORE_METHOD)
  @Test
  void realCsrfCookieHeaderContract() throws Exception {
    UUID uid = user("USER");
    var csrfResult = mvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk()).andReturn();
    String csrfToken =
        json.readTree(csrfResult.getResponse().getContentAsString()).path("token").asText();
    var cookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");
    assertNotNull(cookie);
    mvc.perform(
            post("/api/v1/auth/login")
                .cookie(cookie)
                .header("X-CSRF-TOKEN", csrfToken)
                .contentType("application/json")
                .content(json.writeValueAsString(new AuthRequests.Login(email(uid), password))))
        .andExpect(status().isOk());
  }
}
