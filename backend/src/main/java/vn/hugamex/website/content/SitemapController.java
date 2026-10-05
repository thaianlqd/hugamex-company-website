package vn.hugamex.website.content;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public")
public class SitemapController {
  private final JdbcTemplate db;
  private final String site;

  public SitemapController(JdbcTemplate db, @Value("${app.frontend-url}") String site) {
    this.db = db;
    this.site = site.replaceAll("/$", "");
  }

  @GetMapping(value = "/sitemap.xml", produces = "application/xml")
  String sitemap() {
    Set<String> paths =
        new LinkedHashSet<>(
            List.of(
                "/",
                "/gioi-thieu",
                "/gioi-thieu/lich-su",
                "/gioi-thieu/tam-nhin-su-menh",
                "/nang-luc-san-xuat",
                "/san-pham",
                "/he-thong",
                "/doi-tac",
                "/chung-nhan",
                "/phat-trien-ben-vung",
                "/tin-tuc",
                "/tuyen-dung",
                "/lien-he",
                "/chinh-sach-bao-mat"));
    // Public VI routes are canonical. EN translations share route/language preferences.
    db.query(
        "SELECT c.kind,t.slug FROM content_items c JOIN content_translations t ON t.content_id=c.id WHERE c.status='PUBLISHED' AND t.locale='vi' AND c.kind IN ('POST','PRODUCT','BRANCH','PARTNER','CERTIFICATION') ORDER BY c.id LIMIT 10000",
        rs -> {
          String base =
              switch (rs.getString("kind")) {
                case "POST" -> "/tin-tuc/";
                case "PRODUCT" -> "/san-pham/";
                case "BRANCH" -> "/he-thong/";
                case "PARTNER" -> "/doi-tac/";
                default -> "/chung-nhan/";
              };
          paths.add(base + rs.getString("slug"));
        });
    var xml =
        new StringBuilder(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
    for (String path : paths)
      xml.append("<url><loc>").append(escape(site + path)).append("</loc></url>");
    return xml.append("</urlset>").toString();
  }

  private String escape(String value) {
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&apos;");
  }
}
