package vn.hugamex.website.config;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.io.*;
import java.nio.channels.FileChannel;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import vn.hugamex.website.audit.AuditService;
import vn.hugamex.website.content.*;
import vn.hugamex.website.media.MediaService;
import vn.hugamex.website.security.Actor;
import vn.hugamex.website.setting.*;

/** Explicit development job, not a browser identity or a replacement for HTTP MFA. */
@Component
@Profile("dev")
@ConditionalOnProperty(name = "RUN_SUPABASE_PREVIEW_SEED_JOB", havingValue = "true")
public class SupabasePreviewSeedJob implements ApplicationRunner {
  private final ContentService content;
  private final MediaService media;
  private final HomepageService homepage;
  private final SiteSettingsService settings;
  private final AuditService audit;
  private final JdbcTemplate db;
  private final ObjectMapper mapper;
  private final ConfigurableApplicationContext context;
  private final String target;
  private final Path local = Path.of("../.local").toAbsolutePath().normalize();
  private final Path statePath = local.resolve("supabase-preview-seed-state.json");
  private ObjectNode state;
  private Actor actor;
  private final Map<String, UUID> ids = new LinkedHashMap<>();
  private int writes;

  public SupabasePreviewSeedJob(
      ContentService content,
      MediaService media,
      HomepageService homepage,
      SiteSettingsService settings,
      AuditService audit,
      JdbcTemplate db,
      ObjectMapper mapper,
      ConfigurableApplicationContext context,
      @Value("${ALLOW_SUPABASE_PREVIEW_SEED:false}") boolean enabled,
      @Value("${spring.datasource.url}") String jdbcUrl,
      @Value("${spring.datasource.username}") String username) {
    this.content = content;
    this.media = media;
    this.homepage = homepage;
    this.settings = settings;
    this.audit = audit;
    this.db = db;
    this.mapper = mapper;
    this.context = context;
    target = PreviewSeedTarget.fingerprint(enabled, jdbcUrl, username).get("targetFingerprint");
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    try (var channel =
            FileChannel.open(
                local.resolve("preview-seed.lock"),
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE);
        var lock = channel.tryLock()) {
      if (lock == null) throw new IllegalStateException("Another preview seed job is running.");
      JsonNode manifest = mapper.readTree(local.resolve("supabase-preview-catalog.json").toFile());
      if (!target.equals(manifest.path("targetFingerprint").asText())
          || manifest.path("version").asInt() != 1)
        throw new IllegalStateException("Manifest target or version mismatch.");
      UUID owner = UUID.fromString(manifest.path("actorId").asText());
      if (!Boolean.TRUE.equals(
          db.queryForObject(
              "SELECT EXISTS(SELECT 1 FROM users u JOIN user_roles r ON r.user_id=u.id WHERE u.id=? AND u.status='ACTIVE' AND u.verified=true AND r.role_name IN ('ADMIN','SUPER_ADMIN'))",
              Boolean.class,
              owner)))
        throw new IllegalStateException(
            "An active privileged owner must be configured for the seed audit.");
      // No session is created and no MFA verification is fabricated. Environment flags authorise
      // this dev job.
      actor = new Actor(owner, null, Set.of(), false, Instant.now());
      state =
          Files.exists(statePath)
              ? (ObjectNode) mapper.readTree(statePath.toFile())
              : mapper.createObjectNode();
      if (state.has("targetFingerprint")
          && !target.equals(state.path("targetFingerprint").asText()))
        throw new IllegalStateException("Seed state belongs to another target.");
      state.put("version", 1);
      state.put("targetFingerprint", target);
      state.withObject("entries");
      state.withObject("media");
      state.withObject("sections");
      audit.record(owner, "PREVIEW_SEED_JOB_STARTED", "DEV_JOB", null);
      for (JsonNode category : manifest.path("categories")) {
        ObjectNode spec = mapper.createObjectNode();
        spec.put("resource", "categories");
        spec.put("key", category.get(0).asText());
        spec.set("metadata", mapper.createObjectNode());
        ObjectNode translations = spec.putObject("translations");
        for (int n = 1; n <= 2; n++) {
          ObjectNode copy = translations.putObject(n == 1 ? "vi" : "en");
          copy.put("title", category.get(n).asText());
          copy.put("excerpt", category.get(n).asText());
          copy.putObject("content").put("type", "doc").putArray("content");
        }
        upsert(spec);
      }
      for (JsonNode spec : manifest.path("catalog")) upsert(spec);
      retire(manifest.path("retiredKeys"));
      seedHomepage(manifest.path("homeCopy"));
      seedSettings(manifest.path("settings"));
      int firstWrites = writes;
      for (JsonNode spec : manifest.path("catalog")) upsert(spec);
      retire(manifest.path("retiredKeys"));
      seedSettings(manifest.path("settings"));
      if (writes != firstWrites)
        throw new IllegalStateException("Idempotency check wrote duplicate content.");
      Map<String, Long> counts = new LinkedHashMap<>();
      for (String resource :
          List.of(
              "pages",
              "posts",
              "products",
              "hero-slides",
              "categories",
              "product-categories",
              "branches",
              "partners",
              "certifications")) {
        long vi =
            content
                .list(ContentService.kind(resource), "vi", "", "PUBLISHED", 0, 1, true, null)
                .total();
        long en =
            content
                .list(ContentService.kind(resource), "en", "", "PUBLISHED", 0, 1, true, null)
                .total();
        counts.put(resource + "Vi", vi);
        counts.put(resource + "En", en);
      }
      ObjectNode report = mapper.createObjectNode();
      report.put("checkedAt", Instant.now().toString());
      report.put("mode", "explicit-dev-service-job");
      report.put("contentWrites", writes);
      report.put("idempotentSecondPass", true);
      report.set("publishedCounts", mapper.valueToTree(counts));
      Files.createDirectories(Path.of("../docs/qa/phase2"));
      mapper
          .writerWithDefaultPrettyPrinter()
          .writeValue(Path.of("../docs/qa/phase2/seed-summary.json").toFile(), report);
      audit.record(owner, "PREVIEW_SEED_JOB_FINISHED", "DEV_JOB", null);
      System.out.println(
          "Preview seed job completed; bilingual counts written to docs/qa/phase2/seed-summary.json.");
    }
    System.exit(SpringApplication.exit(context, () -> 0));
  }

