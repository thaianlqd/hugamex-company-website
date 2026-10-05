package vn.hugamex.website.media;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.hugamex.website.audit.AuditService;
import vn.hugamex.website.common.*;

@Service
public class MediaService {
  private final JdbcTemplate db;
  private final MediaValidation validation;
  private final MediaStorage storage;
  private final AuditService audit;

  public record Info(
      UUID id,
      String originalFilename,
      String mimeType,
      long fileSize,
      String contentHash,
      String altText,
      boolean isPublic) {}

  public MediaService(
      JdbcTemplate db, MediaValidation v, MediaStorage storage, AuditService audit) {
    this.db = db;
    validation = v;
    this.storage = storage;
    this.audit = audit;
  }

  private org.springframework.jdbc.core.RowMapper<Info> mapper() {
    return (rs, n) ->
        new Info(
            rs.getObject("id", UUID.class),
            rs.getString("original_filename"),
            rs.getString("mime_type"),
            rs.getLong("file_size"),
            rs.getString("content_hash"),
            rs.getString("alt_text"),
            rs.getBoolean("is_public"));
  }

  public Info info(UUID id) {
    var rows =
        db.query(
            "SELECT id,original_filename,mime_type,file_size,content_hash,alt_text,is_public FROM media_files WHERE id=?",
            mapper(),
            id);
    if (rows.isEmpty()) throw new ApiException(404, "Media not found.");
    return rows.getFirst();
  }

  public byte[] bytes(UUID id) {
    return storage.get(id);
  }

  @Transactional
  public Info upload(MultipartFile file, String alt, boolean publicFile, UUID actor) {
    if (alt.length() > 500) throw new ApiException(400, "Alt text must be at most 500 characters.");
    var f = validation.validate(file);
    UUID id = UUID.randomUUID();
    String hash;
    try {
      hash =
          HexFormat.of()
              .formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(f.data()));
    } catch (Exception e) {
      throw new IllegalStateException();
    }
    db.update(
        "INSERT INTO media_files(id,original_filename,stored_filename,mime_type,file_size,content_hash,data,alt_text,is_public,uploaded_by) VALUES (?,?,?,?,?,?,?,?,?,?)",
        id,
        f.original(),
        id + "." + f.extension(),
        f.mime(),
        f.data().length,
        hash,
        f.data(),
        alt,
        publicFile,
        actor);
    audit.record(actor, "MEDIA_UPLOAD", "MEDIA", id);
    return info(id);
  }

  public PageResult<Info> list(String search, int page, int size) {
    PageResult.check(page, size);
    if (search.length() > 200) throw new ApiException(400, "Search too long.");
    String term = "%" + search + "%";
    return new PageResult<>(
        db.query(
            "SELECT id,original_filename,mime_type,file_size,content_hash,alt_text,is_public FROM media_files WHERE original_filename ILIKE ? ORDER BY created_at DESC,id LIMIT ? OFFSET ?",
            mapper(),
            term,
            size,
            page * size),
        db.queryForObject(
            "SELECT count(*) FROM media_files WHERE original_filename ILIKE ?", Long.class, term),
        page,
        size);
  }

  @Transactional
  public void delete(UUID id, UUID actor) {
    db.queryForList("SELECT id FROM media_files WHERE id=? FOR UPDATE", id);
    if (db.queryForObject(
            "SELECT count(*) FROM content_items WHERE featured_media_id=? OR metadata->>'documentMediaId'=?",
            Long.class,
            id,
            id.toString())
        > 0)
      throw new ApiException(
          409, "This file is referenced by content. Remove its references first.");
    int count = db.update("DELETE FROM media_files WHERE id=?", id);
    if (count == 0) throw new ApiException(404, "Media not found.");
    audit.record(actor, "MEDIA_DELETE", "MEDIA", id);
  }

  @Transactional
  public Info update(UUID id, String altText, boolean publicFile, UUID actor) {
    db.queryForList("SELECT id FROM media_files WHERE id=? FOR UPDATE", id);
    info(id);
    if (altText == null || altText.length() > 500) throw new ApiException(400, "Invalid alt text.");
    if (!publicFile
        && db.queryForObject(
                "SELECT count(*) FROM content_items WHERE status='PUBLISHED' AND (featured_media_id=? OR metadata->>'documentMediaId'=?)",
                Long.class,
                id,
                id.toString())
            > 0)
      throw new ApiException(409, "Unpublish the content before making its media private.");
    db.update(
        "UPDATE media_files SET alt_text=?,is_public=?,updated_at=now() WHERE id=?",
        altText,
        publicFile,
        id);
    audit.record(actor, "MEDIA_UPDATED", "MEDIA", id);
    return info(id);
  }
}
