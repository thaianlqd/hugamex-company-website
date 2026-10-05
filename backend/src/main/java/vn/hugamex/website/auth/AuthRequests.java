package vn.hugamex.website.auth;

import jakarta.validation.constraints.*;
import java.util.UUID;

public final class AuthRequests {
  public record Register(
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(min = 12, max = 128) String password,
      @NotBlank @Size(max = 120) String name) {
    @Override
    public String toString() {
      return "Authentication request [redacted]";
    }
  }

  public record Login(
      @NotBlank @Email @Size(max = 254) String email, @NotBlank @Size(max = 128) String password) {
    @Override
    public String toString() {
      return "Authentication request [redacted]";
    }
  }

  public record EmailOnly(@NotBlank @Email @Size(max = 254) String email) {
    @Override
    public String toString() {
      return "Authentication request [redacted]";
    }
  }

  public record Verify(
      @NotNull UUID challengeId, @NotBlank @Pattern(regexp = "[0-9]{6}") String code) {
    @Override
    public String toString() {
      return "Authentication request [redacted]";
    }
  }

  public record Reset(
      @NotBlank @Size(max = 100) String resetToken,
      @NotBlank @Size(min = 12, max = 128) String password) {
    @Override
    public String toString() {
      return "Authentication request [redacted]";
    }
  }

  public record Change(
      @NotBlank @Size(max = 128) String currentPassword,
      @NotBlank @Size(min = 12, max = 128) String password) {
    @Override
    public String toString() {
      return "Authentication request [redacted]";
    }
  }

  public record Mfa(@NotBlank @Size(max = 100) String code) {
    @Override
    public String toString() {
      return "Authentication request [redacted]";
    }
  }
}
