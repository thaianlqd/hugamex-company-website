package vn.hugamex.website;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.Test;
import vn.hugamex.website.common.ApiException;
import vn.hugamex.website.content.*;

class HeroImageValidationTest {
  private final ContentValidation validator = new ContentValidation();

  private ContentRequests.Save request(String url) throws Exception {
    return new ObjectMapper()
        .readValue(
            """
      {"locale":"vi","title":"Hero","slug":"hero","excerpt":"","content":{"type":"doc"},
       "seoTitle":"","seoDescription":"","featured":false,"categoryIds":[],"metadata":{}}
      """,
            ContentRequests.Save.class);
  }

  private void check(String url, String kind) throws Exception {
    var r = request(url);
    validator.check(
        new ContentRequests.Save(
            r.locale(),
            r.title(),
            r.slug(),
            r.excerpt(),
            r.content(),
            r.seoTitle(),
            r.seoDescription(),
            r.featuredMediaId(),
            r.featured(),
            Map.of("externalImageUrl", url),
            r.categoryIds()),
        kind);
  }

  @Test
  void approvedHttpsHostsAccepted() throws Exception {
    check("https://images.pexels.com/photos/5830692/a.jpeg?w=1200", "HERO");
    check("https://images.unsplash.com/photo-example?width=1200", "HERO");
    check("", "HERO");
  }

  @Test
  void rejectedUrlsAndOtherContentKinds() {
    for (String url :
        List.of(
            "http://images.pexels.com/a.jpg",
            "https://images.pexels.com.evil.test/a",
            "https://evil.test/a",
            "https://user@images.pexels.com/a",
            "https://127.0.0.1/a",
            "javascript:alert(1)",
            "//images.pexels.com/a",
            "https://images.pexels.com:8080/a",
            "https://images.pexels.com/" + "a".repeat(1000)))
      assertThrows(ApiException.class, () -> check(url, "HERO"), url);
    assertThrows(ApiException.class, () -> check("https://images.pexels.com/a", "PAGE"));
  }
}
