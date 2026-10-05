package vn.hugamex.website.auth;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hugamex.website.security.*;

@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/v1/auth/mfa")
public class MfaController {
  private final MfaService mfa;
  private final Policy policy;

  public MfaController(MfaService mfa, Policy policy) {
    this.mfa = mfa;
    this.policy = policy;
  }

  @PostMapping("/setup")
  Map<String, String> setup(Authentication a) {
    return mfa.setup(policy.actor(a));
  }

  @PostMapping("/enable")
  Map<String, List<String>> enable(Authentication a, @Valid @RequestBody AuthRequests.Mfa r) {
    return Map.of("recoveryCodes", mfa.verify(policy.actor(a), r.code(), true));
  }

  @PostMapping("/verify")
  Map<String, String> verify(Authentication a, @Valid @RequestBody AuthRequests.Mfa r) {
    mfa.verify(policy.actor(a), r.code(), false);
    return Map.of("message", "MFA verified.");
  }

  @PostMapping("/recovery")
  Map<String, String> recover(Authentication a, @Valid @RequestBody AuthRequests.Mfa r) {
    mfa.recover(policy.actor(a), r.code());
    return Map.of("message", "MFA verified.");
  }

  @PostMapping("/recovery/regenerate")
  Map<String, List<String>> regenerate(Authentication a) {
    return Map.of("recoveryCodes", mfa.regenerate(policy.actor(a)));
  }
}
