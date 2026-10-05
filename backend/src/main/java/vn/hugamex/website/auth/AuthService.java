package vn.hugamex.website.auth;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import vn.hugamex.website.audit.*;
import vn.hugamex.website.common.*;
import vn.hugamex.website.security.*;

@Service
public class AuthService {
  private final JdbcTemplate db;
  private final PasswordEncoder passwords;
  private final Crypto crypto;
  private final EmailService mail;
  private final SessionService sessions;
  private final RateLimiter rate;
  private final AuditService audit;
  private final Clock clock;
  private final String dummy;

  public AuthService(
      JdbcTemplate db,
      PasswordEncoder passwords,
      Crypto crypto,
      EmailService mail,
      SessionService sessions,
      RateLimiter rate,
      AuditService audit,
      Clock clock) {
    this.db = db;
    this.passwords = passwords;
    this.crypto = crypto;
    this.mail = mail;
    this.sessions = sessions;
    this.rate = rate;
    this.audit = audit;
    this.clock = clock;
    dummy = passwords.encode(crypto.randomToken());
  }

  public static void password(String p) {
    if (p == null
        || p.length() < 12
        || p.length() > 128
        || Set.of("passwordpassword", "123456789012", "qwertyuiop12").contains(p.toLowerCase()))
      throw new ApiException(400, "Use a strong password with 12 to 128 characters.");
  }

  private String email(String e) {
    return e.strip().toLowerCase(Locale.ROOT);
  }

  public record Challenge(UUID challengeId, String message) {}

  @Transactional(noRollbackFor = ApiException.class)
  public Challenge register(AuthRequests.Register r, String ip) {
    password(r.password());
    rate.check("register-ip", ip, 10, 3600);
    String e = email(r.email());
    rate.check("register-email", e, 3, 3600);
    UUID uid = UUID.randomUUID();
    int created =
        db.update(
            "INSERT INTO users(id,email,name,password_hash) VALUES (?,?,?,?) ON CONFLICT(email) DO NOTHING",
            uid,
            e,
            r.name().strip(),
            passwords.encode(r.password()));
    if (created == 0)
      return new Challenge(UUID.randomUUID(), "If eligible, a verification email has been sent.");
    db.update("INSERT INTO user_roles VALUES (?,'USER')", uid);
    return challenge(uid, e, "EMAIL_VERIFICATION");
  }

  private Challenge challenge(UUID uid, String email, String purpose) {
    var recent =
        db.queryForList(
            "SELECT id FROM email_otp_challenges WHERE email=? AND purpose=? AND created_at>now()-interval '60 seconds'",
            email,
            purpose);
    if (!recent.isEmpty())
      throw new ApiException(429, "Wait 60 seconds before requesting another code.");
    db.update(
        "UPDATE email_otp_challenges SET consumed_at=now(),reset_token_hash=NULL WHERE email=? AND purpose=? AND consumed_at IS NULL",
        email,
        purpose);
    UUID id = UUID.randomUUID();
    String code = crypto.otp();
    db.update(
        "INSERT INTO email_otp_challenges(id,user_id,email,purpose,code_hash,expires_at) VALUES (?,?,?,?,?,?)",
        id,
        uid,
        email,
        purpose,
        crypto.otpHash(id, email, purpose, code),
        java.sql.Timestamp.from(clock.instant().plusSeconds(300)));
    try {
      mail.send(email, purpose, id, code);
    } catch (EmailDeliveryException e) {
      // SMTP failures must not reveal account existence through different API error statuses.
      // The provider already emits a safe warning. Keep cooldown/hash/expiry controls intact.
    }
    return new Challenge(id, "If eligible, an email has been sent.");
  }

  @Transactional(noRollbackFor = ApiException.class)
  public Challenge send(AuthRequests.EmailOnly r, String purpose, String ip) {
    String e = email(r.email());
    rate.check("otp-send-ip", ip, 10, 600);
    rate.check("otp-send-account", e, 1, 60);
    var users = db.queryForList("SELECT * FROM users WHERE email=? AND status='ACTIVE'", e);
    if (users.isEmpty()
        || purpose.equals("EMAIL_VERIFICATION")
            && Boolean.TRUE.equals(users.getFirst().get("verified")))
      return new Challenge(UUID.randomUUID(), "If eligible, an email has been sent.");
    return challenge((UUID) users.getFirst().get("id"), e, purpose);
  }

