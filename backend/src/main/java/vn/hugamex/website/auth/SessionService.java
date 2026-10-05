package vn.hugamex.website.auth;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import vn.hugamex.website.common.*;
import vn.hugamex.website.security.*;
import vn.hugamex.website.user.UserDto;

@Service
public class SessionService {
  private final JdbcTemplate db;
  private final Crypto crypto;
  private final JwtService jwt;
  private final Clock clock;
  private final vn.hugamex.website.user.UserRepository users;
  private final vn.hugamex.website.user.UserMapper mapper;

  public record Session(String accessToken, String refreshToken, UUID sessionId) {}

  public SessionService(
      JdbcTemplate db,
      Crypto crypto,
      JwtService jwt,
      Clock clock,
      vn.hugamex.website.user.UserRepository users,
      vn.hugamex.website.user.UserMapper mapper) {
    this.db = db;
    this.crypto = crypto;
    this.jwt = jwt;
    this.clock = clock;
    this.users = users;
    this.mapper = mapper;
  }

  @Transactional
  public Session create(UUID uid) {
    var user = db.queryForList("SELECT status,verified FROM users WHERE id=? FOR UPDATE", uid);
    if (user.size() != 1
        || !"ACTIVE".equals(user.getFirst().get("status"))
        || !Boolean.TRUE.equals(user.getFirst().get("verified")))
      throw new ApiException(401, "Account unavailable.");
    return create(uid, UUID.randomUUID(), false, clock.instant());
  }

  private Session create(UUID uid, UUID family, boolean mfa, Instant authenticated) {
    UUID id = UUID.randomUUID();
    String raw = crypto.randomToken();
    db.update(
        "INSERT INTO refresh_sessions(id,user_id,family_id,token_hash,expires_at,mfa_verified,authenticated_at) VALUES (?,?,?,?,?,?,?)",
        id,
        uid,
        family,
        crypto.tokenHash(raw),
        java.sql.Timestamp.from(clock.instant().plusSeconds(604800)),
        mfa,
        java.sql.Timestamp.from(authenticated));
    return new Session(jwt.issue(uid, id), raw, id);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public Session refresh(String raw) {
    if (raw == null || raw.length() > 200) throw new ApiException(401, "Session expired.");
    var owner =
        db.queryForList(
            "SELECT user_id FROM refresh_sessions WHERE token_hash=?", crypto.tokenHash(raw));
    if (owner.isEmpty()) throw new ApiException(401, "Session expired.");
    db.queryForObject(
        "SELECT id FROM users WHERE id=? FOR UPDATE", UUID.class, owner.getFirst().get("user_id"));
    var rows =
        db.queryForList(
            "SELECT s.*,u.status,u.verified FROM refresh_sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=? FOR UPDATE OF s",
            crypto.tokenHash(raw));
    if (rows.isEmpty()) throw new ApiException(401, "Session expired.");
    var s = rows.getFirst();
    UUID family = (UUID) s.get("family_id");
    if (s.get("revoked_at") != null) {
      db.update(
          "UPDATE refresh_sessions SET revoked_at=now() WHERE family_id=? AND revoked_at IS NULL",
          family);
      throw new ApiException(401, "Session reuse detected. Sign in again.");
    }
    if (!"ACTIVE".equals(s.get("status"))
        || !Boolean.TRUE.equals(s.get("verified"))
        || ((java.sql.Timestamp) s.get("expires_at")).toInstant().isBefore(clock.instant()))
      throw new ApiException(401, "Session expired.");
    db.update("UPDATE refresh_sessions SET revoked_at=now() WHERE id=?", s.get("id"));
    return create(
        (UUID) s.get("user_id"),
        family,
        (boolean) s.get("mfa_verified"),
        ((java.sql.Timestamp) s.get("authenticated_at")).toInstant());
  }

  @Transactional
  public void logout(String raw) {
    if (raw == null || raw.length() > 200) return;
    var owner =
        db.queryForList(
            "SELECT user_id FROM refresh_sessions WHERE token_hash=?", crypto.tokenHash(raw));
    if (owner.isEmpty()) return;
    db.queryForObject(
        "SELECT id FROM users WHERE id=? FOR UPDATE", UUID.class, owner.getFirst().get("user_id"));
    db.update(
        "UPDATE refresh_sessions SET revoked_at=now() WHERE family_id IN (SELECT family_id FROM refresh_sessions WHERE token_hash=?)",
        crypto.tokenHash(raw));
  }

  @Transactional
  public void revoke(UUID user) {
    db.queryForObject("SELECT id FROM users WHERE id=? FOR UPDATE", UUID.class, user);
    db.update(
        "UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=? AND revoked_at IS NULL",
        user);
  }

  @Transactional(readOnly = true)
  public UserDto me(UUID uid, boolean mfa) {
    var entity =
        users.findById(uid).orElseThrow(() -> new ApiException(401, "Account unavailable."));
    var roles =
        new HashSet<>(
            db.queryForList("SELECT role_name FROM user_roles WHERE user_id=?", String.class, uid));
    boolean enabled =
        Boolean.TRUE.equals(
            db.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM mfa_totp WHERE user_id=? AND enabled=true)",
                Boolean.class,
                uid));
    return mapper.map(entity, roles, enabled, mfa);
  }
}
