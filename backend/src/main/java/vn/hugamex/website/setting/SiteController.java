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
  private final Policy policy;
  private final AuditService audit;
  private final vn.hugamex.website.content.ContentService content;

  public SiteController(
      JdbcTemplate db,
      Policy policy,
      AuditService audit,
      vn.hugamex.website.content.ContentService content) {
    this.db = db;
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
    return db.query(
        "SELECT * FROM homepage_sections ORDER BY position,id",
        (rs, n) ->
            new Section(
                rs.getObject("id", UUID.class),
                rs.getString("section_key"),
                rs.getBoolean("enabled"),
                rs.getInt("position"),
                rs.getString("headline_vi"),
                rs.getString("headline_en"),
                rs.getString("subheadline_vi"),
                rs.getString("subheadline_en"),
                Arrays.asList((UUID[]) rs.getArray("content_ids").getArray())));
  }

  private Map<String, String> settings() {
    Map<String, String> m = new LinkedHashMap<>();
    db.query(
        "SELECT key,value FROM site_settings ORDER BY key",
        rs -> {
          m.put(rs.getString(1), rs.getString(2));
        });
    return m;
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
  @PreAuthorize("@policy.business(authentication)")
  List<Section> homepage() {
    return sections();
  }

  @PutMapping("/admin/homepage/{id}")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.business(authentication)")
  @Transactional
  Map<String, String> update(
      Authentication a, @PathVariable UUID id, @Valid @RequestBody Section s) {
    var keys =
        db.queryForList("SELECT section_key FROM homepage_sections WHERE id=?", String.class, id);
    if (keys.isEmpty()) throw new ApiException(404, "Section not found.");
    String key = keys.getFirst();
    if (!key.equals(s.key()) || !id.equals(s.id()))
      throw new ApiException(400, "Section identity cannot change.");
    String kind =
        switch (key) {
          case "about", "manufacturing" -> "PAGE";
          case "products" -> "PRODUCT";
          case "branches" -> "BRANCH";
          case "quality" -> "CERTIFICATION";
          case "partners" -> "PARTNER";
          case "news" -> "POST";
          default -> throw new ApiException(400, "Invalid section.");
        };
    for (UUID content : s.contentIds())
      if (db.queryForObject(
              "SELECT count(*) FROM content_items WHERE id=? AND kind=? AND status='PUBLISHED'",
              Long.class,
              content,
              kind)
          != 1) throw new ApiException(400, "Select published content references.");
    db.update(
        "UPDATE homepage_sections SET enabled=?,position=?,headline_vi=?,headline_en=?,subheadline_vi=?,subheadline_en=?,content_ids=? WHERE id=?",
        s.enabled(),
        s.position(),
        s.headlineVi(),
        s.headlineEn(),
        s.subheadlineVi(),
        s.subheadlineEn(),
        s.contentIds().toArray(UUID[]::new),
        id);
    audit.record(policy.actor(a).id(), "HOMEPAGE_UPDATED", "SECTION", id);
    return Map.of("message", "Section updated.");
  }

  @GetMapping("/admin/settings")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.superAdmin(authentication)")
  Map<String, String> adminSettings() {
    return settings();
  }

  @PutMapping("/admin/settings")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.superAdmin(authentication) and @policy.recent(authentication)")
  @Transactional
  Map<String, String> settings(Authentication a, @RequestBody Map<String, String> values) {
    Set<String> allowed =
        Set.of(
            "companyName",
            "contactEmail",
            "contactPhone",
            "contactAddress",
            "officeHours",
            "facebookUrl",
            "linkedinUrl");
    if (values.size() > allowed.size() || !allowed.containsAll(values.keySet()))
      throw new ApiException(400, "Unsupported setting.");
    values.forEach(
        (k, v) -> {
          if (v == null || v.length() > 2000) throw new ApiException(400, "Invalid setting.");
          if (k.endsWith("Url") && !v.isBlank()) {
            var u = java.net.URI.create(v);
            if (!"https".equals(u.getScheme()) || u.getHost() == null)
              throw new ApiException(400, "Use HTTPS social URLs.");
          }
          db.update(
              "INSERT INTO site_settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
              k,
              v);
        });
    audit.record(policy.actor(a).id(), "SETTINGS_UPDATED", "SITE", null);
    return settings();
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
