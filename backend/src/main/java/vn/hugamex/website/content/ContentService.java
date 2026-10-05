package vn.hugamex.website.content;

import java.util.*;
import org.springframework.jdbc.core.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hugamex.website.audit.AuditService;
import vn.hugamex.website.common.*;
import vn.hugamex.website.security.Actor;

@Service
public class ContentService {
  private final JdbcTemplate db;
  private final Json json;
  private final ContentValidation validation;
  private final AuditService audit;
  private static final String SELECT =
      "SELECT c.*,t.locale,t.title,t.slug,coalesce((SELECT ts.slug FROM content_translations ts WHERE ts.content_id=c.id AND ts.locale='vi'),t.slug) AS canonical_slug,t.excerpt,t.content,t.seo_title,t.seo_description,m.alt_text AS featured_media_alt,ARRAY(SELECT pc.category_id FROM post_categories pc WHERE pc.post_id=c.id UNION SELECT pc.category_id FROM product_categories pc WHERE pc.product_id=c.id ORDER BY 1) AS category_ids FROM content_items c JOIN content_translations t ON t.content_id=c.id LEFT JOIN media_files m ON m.id=c.featured_media_id ";

  private static final String SELECT_LIST =
      SELECT.replace("t.content,", "'{\"type\":\"doc\",\"content\":[]}'::jsonb AS content,");

  public ContentService(
      JdbcTemplate db, Json json, ContentValidation validation, AuditService audit) {
    this.db = db;
    this.json = json;
    this.validation = validation;
    this.audit = audit;
  }

  public static String kind(String resource) {
    return switch (resource) {
      case "posts" -> "POST";
      case "pages" -> "PAGE";
      case "branches" -> "BRANCH";
      case "products" -> "PRODUCT";
      case "partners" -> "PARTNER";
      case "certifications" -> "CERTIFICATION";
      case "categories" -> "CATEGORY";
      case "product-categories" -> "PRODUCT_CATEGORY";
      case "hero-slides" -> "HERO";
      default -> throw new ApiException(404, "Resource not found.");
    };
  }

  private RowMapper<ContentDto> mapper() {
    return (rs, n) -> {
      UUID id = rs.getObject("id", UUID.class);
      var date = rs.getTimestamp("published_at");
      return new ContentDto(
          id,
          rs.getString("kind"),
          rs.getString("status"),
          rs.getBoolean("featured"),
          rs.getObject("featured_media_id", UUID.class),
          rs.getString("featured_media_alt"),
          date == null ? null : date.toInstant(),
          rs.getString("locale"),
          rs.getString("title"),
          rs.getString("slug"),
          rs.getString("canonical_slug"),
          rs.getString("excerpt"),
          json.read(rs.getString("content")),
          rs.getString("seo_title"),
          rs.getString("seo_description"),
          json.strings(rs.getString("metadata")),
          Arrays.asList((UUID[]) rs.getArray("category_ids").getArray()));
    };
  }

  public PageResult<ContentDto> list(
      String kind,
      String locale,
      String term,
      String status,
      int page,
      int size,
      boolean admin,
      UUID category) {
    PageResult.check(page, size);
    if (!Set.of("vi", "en").contains(locale)
        || term.length() > 200
        || !Set.of("", "DRAFT", "PUBLISHED", "ARCHIVED").contains(status))
      throw new ApiException(400, "Invalid filter.");
    String where = " WHERE c.kind=? AND t.locale=? AND (t.title ILIKE ? OR t.excerpt ILIKE ?) ";
    List<Object> args = new ArrayList<>(List.of(kind, locale, "%" + term + "%", "%" + term + "%"));
    if (!admin) {
      where += " AND c.status='PUBLISHED' ";
    } else if (!status.isEmpty()) {
      where += " AND c.status=? ";
      args.add(status);
    }
    if (category != null) {
      if (!Set.of("POST", "PRODUCT").contains(kind))
        throw new ApiException(400, "Unsupported category filter.");
      where +=
          kind.equals("PRODUCT")
              ? " AND EXISTS(SELECT 1 FROM product_categories pc WHERE pc.product_id=c.id AND pc.category_id=?) "
              : " AND EXISTS(SELECT 1 FROM post_categories pc WHERE pc.post_id=c.id AND pc.category_id=?) ";
      args.add(category);
    }
    long total =
        db.queryForObject(
            "SELECT count(*) FROM content_items c JOIN content_translations t ON t.content_id=c.id"
                + where,
            Long.class,
            args.toArray());
    args.add(size);
    args.add(page * size);
    var items =
        db.query(
            SELECT_LIST
                + where
                + " ORDER BY c.featured DESC,c.published_at DESC NULLS LAST,c.created_at DESC,c.id LIMIT ? OFFSET ?",
            mapper(),
            args.toArray());
    return new PageResult<>(items, total, page, size);
  }

