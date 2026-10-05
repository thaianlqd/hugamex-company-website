package vn.hugamex.website;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import vn.hugamex.website.common.ApiException;
import vn.hugamex.website.config.PreviewSeedTarget;

class PreviewSeedTargetTest {
  private final String url =
      "jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require";
  private final String username = "postgres.qhpdjefulinrwbcwqxfi";

  @Test
  void disabledByDefault() {
    assertThrows(ApiException.class, () -> new PreviewSeedTarget(false, url, username).target());
  }

  @Test
  void rejectsWrongProjectAndInsecureConnection() {
    assertThrows(
        ApiException.class, () -> new PreviewSeedTarget(true, url, "postgres.other").target());
    assertThrows(
        ApiException.class,
        () ->
            new PreviewSeedTarget(true, url.replace("sslmode=require", "sslmode=disable"), username)
                .target());
    assertThrows(
        ApiException.class,
        () ->
            new PreviewSeedTarget(
                    true,
                    url.replace("aws-0-ap-northeast-2.pooler.supabase.com", "localhost"),
                    username)
                .target());
  }

  @Test
  void targetHandshakeIsNonSecretAndStable() {
    var target = new PreviewSeedTarget(true, url, username).target();
    assertEquals("dev", target.get("profile"));
    assertEquals(64, target.get("targetFingerprint").length());
    assertEquals(target, new PreviewSeedTarget(true, url, username).target());
  }
}
