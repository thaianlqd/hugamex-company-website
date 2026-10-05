package vn.hugamex.website.content;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import vn.hugamex.website.common.PageResult;

@RestController
@RequestMapping("/api/v1/public")
public class PublicContentController {
  private final ContentService service;

  public PublicContentController(ContentService s) {
    service = s;
  }

  @GetMapping("/featured/{section}")
  List<ContentDto> featured(
      @PathVariable String section, @RequestParam(defaultValue = "vi") String locale) {
    return service.featured(section, locale);
  }

  @GetMapping(
      "/{resource:posts|pages|branches|products|partners|certifications|categories|product-categories|hero-slides}")
  PageResult<ContentDto> list(
      @PathVariable String resource,
      @RequestParam(defaultValue = "vi") String locale,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size,
      @RequestParam(required = false) UUID category) {
    return service.list(
        ContentService.kind(resource), locale, search, "", page, size, false, category);
  }

  @GetMapping("/{resource:posts|pages|branches|products|partners|certifications}/{slug}")
  ContentDto detail(
      @PathVariable String resource,
      @PathVariable String slug,
      @RequestParam(defaultValue = "vi") String locale) {
    return service.detail(ContentService.kind(resource), slug, locale);
  }
}