  public ContentDto detail(String kind, String slug, String locale) {
    if (!Set.of("vi", "en").contains(locale) || slug.length() > 180)
      throw new ApiException(400, "Invalid language or slug.");
    var rows =
        db.query(
            SELECT
                + "WHERE c.id=(SELECT cx.id FROM content_items cx JOIN content_translations tx ON tx.content_id=cx.id WHERE cx.kind=? AND (tx.slug=? OR (cx.kind='PAGE' AND cx.metadata->>'routeKey'=?)) AND cx.status='PUBLISHED' ORDER BY (tx.locale='vi') DESC,cx.id LIMIT 1) AND t.locale=? AND c.status='PUBLISHED'",
            mapper(),
            kind,
            slug,
            slug,
            locale);
    if (rows.isEmpty()) throw new ApiException(404, "Content not found.");
    return rows.getFirst();
  }

  public ContentDto get(String kind, UUID id, String locale) {
    var rows =
        db.query(SELECT + "WHERE c.kind=? AND c.id=? AND t.locale=?", mapper(), kind, id, locale);
    if (rows.isEmpty()) {
      var shared = db.query(SELECT + "WHERE c.kind=? AND c.id=? LIMIT 1", mapper(), kind, id);
      if (shared.isEmpty()) throw new ApiException(404, "Content not found.");
      var c = shared.getFirst();
      return new ContentDto(
          c.id(),
          c.kind(),
          c.status(),
          c.featured(),
          c.featuredMediaId(),
          c.featuredMediaAlt(),
          c.publishedAt(),
          locale,
          "",
          "",
          c.canonicalSlug(),
          "",
          json.read("{\"type\":\"doc\",\"content\":[]}"),
          "",
          "",
          c.metadata(),
          c.categoryIds());
    }
    return rows.getFirst();
  }

  public List<ContentDto> featured(String section, String locale) {
    if (!Set.of("vi", "en").contains(locale)) throw new ApiException(400, "Invalid language.");
    return db.query(
        SELECT_LIST
            + "JOIN homepage_sections h ON c.id=ANY(h.content_ids) WHERE h.section_key=? AND h.enabled=true AND c.status='PUBLISHED' AND t.locale=? ORDER BY array_position(h.content_ids,c.id) LIMIT 12",
        mapper(),
        section,
        locale);
  }

  private void media(UUID id, boolean published, boolean image) {
    if (id == null) return;
    var rows =
        db.queryForList("SELECT is_public,mime_type FROM media_files WHERE id=? FOR SHARE", id);
    if (!rows.isEmpty()
        && image
        && !rows.getFirst().get("mime_type").toString().startsWith("image/"))
      throw new ApiException(400, "Choose an image for featured media.");
    if (!rows.isEmpty() && !image && !rows.getFirst().get("mime_type").equals("application/pdf"))
      throw new ApiException(400, "Choose a PDF certificate document.");
    if (rows.isEmpty() || published && !Boolean.TRUE.equals(rows.getFirst().get("is_public")))
      throw new ApiException(400, "Select an existing public media file before publishing.");
  }

