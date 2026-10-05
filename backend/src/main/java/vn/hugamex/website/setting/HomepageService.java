package vn.hugamex.website.setting;

import jakarta.validation.Validator;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hugamex.website.audit.AuditService;
import vn.hugamex.website.common.ApiException;

@Service
public class HomepageService {
  private final JdbcTemplate db;
  private final AuditService audit;
  private final Validator validator;

  public HomepageService(JdbcTemplate db, AuditService audit, Validator validator) {
    this.db = db;
    this.audit = audit;
    this.validator = validator;
  }

  public List<SiteController.Section> sections() {
    return db.query(
        "SELECT * FROM homepage_sections ORDER BY position,id",
        (rs, n) ->
            new SiteController.Section(
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

  @Transactional
  public void reorder(List<UUID> ids, UUID actor) {
    var existing =
        db.queryForList("SELECT id FROM homepage_sections ORDER BY id FOR UPDATE", UUID.class);
    if (ids == null
        || ids.size() != existing.size()
        || new HashSet<>(ids).size() != ids.size()
        || !new HashSet<>(existing).equals(new HashSet<>(ids)))
      throw new ApiException(400, "Provide each existing section exactly once.");
    for (int i = 0; i < ids.size(); i++)
      db.update("UPDATE homepage_sections SET position=? WHERE id=?", i, ids.get(i));
    audit.record(actor, "HOMEPAGE_REORDERED", "SECTION", null);
  }

  @Transactional
  public void update(UUID id, SiteController.Section s, UUID actor) {
    if (!validator.validate(s).isEmpty()) throw new ApiException(400, "Invalid homepage section.");
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
    audit.record(actor, "HOMEPAGE_UPDATED", "SECTION", id);
  }
}
