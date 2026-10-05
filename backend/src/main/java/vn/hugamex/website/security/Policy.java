package vn.hugamex.website.security;

import java.time.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("policy")
public class Policy {
  private final Clock clock;

  public Policy(Clock clock) {
    this.clock = clock;
  }

  public Actor actor(Authentication auth) {
    if (auth == null || !(auth.getPrincipal() instanceof Actor a))
      throw new vn.hugamex.website.common.ApiException(401, "Sign in required.");
    return a;
  }

  public boolean admin(Authentication auth) {
    Actor a = actor(auth);
    return a.has("SUPER_ADMIN") && a.mfaVerified()
        || a.has("ADMIN") && a.mfaVerified()
        || a.has("EDITOR") && !a.privileged() && (!a.mfaEnabled() || a.mfaVerified());
  }

  public boolean cms(Authentication auth, String kind) {
    if (kind.equals("HERO")) return false;
    Actor a = actor(auth);
    return a.has("SUPER_ADMIN") && a.mfaVerified()
        || a.has("ADMIN") && a.mfaVerified()
        || a.has("EDITOR")
            && !a.privileged()
            && (!a.mfaEnabled() || a.mfaVerified())
            && java.util.Set.of("POST", "PAGE", "CATEGORY").contains(kind);
  }

  public boolean superAdmin(Authentication auth) {
    Actor a = actor(auth);
    return a.has("SUPER_ADMIN") && a.mfaVerified();
  }

  public boolean business(Authentication auth) {
    Actor a = actor(auth);
    return a.privileged() && a.mfaVerified();
  }

  public boolean recent(Authentication auth) {
    return actor(auth).authenticatedAt().isAfter(clock.instant().minusSeconds(300));
  }
}
