package vn.hugamex.website.media;

import java.util.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.hugamex.website.common.*;
import vn.hugamex.website.security.Policy;

@RestController
@RequestMapping("/api/v1")
public class MediaController {
  private final MediaService service;
  private final Policy policy;

  public MediaController(MediaService service, Policy policy) {
    this.service = service;
    this.policy = policy;
  }

  @GetMapping("/media/{id}")
  ResponseEntity<byte[]> download(
      @PathVariable UUID id,
      Authentication a,
      @RequestHeader(value = "If-None-Match", required = false) String etag) {
    var info = service.info(id);
    if (!info.isPublic()
        && (a == null
            || !(a.getPrincipal() instanceof vn.hugamex.website.security.Actor)
            || !policy.admin(a))) throw new ApiException(404, "Media not found.");
    String tag = "\"" + info.contentHash() + "\"";
    var builder =
        ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(info.mimeType()))
            .header("X-Content-Type-Options", "nosniff")
            .header(
                "Content-Disposition",
                ContentDisposition.builder(
                        info.mimeType().equals("application/pdf") ? "attachment" : "inline")
                    .filename(info.originalFilename())
                    .build()
                    .toString())
            .header("Cache-Control", info.isPublic() ? "public,max-age=60" : "private,no-store")
            .eTag(tag);
    if (info.isPublic() && tag.equals(etag))
      return ResponseEntity.status(304)
          .eTag(tag)
          .header("Cache-Control", "public,max-age=60")
          .build();
    return builder.body(service.bytes(id));
  }

  @GetMapping("/admin/media")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.admin(authentication)")
  PageResult<MediaService.Info> list(
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return service.list(search, page, size);
  }

  @PostMapping("/admin/media")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.admin(authentication)")
  MediaService.Info upload(
      Authentication a,
      @RequestParam MultipartFile file,
      @RequestParam(defaultValue = "") String altText,
      @RequestParam(defaultValue = "false") boolean isPublic) {
    return service.upload(file, altText, isPublic, policy.actor(a).id());
  }

  @DeleteMapping("/admin/media/{id}")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.admin(authentication)")
  Map<String, String> delete(Authentication a, @PathVariable UUID id) {
    service.delete(id, policy.actor(a).id());
    return Map.of("message", "Media deleted.");
  }

  public record Metadata(
      @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.Size(max = 500)
          String altText,
      @jakarta.validation.constraints.NotNull Boolean isPublic) {}

  @PatchMapping("/admin/media/{id}")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.admin(authentication)")
  MediaService.Info update(
      Authentication a,
      @PathVariable UUID id,
      @jakarta.validation.Valid @RequestBody Metadata metadata) {
    return service.update(id, metadata.altText(), metadata.isPublic(), policy.actor(a).id());
  }
}
