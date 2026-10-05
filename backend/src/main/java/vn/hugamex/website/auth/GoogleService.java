package vn.hugamex.website.auth;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hugamex.website.common.ApiException;

@Service
public class GoogleService {
  private final JdbcTemplate db;
  private final SessionService sessions;

  public GoogleService(JdbcTemplate db, SessionService sessions) {
    this.db = db;
    this.sessions = sessions;
  }

  @Transactional
  public SessionService.Session login(OidcUser google) {
    if (!Boolean.TRUE.equals(google.getEmailVerified()))
      throw new ApiException(403, "Verified Google email required.");
    String subject = google.getSubject();
    var existing =
        db.queryForList(
            "SELECT user_id FROM auth_identities WHERE provider='GOOGLE' AND subject=?", subject);
    UUID uid;
    if (existing.isEmpty()) {
      String email = google.getEmail().toLowerCase(Locale.ROOT);
      if (db.queryForObject("SELECT count(*) FROM users WHERE email=?", Long.class, email) > 0)
        throw new ApiException(
            409,
            "This email already has an account. Use its existing sign-in method; automatic linking is disabled.");
      uid = UUID.randomUUID();
      String name = google.getFullName();
      if (name == null) name = "Google user";
      db.update(
          "INSERT INTO users(id,email,name,verified) VALUES (?,?,?,true)",
          uid,
          email,
          name.substring(0, Math.min(120, name.length())));
      db.update("INSERT INTO user_roles VALUES (?,'USER')", uid);
      db.update(
          "INSERT INTO auth_identities(id,user_id,provider,subject) VALUES (?,?,'GOOGLE',?)",
          UUID.randomUUID(),
          uid,
          subject);
    } else uid = (UUID) existing.getFirst().get("user_id");
    if (!"ACTIVE"
        .equals(db.queryForObject("SELECT status FROM users WHERE id=?", String.class, uid)))
      throw new ApiException(403, "Account unavailable.");
    return sessions.create(uid);
  }
}