  private UUID upsert(JsonNode spec) throws Exception {
    String resource = spec.path("resource").asText(),
        key = spec.path("key").asText(),
        stable = resource + "/" + key;
    String kind = ContentService.kind(resource);
    JsonNode saved = state.path("entries").path(stable);
    UUID id = saved.has("id") ? UUID.fromString(saved.path("id").asText()) : null;
    if (id == null) {
      for (int page = 0; ; page++) {
        var listing = content.list(kind, "vi", "", "", page, 50, true, null);
        for (var item : listing.items())
          if (key.equals(item.canonicalSlug())
              || spec.path("metadata").has("routeKey")
                  && spec.path("metadata")
                      .path("routeKey")
                      .asText()
                      .equals(item.metadata().get("routeKey"))) {
            ids.put(stable, item.id());
            System.out.println("Preserved existing owner content: " + stable);
            return item.id();
          }
        if ((page + 1) * 50 >= listing.total()) break;
      }
    }
    UUID image = spec.path("image").isTextual() ? image(spec.path("image").asText()) : null;
    ObjectNode payloads = mapper.createObjectNode();
    for (String locale : List.of("vi", "en")) {
      ObjectNode body = spec.path("translations").path(locale).deepCopy();
      body.put("locale", locale);
      body.put("slug", locale.equals("vi") ? key : key + "-en");
      body.put("seoTitle", body.path("title").asText().replace('\n', ' '));
      body.put("seoDescription", body.path("excerpt").asText());
      if (image == null) body.putNull("featuredMediaId");
      else body.put("featuredMediaId", image.toString());
      body.put("featured", resource.equals("hero-slides"));
      body.set("metadata", spec.path("metadata"));
      ArrayNode categories = body.putArray("categoryIds");
      if (spec.path("category").isTextual())
        categories.add(
            ids.get(
                    (resource.equals("products") ? "product-categories/" : "categories/")
                        + spec.path("category").asText())
                .toString());
      payloads.set(locale, body);
    }
    if (id != null)
      for (String locale : List.of("vi", "en")) {
        var current = content.get(kind, id, locale);
        String previous = saved.path("fingerprints").path(locale).asText();
        if (!previous.isEmpty()
                && (!previous.equals(hash(editable(current)))
                    || !current.status().equals(saved.path("status").asText()))
            || previous.isEmpty() && !current.title().isEmpty()) {
          ids.put(stable, id);
          System.out.println("Preserved edited owner content: " + stable);
          return id;
        }
      }
    if (id != null && hash(payloads).equals(saved.path("payloadHash").asText())) {
      ids.put(stable, id);
      return id;
    }
    for (String locale : List.of("vi", "en")) {
      var result =
          content.save(
              kind,
              id,
              mapper.treeToValue(payloads.path(locale), ContentRequests.Save.class),
              actor);
      id = result.id();
      writes++;
      ObjectNode record = state.withObject("entries").withObject(stable);
      record.put("id", id.toString());
      record.put("status", result.status());
      record.withObject("fingerprints").put(locale, hash(editable(result)));
      persist();
    }
    content.status(kind, id, "PUBLISHED", actor);
    writes++;
    ObjectNode record = state.withObject("entries").withObject(stable);
    record.put("status", "PUBLISHED");
    record.put("payloadHash", hash(payloads));
    for (String locale : List.of("vi", "en"))
      record.withObject("fingerprints").put(locale, hash(editable(content.get(kind, id, locale))));
    persist();
    ids.put(stable, id);
    System.out.println("Published preview content: " + stable);
    return id;
  }

