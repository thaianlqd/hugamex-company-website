package vn.hugamex.website.user;

import java.time.Clock;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import vn.hugamex.website.audit.*;
import vn.hugamex.website.auth.*;
import vn.hugamex.website.common.*;
import vn.hugamex.website.security.*;

@Service
public class AdminUserService {
  private final JdbcTemplate db;
  private final SessionService sessions;
  private final AuthService auth;
  private final AuditService audit;
  private final Clock clock;

  public AdminUserService(
      JdbcTemplate db, SessionService sessions, AuthService auth, AuditService audit, Clock clock) {
    this.db = db;
    this.sessions = sessions;
    this.auth = auth;
    this.audit = audit;
    this.clock = clock;
  }

  public record Summary(
      UUID id, String email, String name, String status, boolean verified, Set<String> roles) {}

  public PageResult<Summary> list(Actor actor, String search, int page, int size) {
    PageResult.check(page, size);
    if (search.length() > 200) throw new ApiException(400, "Search too long.");
    String term = "%" + search + "%";
    String where =
        " WHERE (u.email ILIKE ? OR u.name ILIKE ?)"
            + (actor.has("SUPER_ADMIN")
                ? ""
                : " AND NOT EXISTS(SELECT 1 FROM user_roles r WHERE r.user_id=u.id AND r.role_name IN ('ADMIN','SUPER_ADMIN'))");
    return new PageResult<>(
        db.query(
            "SELECT u.id,u.email,u.name,u.status,u.verified FROM users u"
                + where
                + " ORDER BY u.created_at DESC,u.id LIMIT ? OFFSET ?",
            (rs, n) ->
                new Summary(
                    rs.getObject("id", UUID.class),
                    rs.getString("email"),
                    rs.getString("name"),
                    rs.getString("status"),
                    rs.getBoolean("verified"),
                    new HashSet<>(
                        db.queryForList(
                            "SELECT role_name FROM user_roles WHERE user_id=?",
                            String.class,
                            rs.getObject("id", UUID.class)))),
            term,
            term,
            size,
            page * size),
        db.queryForObject("SELECT count(*) FROM users u" + where, Long.class, term, term),
        page,
        size);
  }

  private void lock() {
    db.execute("SELECT pg_advisory_xact_lock(817231)");
  }

  private void recent(Actor a) {
    if (!a.authenticatedAt().isAfter(clock.instant().minusSeconds(300)))
      throw new ApiException(403, "Sign in again before this security change.");
  }

  private void target(Actor a, UUID id) {
    db.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE", id);
    if (db.queryForObject("SELECT count(*) FROM users WHERE id=?", Long.class, id) != 1)
      throw new ApiException(404, "User not found.");
    if (!a.has("SUPER_ADMIN")
        && db.queryForObject(
                "SELECT count(*) FROM user_roles WHERE user_id=? AND role_name IN ('ADMIN','SUPER_ADMIN')",
                Long.class,
                id)
            > 0) throw new ApiException(403, "Only SUPER_ADMIN can manage privileged users.");
  }

  private void last(UUID id, boolean demoting) {
    if (demoting
        && db.queryForObject(
                "SELECT count(*) FROM users u JOIN user_roles r ON r.user_id=u.id WHERE u.id=? AND u.status='ACTIVE' AND r.role_name='SUPER_ADMIN'",
                Long.class,
                id)
            > 0
        && db.queryForObject(
                "SELECT count(*) FROM users u JOIN user_roles r ON r.user_id=u.id WHERE u.status='ACTIVE' AND r.role_name='SUPER_ADMIN'",
                Long.class)
            <= 1) throw new ApiException(409, "The last active SUPER_ADMIN is protected.");
  }

  @Transactional
  public void status(Actor a, UUID id, String status) {
    recent(a);
    lock();
    target(a, id);
    last(id, status.equals("DISABLED"));
    db.update("UPDATE users SET status=?,updated_at=now() WHERE id=?", status, id);
    sessions.revoke(id);
    audit.record(a.id(), "USER_" + status, "USER", id);
  }

  @Transactional
  public void role(Actor a, UUID id, String role) {
    if (!a.has("SUPER_ADMIN") || !a.mfaVerified())
      throw new ApiException(403, "SUPER_ADMIN and MFA required.");
    recent(a);
    lock();
    target(a, id);
    last(id, !role.equals("SUPER_ADMIN"));
    db.update("DELETE FROM user_roles WHERE user_id=?", id);
    db.update("INSERT INTO user_roles VALUES (?,?)", id, role);
    sessions.revoke(id);
    audit.record(a.id(), "ROLE_ASSIGNED_" + role, "USER", id);
  }

  @Transactional
  public UUID create(Actor a, String email, String name, String role) {
    recent(a);
    lock();
    if (!a.has("SUPER_ADMIN") && !Set.of("USER", "EDITOR").contains(role))
      throw new ApiException(403, "Only SUPER_ADMIN may create privileged accounts.");
    UUID id = UUID.randomUUID();
    db.update(
        "INSERT INTO users(id,email,name) VALUES (?,?,?)",
        id,
        email.toLowerCase(Locale.ROOT),
        name);
    db.update("INSERT INTO user_roles VALUES (?,?)", id, role);
    auth.send(new AuthRequests.EmailOnly(email), "EMAIL_VERIFICATION", "admin-invite-" + a.id());
    audit.record(a.id(), "USER_CREATED_" + role, "USER", id);
    return id;
  }

  @Transactional
  public void resetMfa(Actor a, UUID id) {
    if (!a.has("SUPER_ADMIN") || !a.mfaVerified())
      throw new ApiException(403, "SUPER_ADMIN and MFA required.");
    recent(a);
    lock();
    target(a, id);
    if (a.id().equals(id)) throw new ApiException(409, "Another SUPER_ADMIN must reset your MFA.");
    db.update("DELETE FROM mfa_recovery_codes WHERE user_id=?", id);
    db.update("DELETE FROM mfa_totp WHERE user_id=?", id);
    sessions.revoke(id);
    audit.record(a.id(), "MFA_RESET", "USER", id);
  }
}
