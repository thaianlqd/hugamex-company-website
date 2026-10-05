package vn.hugamex.website.security;

import java.time.Instant;
import java.util.*;

public record Actor(
    UUID id,
    UUID sessionId,
    Set<String> roles,
    boolean mfaVerified,
    Instant authenticatedAt,
    boolean mfaEnabled) {
  public Actor(
      UUID id, UUID sessionId, Set<String> roles, boolean mfaVerified, Instant authenticatedAt) {
    this(id, sessionId, roles, mfaVerified, authenticatedAt, false);
  }

  public boolean has(String role) {
    return roles.contains(role);
  }

  public boolean privileged() {
    return has("ADMIN") || has("SUPER_ADMIN");
  }
}
