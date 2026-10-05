package vn.hugamex.website.auth;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import vn.hugamex.website.audit.*;
import vn.hugamex.website.common.*;
import vn.hugamex.website.security.*;

@Service
public class MfaService {
  private final JdbcTemplate db;
  private final Totp totp;
  private final Crypto crypto;
  private final Clock clock;
  private final AuditService audit;
  private final RateLimiter rate;

  public MfaService(
      JdbcTemplate db,
      Totp totp,
      Crypto crypto,
      Clock clock,
      AuditService audit,
      RateLimiter rate) {
    this.db = db;
    this.totp = totp;
    this.crypto = crypto;
    this.clock = clock;
    this.audit = audit;
    this.rate = rate;
  }

  @Transactional
  public Map<String, String> setup(Actor a) {
    if (!a.authenticatedAt().isAfter(clock.instant().minusSeconds(300)))
      throw new ApiException(403, "Sign in again before setting up MFA.");
    db.queryForObject("SELECT id FROM users WHERE id=? FOR UPDATE", UUID.class, a.id());
    var rows = db.queryForList("SELECT enabled FROM mfa_totp WHERE user_id=?", a.id());
    if (!rows.isEmpty() && Boolean.TRUE.equals(rows.getFirst().get("enabled")))
      throw new ApiException(409, "MFA already enabled.");
    String secret = totp.secret();
    db.update(
        "INSERT INTO mfa_totp(user_id,encrypted_secret) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET encrypted_secret=excluded.encrypted_secret,last_counter=-1",
        a.id(),
        crypto.encrypt(secret));
    String email = db.queryForObject("SELECT email FROM users WHERE id=?", String.class, a.id());
    return Map.of(
        "secret",
        secret,
        "uri",
        "otpauth://totp/HUGAMEX:"
            + java.net.URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8)
            + "?secret="
            + secret
            + "&issuer=HUGAMEX&algorithm=SHA1&digits=6&period=30");
  }

  @Transactional(noRollbackFor = ApiException.class)
  public List<String> verify(Actor a, String code, boolean enabling) {
    rate.check("mfa-account", a.id().toString(), 5, 300);
    var rows = db.queryForList("SELECT * FROM mfa_totp WHERE user_id=? FOR UPDATE", a.id());
    if (rows.isEmpty()) throw new ApiException(400, "Set up MFA first.");
    var m = rows.getFirst();
    boolean enabled = (boolean) m.get("enabled");
    if (enabling && enabled || !enabling && !enabled)
      throw new ApiException(400, "Invalid MFA state.");
    long counter =
        totp.verify(
            crypto.decrypt((String) m.get("encrypted_secret")),
            code,
            clock.instant().getEpochSecond() / 30,
            ((Number) m.get("last_counter")).longValue());
    if (counter < 0) throw new ApiException(400, "Invalid or already used code.");
    db.update("UPDATE mfa_totp SET enabled=true,last_counter=? WHERE user_id=?", counter, a.id());
    db.update(
        "UPDATE refresh_sessions SET mfa_verified=true WHERE id=? AND revoked_at IS NULL",
        a.sessionId());
    List<String> recovery = enabling ? codes(a.id()) : List.of();
    audit.record(a.id(), enabling ? "MFA_ENABLED" : "MFA_VERIFIED", "USER", a.id());
    return recovery;
  }

  private List<String> codes(UUID uid) {
    db.update("DELETE FROM mfa_recovery_codes WHERE user_id=?", uid);
    List<String> codes = new ArrayList<>();
    for (int i = 0; i < 8; i++) {
      String raw = crypto.randomToken().substring(0, 20);
      codes.add(raw);
      db.update(
          "INSERT INTO mfa_recovery_codes(id,user_id,code_hash) VALUES (?,?,?)",
          UUID.randomUUID(),
          uid,
          crypto.tokenHash(raw));
    }
    return codes;
  }

  @Transactional
  public List<String> regenerate(Actor a) {
    if (!a.mfaVerified() || !a.authenticatedAt().isAfter(clock.instant().minusSeconds(300)))
      throw new ApiException(403, "Recent sign in and MFA required.");
    db.queryForObject(
        "SELECT user_id FROM mfa_totp WHERE user_id=? AND enabled=true FOR UPDATE",
        UUID.class,
        a.id());
    audit.record(a.id(), "MFA_RECOVERY_REGENERATED", "USER", a.id());
    return codes(a.id());
  }

  @Transactional(noRollbackFor = ApiException.class)
  public void recover(Actor a, String code) {
    rate.check("mfa-account", a.id().toString(), 5, 300);
    int n =
        db.update(
            "UPDATE mfa_recovery_codes SET used_at=now() WHERE user_id=? AND code_hash=? AND used_at IS NULL",
            a.id(),
            crypto.tokenHash(code));
    if (n != 1) throw new ApiException(400, "Invalid or used recovery code.");
    db.update(
        "UPDATE refresh_sessions SET mfa_verified=true WHERE id=? AND revoked_at IS NULL",
        a.sessionId());
    audit.record(a.id(), "MFA_RECOVERY_USED", "USER", a.id());
  }
}
