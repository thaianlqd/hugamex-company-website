package vn.hugamex.website.content;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.*;

public record ContentDto(
    UUID id,
    String kind,
    String status,
    boolean featured,
    UUID featuredMediaId,
    String featuredMediaAlt,
    Instant publishedAt,
    String locale,
    String title,
    String slug,
    String canonicalSlug,
    String excerpt,
    JsonNode content,
    String seoTitle,
    String seoDescription,
    Map<String, String> metadata,
    List<UUID> categoryIds) {}
