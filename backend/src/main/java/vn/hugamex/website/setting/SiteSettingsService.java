package vn.hugamex.website.setting;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hugamex.website.audit.AuditService;
import vn.hugamex.website.common.ApiException;

@Service
public class SiteSettingsService {
  private final JdbcTemplate db;
  private final AuditService audit;

  public SiteSettingsService(JdbcTemplate db, AuditService audit) {
    this.db = db;
    this.audit = audit;
  }

  public Map<String, String> read() {
    Map<String, String> values = new LinkedHashMap<>();
    db.query(
        "SELECT key,value FROM site_settings ORDER BY key",
        rs -> {
          values.put(rs.getString(1), rs.getString(2));
        });
    return values;
  }

  @Transactional
  public Map<String, String> update(Map<String, String> values, UUID actor) {
    Set<String> allowed =
        Set.of(
            "companyName",
            "contactEmail",
            "contactPhone",
            "contactFax",
            "contactAddress",
            "officeHours",
            "facebookUrl",
            "linkedinUrl");
    if (values.size() > allowed.size() || !allowed.containsAll(values.keySet()))
      throw new ApiException(400, "Unsupported setting.");
    values.forEach(
        (key, value) -> {
          if (value == null || value.length() > 2000)
            throw new ApiException(400, "Invalid setting.");
          if (key.endsWith("Url") && !value.isBlank()) {
            try {
              var uri = java.net.URI.create(value);
              if (!"https".equals(uri.getScheme()) || uri.getHost() == null)
                throw new IllegalArgumentException();
            } catch (IllegalArgumentException e) {
              throw new ApiException(400, "Use HTTPS social URLs.");
            }
          }
          db.update(
              "INSERT INTO site_settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
              key,
              value);
        });
    audit.record(actor, "SETTINGS_UPDATED", "SITE", null);
    return read();
  }
}
