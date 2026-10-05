package vn.hugamex.website.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.hugamex.website.audit.AuditService;
import vn.hugamex.website.common.ApiException;
import vn.hugamex.website.security.Policy;

@RestController
@RequestMapping("/api/v1/account")
public class AccountProfileController {
  private final JdbcTemplate db;
  private final Policy policy;
  private final AuditService audit;

  public AccountProfileController(JdbcTemplate db, Policy policy, AuditService audit) {
    this.db = db;
    this.policy = policy;
    this.audit = audit;
  }

  public record Profile(@NotBlank @Size(max = 120) String name) {}

  @PutMapping("/profile")
  @Transactional
  Map<String, String> update(Authentication authentication, @Valid @RequestBody Profile request) {
    var actor = policy.actor(authentication);
    String name = request.name().strip();
    if (name.isEmpty()) throw new ApiException(400, "A display name is required.");
    if (db.update(
            "UPDATE users SET name=?,updated_at=now() WHERE id=? AND status='ACTIVE'",
            name,
            actor.id())
        != 1) throw new ApiException(401, "Account unavailable.");
    audit.record(actor.id(), "PROFILE_UPDATED", "USER", actor.id());
    return Map.of("message", "Profile updated.");
  }
}
