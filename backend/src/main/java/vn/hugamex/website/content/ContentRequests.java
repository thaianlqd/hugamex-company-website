package vn.hugamex.website.content;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.*;
import java.util.*;

public final class ContentRequests {
  public record Save(
      @NotNull @Pattern(regexp = "vi|en") String locale,
      @NotBlank @Size(max = 200) String title,
      @NotBlank @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*") @Size(max = 180) String slug,
      @NotNull @Size(max = 1000) String excerpt,
      @NotNull JsonNode content,
      @NotNull @Size(max = 200) String seoTitle,
      @NotNull @Size(max = 320) String seoDescription,
      UUID featuredMediaId,
      boolean featured,
      @NotNull Map<String, String> metadata,
      @NotNull @Size(max = 20) List<UUID> categoryIds) {}

  public record Status(@NotBlank @Pattern(regexp = "DRAFT|PUBLISHED|ARCHIVED") String status) {}
}
