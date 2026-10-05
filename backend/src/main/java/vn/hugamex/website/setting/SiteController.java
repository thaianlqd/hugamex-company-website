package vn.hugamex.website.setting;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.hugamex.website.audit.*;
import vn.hugamex.website.common.*;
import vn.hugamex.website.security.*;

@RestController
@RequestMapping("/api/v1")
public class SiteController {
  private final JdbcTemplate db;
  private final HomepageService homepageService;
  private final SiteSettingsService siteSettings;
  private final Policy policy;
  private final AuditService audit;
  private final vn.hugamex.website.content.ContentService content;

  public SiteController(
      JdbcTemplate db,
      HomepageService homepageService,
      SiteSettingsService siteSettings,
      Policy policy,
      AuditService audit,
      vn.hugamex.website.content.ContentService content) {
    this.db = db;
    this.homepageService = homepageService;
    this.siteSettings = siteSettings;
    this.policy = policy;
    this.audit = audit;
    this.content = content;
  }

  public record Section(
      UUID id,
      String key,
      boolean enabled,
      @Min(0) @Max(100) int position,
      @NotNull @Size(max = 200) String headlineVi,
      @NotNull @Size(max = 200) String headlineEn,
      @NotNull @Size(max = 500) String subheadlineVi,
      @NotNull @Size(max = 500) String subheadlineEn,
      @NotNull @Size(max = 12) List<UUID> contentIds) {}

  private List<Section> sections() {
    return homepageService.sections();
  }

  private Map<String, String> settings() {
    return siteSettings.read();
  }

  @GetMapping("/public/site")
  Map<String, Object> site(@RequestParam(defaultValue = "vi") String locale) {
    Map<String, Object> featured = new LinkedHashMap<>();
    var sections = sections();
    for (var section : sections)
      featured.put(section.key(), content.featured(section.key(), locale));
    return Map.of("sections", sections, "settings", settings(), "featured", featured);
  }

  @GetMapping("/admin/homepage")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("denyAll()")
  List<Section> homepage() {
    return sections();
  }

  @PutMapping("/admin/homepage/order")
  @PreAuthorize("denyAll()")
  Map<String, String> reorder(Authentication a, @RequestBody List<UUID> ids) {
    homepageService.reorder(ids, policy.actor(a).id());
    return Map.of("message", "Order updated.");
  }

  @PutMapping("/admin/homepage/{id}")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("denyAll()")
  @Transactional
  Map<String, String> update(
      Authentication a, @PathVariable UUID id, @Valid @RequestBody Section s) {
    homepageService.update(id, s, policy.actor(a).id());
    return Map.of("message", "Section updated.");
  }

  @GetMapping("/admin/settings")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("denyAll()")
  Map<String, String> adminSettings() {
    return settings();
  }

  @PutMapping("/admin/settings")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("denyAll()")
  @Transactional
  Map<String, String> settings(Authentication a, @RequestBody Map<String, String> values) {
    return siteSettings.update(values, policy.actor(a).id());
  }

  @GetMapping("/admin/dashboard")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.admin(authentication)")
  Map<String, Long> dashboard(Authentication a) {
    Map<String, Long> counts = new LinkedHashMap<>();
    for (String state : List.of("DRAFT", "PUBLISHED", "ARCHIVED"))
      counts.put(
          state,
          db.queryForObject(
              "SELECT count(*) FROM content_items WHERE kind='POST' AND status=?",
              Long.class,
              state));
    counts.put("MEDIA", db.queryForObject("SELECT count(*) FROM media_files", Long.class));
    if (policy.business(a))
      counts.put(
          "NEW_CONTACTS",
          db.queryForObject(
              "SELECT count(*) FROM contact_messages WHERE status='NEW'", Long.class));
    return counts;
  }

  @GetMapping("/admin/audit-logs")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.superAdmin(authentication)")
  PageResult<Map<String, Object>> audit(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size,
      @RequestParam(defaultValue = "") String search) {
    PageResult.check(page, size);
    if (search.length() > 200) throw new ApiException(400, "Search too long.");
    String term = "%" + search + "%";
    return new PageResult<>(
        db.queryForList(
            "SELECT * FROM audit_logs WHERE action ILIKE ? ORDER BY timestamp DESC,id LIMIT ? OFFSET ?",
            term,
            size,
            page * size),
        db.queryForObject("SELECT count(*) FROM audit_logs WHERE action ILIKE ?", Long.class, term),
        page,
        size);
  }
}
