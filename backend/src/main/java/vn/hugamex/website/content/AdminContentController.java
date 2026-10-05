package vn.hugamex.website.content;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hugamex.website.common.*;
import vn.hugamex.website.security.*;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("@policy.admin(authentication)")
public class AdminContentController {
  private final ContentService service;
  private final Policy policy;

  public AdminContentController(ContentService s, Policy p) {
    service = s;
    policy = p;
  }

  private String allow(Authentication a, String resource) {
    String kind = ContentService.kind(resource);
    if (!policy.cms(a, kind)) throw new ApiException(403, "Your role cannot manage this resource.");
    return kind;
  }

  @GetMapping(
      "/{resource:posts|pages|branches|products|partners|certifications|categories|product-categories|hero-slides}")
  PageResult<ContentDto> list(
      Authentication a,
      @PathVariable String resource,
      @RequestParam(defaultValue = "vi") String locale,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return service.list(allow(a, resource), locale, search, status, page, size, true, null);
  }

  @GetMapping(
      "/{resource:posts|pages|branches|products|partners|certifications|categories|product-categories|hero-slides}/{id}")
  ContentDto get(
      Authentication a,
      @PathVariable String resource,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "vi") String locale) {
    return service.get(allow(a, resource), id, locale);
  }

  @PostMapping(
      "/{resource:posts|pages|branches|products|partners|certifications|categories|product-categories|hero-slides}")
  ContentDto create(
      Authentication a, @PathVariable String resource, @Valid @RequestBody ContentRequests.Save r) {
    return service.save(allow(a, resource), null, r, policy.actor(a));
  }

  @PutMapping(
      "/{resource:posts|pages|branches|products|partners|certifications|categories|product-categories|hero-slides}/{id}")
  ContentDto save(
      Authentication a,
      @PathVariable String resource,
      @PathVariable UUID id,
      @Valid @RequestBody ContentRequests.Save r) {
    return service.save(allow(a, resource), id, r, policy.actor(a));
  }

  @PatchMapping(
      "/{resource:posts|pages|branches|products|partners|certifications|categories|product-categories|hero-slides}/{id}/status")
  Map<String, String> status(
      Authentication a,
      @PathVariable String resource,
      @PathVariable UUID id,
      @Valid @RequestBody ContentRequests.Status r) {
    service.status(allow(a, resource), id, r.status(), policy.actor(a));
    return Map.of("message", "Status updated.");
  }
}