  private Map<String, Object> verify(AuthRequests.Verify r, String purpose, String ip) {
    rate.check("otp-verify-ip", ip, 30, 300);
    var rows =
        db.queryForList(
            "SELECT * FROM email_otp_challenges WHERE id=? FOR UPDATE", r.challengeId());
    if (rows.isEmpty()) throw new ApiException(400, "Invalid or expired code.");
    var c = rows.getFirst();
    if (!purpose.equals(c.get("purpose"))
        || c.get("consumed_at") != null
        || ((Number) c.get("attempts")).intValue() >= 5
        || !((java.sql.Timestamp) c.get("expires_at")).toInstant().isAfter(clock.instant()))
      throw new ApiException(400, "Invalid or expired code.");
    db.update("UPDATE email_otp_challenges SET attempts=attempts+1 WHERE id=?", r.challengeId());
    if (!crypto.equal(
        (String) c.get("code_hash"),
        crypto.otpHash(r.challengeId(), (String) c.get("email"), purpose, r.code())))
      throw new ApiException(400, "Invalid or expired code.");
    db.update("UPDATE email_otp_challenges SET consumed_at=now() WHERE id=?", r.challengeId());
    return c;
  }

  @Transactional(noRollbackFor = ApiException.class)
  public void verifyEmail(AuthRequests.Verify r, String ip) {
    var c = verify(r, "EMAIL_VERIFICATION", ip);
    db.update(
        "UPDATE users SET verified=true,updated_at=now() WHERE id=? AND status='ACTIVE'",
        c.get("user_id"));
  }

  @Transactional(noRollbackFor = ApiException.class)
  public String verifyReset(AuthRequests.Verify r, String ip) {
    verify(r, "PASSWORD_RESET", ip);
    String token = crypto.randomToken();
    db.update(
        "UPDATE email_otp_challenges SET reset_token_hash=?,reset_token_expires_at=? WHERE id=?",
        crypto.tokenHash(token),
        java.sql.Timestamp.from(clock.instant().plusSeconds(300)),
        r.challengeId());
    return token;
  }

  @Transactional(noRollbackFor = ApiException.class)
  public void reset(AuthRequests.Reset r, String ip) {
    password(r.password());
    rate.check("reset-ip", ip, 10, 300);
    var rows =
        db.queryForList(
            "SELECT * FROM email_otp_challenges WHERE reset_token_hash=? AND purpose='PASSWORD_RESET' AND reset_token_expires_at>now() FOR UPDATE",
            crypto.tokenHash(r.resetToken()));
    if (rows.size() != 1) throw new ApiException(400, "Invalid or expired reset request.");
    UUID uid = (UUID) rows.getFirst().get("user_id");
    db.update(
        "UPDATE users SET password_hash=?,updated_at=now() WHERE id=?",
        passwords.encode(r.password()),
        uid);
    db.update("UPDATE email_otp_challenges SET reset_token_hash=NULL WHERE user_id=?", uid);
    sessions.revoke(uid);
    audit.record(uid, "PASSWORD_RESET", "USER", uid);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public SessionService.Session login(AuthRequests.Login r, String ip) {
    String e = email(r.email());
    rate.check("login-ip", ip, 30, 300);
    rate.check("login-account", e, 8, 300);
    var rows = db.queryForList("SELECT * FROM users WHERE email=? FOR UPDATE", e);
    String hash = rows.isEmpty() ? dummy : (String) rows.getFirst().get("password_hash");
    boolean matches = passwords.matches(r.password(), hash == null ? dummy : hash);
    if (!matches
        || rows.isEmpty()
        || !"ACTIVE".equals(rows.getFirst().get("status"))
        || !Boolean.TRUE.equals(rows.getFirst().get("verified"))) {
      audit.record(null, "LOGIN_FAILED", "USER", null);
      throw new ApiException(401, "Invalid credentials or account unavailable.");
    }
    UUID uid = (UUID) rows.getFirst().get("id");
    audit.record(uid, "LOGIN", "USER", uid);
    return sessions.create(uid);
  }

  @Transactional
  public void change(Actor actor, AuthRequests.Change r) {
    password(r.password());
    String hash =
        db.queryForObject("SELECT password_hash FROM users WHERE id=?", String.class, actor.id());
    if (hash == null || !passwords.matches(r.currentPassword(), hash))
      throw new ApiException(400, "Current password is incorrect.");
    db.update(
        "UPDATE users SET password_hash=?,updated_at=now() WHERE id=?",
        passwords.encode(r.password()),
        actor.id());
    sessions.revoke(actor.id());
    audit.record(actor.id(), "PASSWORD_CHANGE", "USER", actor.id());
  }
}