  @Transactional
  public ContentDto save(String kind, UUID id, ContentRequests.Save r, Actor actor) {
    validation.check(r, kind);
    boolean created = id == null;
    if (created) {
      id = UUID.randomUUID();
      db.update(
          "INSERT INTO content_items(id,kind,author_id,updated_by) VALUES (?,?,?,?)",
          id,
          kind,
          actor.id(),
          actor.id());
    }
    var rows =
        db.queryForList(
            "SELECT status FROM content_items WHERE id=? AND kind=? FOR UPDATE", id, kind);
    if (rows.isEmpty()) throw new ApiException(404, "Content not found.");
    media(r.featuredMediaId(), "PUBLISHED".equals(rows.getFirst().get("status")), true);
    String doc = r.metadata().get("documentMediaId");
    if (doc != null && !doc.isBlank())
      media(UUID.fromString(doc), "PUBLISHED".equals(rows.getFirst().get("status")), false);
    db.update(
        "UPDATE content_items SET featured=?,featured_media_id=?,metadata=?::jsonb,updated_at=now(),updated_by=? WHERE id=?",
        r.featured(),
        r.featuredMediaId(),
        json.write(r.metadata()),
        actor.id(),
        id);
    db.update(
        "INSERT INTO content_translations(id,content_id,locale,title,slug,excerpt,content,seo_title,seo_description) VALUES (?,?,?,?,?,?,?::jsonb,?,?) ON CONFLICT(content_id,locale) DO UPDATE SET title=excluded.title,slug=excluded.slug,excerpt=excluded.excerpt,content=excluded.content,seo_title=excluded.seo_title,seo_description=excluded.seo_description",
        UUID.randomUUID(),
        id,
        r.locale(),
        r.title().strip(),
        r.slug(),
        r.excerpt(),
        json.write(r.content()),
        r.seoTitle(),
        r.seoDescription());
    String relation = kind.equals("PRODUCT") ? "product_categories" : "post_categories";
    String foreignKey = kind.equals("PRODUCT") ? "product_id" : "post_id";
    db.update("DELETE FROM " + relation + " WHERE " + foreignKey + "=?", id);
    for (UUID category : new HashSet<>(r.categoryIds())) {
      if (db.queryForList(
              "SELECT id FROM content_items WHERE id=? AND kind=? AND status<>'ARCHIVED' FOR SHARE",
              UUID.class,
              category,
              kind.equals("PRODUCT") ? "PRODUCT_CATEGORY" : "CATEGORY")
          .isEmpty()) throw new ApiException(400, "Invalid category.");
      db.update("INSERT INTO " + relation + " VALUES (?,?)", id, category);
    }
    if (kind.equals("PRODUCT") && "PUBLISHED".equals(rows.getFirst().get("status")))
      requireProductCategory(id);
    audit.record(actor.id(), created ? "CONTENT_CREATED" : "CONTENT_UPDATED", kind, id);
    return get(kind, id, r.locale());
  }

  private void requireProductCategory(UUID id) {
    if (db.queryForList(
            "SELECT c.id FROM product_categories pc JOIN content_items c ON c.id=pc.category_id WHERE pc.product_id=? AND c.status='PUBLISHED' FOR SHARE OF c",
            UUID.class,
            id)
        .isEmpty())
      throw new ApiException(400, "Select a published product category before publishing.");
  }

  @Transactional
  public void status(String kind, UUID id, String status, Actor actor) {
    var rows =
        db.queryForList("SELECT * FROM content_items WHERE id=? AND kind=? FOR UPDATE", id, kind);
    if (rows.isEmpty()) throw new ApiException(404, "Content not found.");
    if (status.equals("PUBLISHED")) {
      if (kind.equals("PRODUCT")) requireProductCategory(id);
      media((UUID) rows.getFirst().get("featured_media_id"), true, true);
      var m = json.strings(rows.getFirst().get("metadata").toString());
      if (m.containsKey("documentMediaId") && !m.get("documentMediaId").isBlank())
        media(UUID.fromString(m.get("documentMediaId")), true, false);
      if (db.queryForObject(
              "SELECT count(*) FROM content_translations WHERE content_id=?", Long.class, id)
          == 0) throw new ApiException(400, "Add a translation before publishing.");
    }
    if (kind.equals("PRODUCT_CATEGORY")
        && !status.equals("PUBLISHED")
        && db.queryForObject(
                "SELECT count(*) FROM product_categories pc JOIN content_items p ON p.id=pc.product_id WHERE pc.category_id=? AND p.status='PUBLISHED'",
                Long.class,
                id)
            > 0)
      throw new ApiException(
          400, "Move or unpublish linked products before hiding their category.");
    db.update(
        "UPDATE content_items SET status=?,published_at=CASE WHEN ?='PUBLISHED' THEN coalesce(published_at,now()) ELSE published_at END,updated_at=now(),updated_by=? WHERE id=?",
        status,
        status,
        actor.id(),
        id);
    audit.record(actor.id(), "CONTENT_" + status, kind, id);
  }
}
