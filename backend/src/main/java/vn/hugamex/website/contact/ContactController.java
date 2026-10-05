package vn.hugamex.website.contact;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hugamex.website.audit.*;
import vn.hugamex.website.common.*;
import vn.hugamex.website.security.*;

@RestController
@RequestMapping("/api/v1")
public class ContactController {
  private final JdbcTemplate db;
  private final RateLimiter rate;
  private final AuditService audit;
  private final Policy policy;
  private final ContactNotificationService notifications;

  public ContactController(
      JdbcTemplate db,
      RateLimiter rate,
      AuditService audit,
      Policy policy,
      ContactNotificationService notifications) {
    this.db = db;
    this.rate = rate;
    this.audit = audit;
    this.policy = policy;
    this.notifications = notifications;
  }

  public record Contact(
      @NotBlank @Size(max = 120) String fullName,
      @NotNull @Size(max = 200) String company,
      @NotBlank @Email @Size(max = 254) String email,
      @NotNull @Size(max = 40) String phone,
      @NotBlank @Size(max = 200) String subject,
      @NotBlank @Size(max = 5000) String message,
      @NotNull @Size(max = 100) String website) {}

  public record Status(@NotNull @Pattern(regexp = "NEW|READ|REPLIED|ARCHIVED") String status) {}

  @PostMapping("/contact")
  Map<String, String> create(@Valid @RequestBody Contact c, HttpServletRequest q) {
    rate.check("contact-ip", q.getRemoteAddr(), 5, 600);
    if (!c.website().isEmpty()) throw new ApiException(400, "Invalid contact request.");
    rate.check("contact-email", c.email().toLowerCase(Locale.ROOT), 3, 600);
    db.update(
        "INSERT INTO contact_messages(id,full_name,company,email,phone,subject,message,notification_status) VALUES (?,?,?,?,?,?,?,?)",
        UUID.randomUUID(),
        c.fullName(),
        c.company(),
        c.email(),
        c.phone(),
        c.subject(),
        c.message(),
        notifications.enabled() ? "PENDING" : "DISABLED");
    return Map.of("message", "Your enquiry has been received.");
  }

  @GetMapping("/admin/contact-messages")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.business(authentication)")
  PageResult<Map<String, Object>> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String status) {
    PageResult.check(page, size);
    if (search.length() > 200 || !Set.of("", "NEW", "READ", "REPLIED", "ARCHIVED").contains(status))
      throw new ApiException(400, "Invalid filter.");
    String term = "%" + search + "%";
    String where =
        " WHERE (full_name ILIKE ? OR email ILIKE ? OR subject ILIKE ?) AND (?='' OR status=?)";
    return new PageResult<>(
        db.queryForList(
            "SELECT * FROM contact_messages"
                + where
                + " ORDER BY created_at DESC,id LIMIT ? OFFSET ?",
            term,
            term,
            term,
            status,
            status,
            size,
            page * size),
        db.queryForObject(
            "SELECT count(*) FROM contact_messages" + where,
            Long.class,
            term,
            term,
            term,
            status,
            status),
        page,
        size);
  }

  @PatchMapping("/admin/contact-messages/{id}")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.business(authentication)")
  Map<String, String> status(
      Authentication a, @PathVariable UUID id, @Valid @RequestBody Status s) {
    if (db.update("UPDATE contact_messages SET status=? WHERE id=?", s.status(), id) == 0)
      throw new ApiException(404, "Message not found.");
    audit.record(policy.actor(a).id(), "CONTACT_" + s.status(), "CONTACT", id);
    return Map.of("message", "Status updated.");
  }
}
