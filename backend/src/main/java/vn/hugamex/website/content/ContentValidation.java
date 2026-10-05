package vn.hugamex.website.content;

import com.fasterxml.jackson.databind.JsonNode;
import java.net.URI;
import java.util.*;
import org.springframework.stereotype.Component;
import vn.hugamex.website.common.ApiException;

@Component
public class ContentValidation {
  private static final Set<String> TYPES =
      Set.of(
          "doc",
          "paragraph",
          "heading",
          "text",
          "bulletList",
          "orderedList",
          "listItem",
          "blockquote",
          "hardBreak",
          "horizontalRule");

  public void check(ContentRequests.Save r, String kind) {
    if (r.content().toString().length() > 100000
        || !"doc".equals(r.content().path("type").asText()))
      throw new ApiException(400, "Invalid document.");
    node(r.content(), 0, new int[] {0});
    Set<String> keys =
        switch (kind) {
          case "PAGE" -> Set.of("routeKey");
          case "BRANCH" ->
              Set.of(
                  "type", "address", "phone", "email", "hours", "latitude", "longitude", "mapUrl");
          case "PRODUCT" -> Set.of("specification");
          case "PARTNER" -> Set.of("website");
          case "CERTIFICATION" -> Set.of("issuer", "validUntil", "documentMediaId");
          case "HERO" -> Set.of("link", "externalImageUrl");
          default -> Set.of();
        };
    if (!keys.containsAll(r.metadata().keySet()))
      throw new ApiException(400, "Unsupported metadata field.");
    r.metadata()
        .forEach(
            (k, v) -> {
              if (v == null || v.length() > 1000) throw new ApiException(400, "Metadata too long.");
              if (Set.of("mapUrl", "website").contains(k) && !v.isBlank()) url(v);
              if (k.equals("externalImageUrl") && !v.isBlank()) externalImage(v);
              if (k.equals("routeKey")
                  && !v.matches(
                      "gioi-thieu|lich-su|tam-nhin-su-menh|nang-luc-san-xuat|phat-trien-ben-vung|tuyen-dung|chinh-sach-bao-mat"))
                throw new ApiException(400, "Select a supported corporate page.");
              if (k.equals("link") && !v.isBlank() && !v.matches("/[a-z0-9/-]*"))
                throw new ApiException(400, "Use an internal page link.");
              if (k.equals("latitude") && !v.isBlank()) coordinate(v, 90);
              if (k.equals("longitude") && !v.isBlank()) coordinate(v, 180);
              if (k.equals("validUntil") && !v.isBlank()) {
                try {
                  java.time.LocalDate.parse(v);
                } catch (java.time.format.DateTimeParseException ex) {
                  throw new ApiException(400, "Use YYYY-MM-DD for certificate validity.");
                }
              }
              if (k.equals("documentMediaId") && !v.isBlank()) UUID.fromString(v);
            });
    if (!Set.of("POST", "PRODUCT").contains(kind) && !r.categoryIds().isEmpty())
      throw new ApiException(400, "Categories are only available for posts and products.");
  }

  private void externalImage(String value) {
    try {
      URI u = URI.create(value);
      if (!"https".equals(u.getScheme())
          || u.getHost() == null
          || !Set.of("images.pexels.com", "images.unsplash.com")
              .contains(u.getHost().toLowerCase(Locale.ROOT))
          || u.getUserInfo() != null
          || (u.getPort() != -1 && u.getPort() != 443)) throw new IllegalArgumentException();
    } catch (IllegalArgumentException e) {
      throw new ApiException(
          400, "Use an HTTPS image URL from images.pexels.com or images.unsplash.com.");
    }
  }

  private void coordinate(String value, int limit) {
    try {
      double n = Double.parseDouble(value);
      if (!Double.isFinite(n) || Math.abs(n) > limit) throw new IllegalArgumentException();
    } catch (Exception e) {
      throw new ApiException(400, "Invalid coordinates.");
    }
  }

  private void url(String value) {
    try {
      URI u = URI.create(value);
      if (!Set.of("https", "http").contains(u.getScheme())
          || u.getHost() == null
          || u.getUserInfo() != null) throw new IllegalArgumentException();
    } catch (Exception e) {
      throw new ApiException(400, "Use a valid http or https URL.");
    }
  }

  private void node(JsonNode n, int depth, int[] count) {
    if (!n.isObject()
        || depth > 20
        || ++count[0] > 3000
        || !TYPES.contains(n.path("type").asText()))
      throw new ApiException(400, "Unsupported document structure.");
    n.fieldNames()
        .forEachRemaining(
            k -> {
              if (!Set.of("type", "text", "content", "attrs", "marks").contains(k))
                throw new ApiException(400, "Unsupported document field.");
            });
    if (n.has("text") && (!n.get("text").isTextual() || n.get("text").asText().length() > 20000))
      throw new ApiException(400, "Invalid text.");
    if (n.has("attrs")) {
      JsonNode attrs = n.get("attrs");
      if (!attrs.isObject()) throw new ApiException(400, "Invalid attributes.");
      String type = n.path("type").asText();
      attrs
          .fieldNames()
          .forEachRemaining(
              k -> {
                if (!(type.equals("heading") && k.equals("level")
                    || type.equals("orderedList") && k.equals("start")))
                  throw new ApiException(400, "Unsupported attribute.");
              });
      if (type.equals("heading")
          && attrs.path("level").asInt() != 2
          && attrs.path("level").asInt() != 3)
        throw new ApiException(400, "Use heading level 2 or 3.");
    }
    if (n.has("marks")) {
      if (!n.get("marks").isArray() || n.get("marks").size() > 4)
        throw new ApiException(400, "Invalid marks.");
      for (JsonNode mark : n.get("marks")) {
        String type = mark.path("type").asText();
        if (!Set.of("bold", "italic", "strike", "code", "link").contains(type))
          throw new ApiException(400, "Unsupported text mark.");
        if (type.equals("link")) url(mark.path("attrs").path("href").asText());
      }
    }
    if (n.has("content")) {
      if (!n.get("content").isArray()) throw new ApiException(400, "Invalid content.");
      for (JsonNode child : n.get("content")) node(child, depth + 1, count);
    }
  }
}
