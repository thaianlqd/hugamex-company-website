package vn.hugamex.website.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hugamex.website.common.PageResult;
import vn.hugamex.website.security.*;

@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("@policy.business(authentication)")
public class AdminUserController {
  private final AdminUserService users;
  private final Policy policy;

  public AdminUserController(AdminUserService users, Policy policy) {
    this.users = users;
    this.policy = policy;
  }

  public record Status(@NotNull @Pattern(regexp = "ACTIVE|DISABLED") String status) {}

  public record Role(@NotNull @Pattern(regexp = "USER|EDITOR|ADMIN|SUPER_ADMIN") String role) {}

  public record Create(
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(max = 120) String name,
      @NotNull @Pattern(regexp = "USER|EDITOR|ADMIN|SUPER_ADMIN") String role) {}

  @GetMapping("/users")
  PageResult<AdminUserService.Summary> list(
      Authentication a,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return users.list(policy.actor(a), search, page, size);
  }

  @PostMapping("/users")
  Map<String, UUID> create(Authentication a, @Valid @RequestBody Create r) {
    return Map.of("id", users.create(policy.actor(a), r.email(), r.name(), r.role()));
  }

  @PatchMapping("/users/{id}/status")
  Map<String, String> status(
      Authentication a, @PathVariable UUID id, @Valid @RequestBody Status s) {
    users.status(policy.actor(a), id, s.status());
    return Map.of("message", "User status updated.");
  }

  @PatchMapping("/users/{id}/role")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.superAdmin(authentication)")
  Map<String, String> role(Authentication a, @PathVariable UUID id, @Valid @RequestBody Role r) {
    users.role(policy.actor(a), id, r.role());
    return Map.of("message", "Role updated.");
  }

  @PostMapping("/users/{id}/reset-mfa")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.superAdmin(authentication)")
  Map<String, String> resetMfa(Authentication a, @PathVariable UUID id) {
    users.resetMfa(policy.actor(a), id);
    return Map.of("message", "MFA reset and sessions revoked.");
  }

  @GetMapping("/roles")
  @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
  @PreAuthorize("@policy.superAdmin(authentication)")
  List<String> roles() {
    return List.of("USER", "EDITOR", "ADMIN", "SUPER_ADMIN");
  }
}
