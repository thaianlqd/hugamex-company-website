package vn.hugamex.website.config;

import java.util.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import vn.hugamex.website.audit.AuditService;
import vn.hugamex.website.auth.AuthService;

@Component
public class AdminBootstrap implements ApplicationRunner {
  private final Environment env;
  private final JdbcTemplate db;
  private final PasswordEncoder encoder;
  private final TransactionTemplate tx;
  private final AuditService audit;

  public AdminBootstrap(
      Environment env,
      JdbcTemplate db,
      PasswordEncoder encoder,
      PlatformTransactionManager manager,
      AuditService audit) {
    this.env = env;
    this.db = db;
    this.encoder = encoder;
    tx = new TransactionTemplate(manager);
    this.audit = audit;
  }

  public void run(ApplicationArguments args) {
    String email = env.getProperty("BOOTSTRAP_ADMIN_EMAIL", "");
    String password = env.getProperty("BOOTSTRAP_ADMIN_PASSWORD", "");
    if (email.isBlank() && password.isBlank()) return;
    if (!email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+"))
      throw new IllegalStateException("Valid bootstrap email required");
    AuthService.password(password);
    tx.executeWithoutResult(
        s -> {
          db.execute("SELECT pg_advisory_xact_lock(817231)");
          if (db.queryForObject(
                  "SELECT count(*) FROM user_roles r JOIN users u ON u.id=r.user_id WHERE r.role_name='SUPER_ADMIN' AND u.status='ACTIVE'",
                  Long.class)
              > 0) return;
          UUID id = UUID.randomUUID();
          db.update(
              "INSERT INTO users(id,email,name,password_hash,verified) VALUES (?,?,?, ?,true)",
              id,
              email.toLowerCase(Locale.ROOT),
              "Website administrator",
              encoder.encode(password));
          db.update("INSERT INTO user_roles VALUES (?,'SUPER_ADMIN')", id);
          audit.record(id, "ADMIN_BOOTSTRAP", "USER", id);
        });
  }
}
