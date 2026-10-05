package vn.hugamex.website.config;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hugamex.website.common.ApiException;

/** Read-only handshake for the explicitly authorised local Supabase preview seed tool. */
@RestController
@Profile("dev")
public class PreviewSeedTarget {
  private final boolean enabled;
  private final String jdbcUrl;
  private final String username;

  public PreviewSeedTarget(
      @Value("${ALLOW_SUPABASE_PREVIEW_SEED:false}") boolean enabled,
      @Value("${spring.datasource.url}") String jdbcUrl,
      @Value("${spring.datasource.username}") String username) {
    this.enabled = enabled;
    this.jdbcUrl = jdbcUrl;
    this.username = username;
  }

  @GetMapping("/api/v1/admin/preview-seed-target")
  @PreAuthorize("@policy.business(authentication)")
  public Map<String, String> target() {
    return fingerprint(enabled, jdbcUrl, username);
  }

  public static Map<String, String> fingerprint(boolean enabled, String jdbcUrl, String username) {
    if (!enabled) throw new ApiException(403, "Preview seeding is disabled.");
    URI uri = URI.create(jdbcUrl.substring("jdbc:".length()));
    if (!"aws-0-ap-northeast-2.pooler.supabase.com".equals(uri.getHost())
        || uri.getPort() != 5432
        || !"/postgres".equals(uri.getPath())
        || !"postgres.qhpdjefulinrwbcwqxfi".equals(username)
        || !Arrays.asList(Objects.requireNonNullElse(uri.getQuery(), "").split("&"))
            .contains("sslmode=require"))
      throw new ApiException(403, "The configured database is not the reviewed preview target.");
    try {
      String fingerprint =
          HexFormat.of()
              .formatHex(
                  MessageDigest.getInstance("SHA-256")
                      .digest((jdbcUrl + "\n" + username).getBytes(StandardCharsets.UTF_8)));
      return Map.of("profile", "dev", "targetFingerprint", fingerprint);
    } catch (java.security.NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
