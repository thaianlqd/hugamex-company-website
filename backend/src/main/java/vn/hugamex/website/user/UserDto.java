package vn.hugamex.website.user;

import java.util.*;

public record UserDto(
    UUID id,
    String email,
    String name,
    Set<String> roles,
    boolean verified,
    boolean mfaEnabled,
    boolean mfaVerified) {}