  private UUID image(String key) throws Exception {
    String number =
        switch (key) {
          case "sewing" -> "5830692";
          case "textile" -> "12362544";
          case "jacket", "sportswear", "trousers" -> key;
          default -> throw new IllegalArgumentException("Unsupported preview photo.");
        };
    if (state.path("media").has(key)) {
      UUID id = UUID.fromString(state.path("media").path(key).asText());
      media.info(id);
      return id;
    }
    byte[] bytes = Files.readAllBytes(local.resolve("preview-stock-" + number + ".jpg"));
    String alt =
        switch (key) {
          case "sewing" -> "Ảnh minh họa thao tác may; ảnh stock, không phải nhà máy HUGAMEX";
          case "jacket" -> "Ảnh stock minh họa áo khoác; không phải sản phẩm HUGAMEX";
          case "sportswear" -> "Ảnh stock minh họa áo thể thao; không phải sản phẩm HUGAMEX";
          case "trousers" -> "Ảnh stock minh họa quần; không phải sản phẩm HUGAMEX";
          default -> "Ảnh minh họa chất liệu; ảnh stock, không phải tư liệu HUGAMEX";
        };
    var result =
        media.upload(new PreviewFile("stock-" + number + ".jpg", bytes), alt, true, actor.id());
    state.withObject("media").put(key, result.id().toString());
    persist();
    return result.id();
  }

  private void seedHomepage(JsonNode copies) throws Exception {
    Map<String, List<UUID>> refs = new HashMap<>();
    refs.put("about", List.of(ids.get("pages/gioi-thieu")));
    refs.put("manufacturing", List.of(ids.get("pages/nang-luc-san-xuat")));
    refs.put(
        "branches",
        ids.entrySet().stream()
            .filter(e -> e.getKey().startsWith("branches/"))
            .map(Map.Entry::getValue)
            .toList());
    refs.put("quality", List.of(ids.get("certifications/ho-so-chat-luong")));
    refs.put("partners", List.of(ids.get("partners/hop-tac-may-mac")));
    refs.put(
        "products",
        ids.entrySet().stream()
            .filter(e -> e.getKey().startsWith("products/"))
            .map(Map.Entry::getValue)
            .toList());
    refs.put(
        "news",
        ids.entrySet().stream()
            .filter(e -> e.getKey().startsWith("posts/"))
            .limit(3)
            .map(Map.Entry::getValue)
            .toList());
    for (var section : homepage.sections()) {
      String previous = state.path("sections").path(section.key()).path("fingerprint").asText();
      if (!previous.isEmpty() && !previous.equals(hash(mapper.valueToTree(section)))
          || previous.isEmpty()
              && (!section.contentIds().isEmpty()
                  || !section.headlineVi().isEmpty()
                  || !section.headlineEn().isEmpty())) continue;
      JsonNode copy = copies.path(section.key());
      if (!copy.isArray()) continue;
      var next =
          new SiteController.Section(
              section.id(),
              section.key(),
              true,
              section.position(),
              copy.get(0).asText(),
              copy.get(1).asText(),
              copy.get(2).asText(),
              copy.get(3).asText(),
              refs.getOrDefault(section.key(), List.of()));
      if (previous.equals(hash(mapper.valueToTree(next)))) continue;
      homepage.update(next.id(), next, actor.id());
      state
          .withObject("sections")
          .withObject(section.key())
          .put("fingerprint", hash(mapper.valueToTree(next)));
      persist();
    }
  }

