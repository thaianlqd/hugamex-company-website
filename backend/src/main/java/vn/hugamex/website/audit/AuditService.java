package vn.hugamex.website.audit;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
  private final JdbcTemplate db;

  public AuditService(JdbcTemplate db) {
    this.db = db;
  }

  public void record(UUID actor, String action, String kind, Object id) {
    db.update(
        "INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id) VALUES (?,?,?,?,?)",
        UUID.randomUUID(),
        actor,
        action,
        kind,
        id == null ? null : id.toString());
  }
}