  private void retire(JsonNode retired) throws Exception {
    for (JsonNode key : retired) {
      String stable = key.asText();
      JsonNode saved = state.path("entries").path(stable);
      if (!saved.has("id")) continue;
      String kind = ContentService.kind(stable.split("/")[0]);
      UUID id = UUID.fromString(saved.path("id").asText());
      boolean untouched = true;
      for (String locale : List.of("vi", "en")) {
        var item = content.get(kind, id, locale);
        if (!saved.path("fingerprints").path(locale).asText().equals(hash(editable(item)))
            || !saved.path("status").asText().equals(item.status())) untouched = false;
      }
      if (!untouched || "ARCHIVED".equals(saved.path("status").asText())) continue;
      content.status(kind, id, "ARCHIVED", actor);
      writes++;
      ObjectNode record = state.withObject("entries").withObject(stable);
      record.put("status", "ARCHIVED");
      for (String locale : List.of("vi", "en"))
        record
            .withObject("fingerprints")
            .put(locale, hash(editable(content.get(kind, id, locale))));
      persist();
    }
  }

  private void seedSettings(JsonNode source) throws Exception {
    Map<String, String> current = settings.read();
    ObjectNode saved = state.withObject("settings");
    Map<String, String> changes = new LinkedHashMap<>();
    var fields = source.fields();
    while (fields.hasNext()) {
      var field = fields.next();
      String key = field.getKey(),
          value = field.getValue().asText(),
          existing = current.getOrDefault(key, "");
      if (saved.has(key)
          ? !saved.path(key).asText().equals(hash(mapper.valueToTree(existing)))
          : !existing.isBlank()) continue;
      if (!existing.equals(value)) changes.put(key, value);
    }
    if (changes.isEmpty()) return;
    settings.update(changes, actor.id());
    changes.forEach(
        (key, value) -> {
          try {
            saved.put(key, hash(mapper.valueToTree(value)));
          } catch (Exception e) {
            throw new IllegalStateException(e);
          }
        });
    persist();
  }

  private ObjectNode editable(ContentDto item) {
    ObjectNode all = mapper.valueToTree(item);
    ObjectNode result = mapper.createObjectNode();
    for (String key :
        List.of(
            "locale",
            "title",
            "slug",
            "excerpt",
            "content",
            "seoTitle",
            "seoDescription",
            "featuredMediaId",
            "featured",
            "metadata",
            "categoryIds")) result.set(key, all.path(key));
    return result;
  }

  private JsonNode canonical(JsonNode value) {
    if (value.isObject()) {
      ObjectNode result = mapper.createObjectNode();
      List<String> keys = new ArrayList<>();
      value.fieldNames().forEachRemaining(keys::add);
      Collections.sort(keys);
      keys.forEach(k -> result.set(k, canonical(value.get(k))));
      return result;
    }
    if (value.isArray()) {
      ArrayNode result = mapper.createArrayNode();
      value.forEach(v -> result.add(canonical(v)));
      return result;
    }
    return value;
  }

  private String hash(JsonNode value) throws Exception {
    return HexFormat.of()
        .formatHex(
            MessageDigest.getInstance("SHA-256")
                .digest(mapper.writeValueAsBytes(canonical(value))));
  }

  private void persist() throws Exception {
    Path tmp = statePath.resolveSibling(statePath.getFileName() + ".tmp");
    mapper.writerWithDefaultPrettyPrinter().writeValue(tmp.toFile(), state);
    Files.setPosixFilePermissions(tmp, PosixFilePermissions.fromString("rw-------"));
    Files.move(tmp, statePath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
  }

  private record PreviewFile(String filename, byte[] data) implements MultipartFile {
    public String getName() {
      return "file";
    }

    public String getOriginalFilename() {
      return filename;
    }

    public String getContentType() {
      return "image/jpeg";
    }

    public boolean isEmpty() {
      return data.length == 0;
    }

    public long getSize() {
      return data.length;
    }

    public byte[] getBytes() {
      return data;
    }

    public InputStream getInputStream() {
      return new ByteArrayInputStream(data);
    }

    public void transferTo(File destination) throws IOException {
      Files.write(destination.toPath(), data);
    }
  }
}
