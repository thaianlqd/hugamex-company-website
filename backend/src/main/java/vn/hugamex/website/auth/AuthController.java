package vn.hugamex.website.auth;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import vn.hugamex.website.security.*;
import vn.hugamex.website.user.UserDto;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
  private final AuthService auth;
  private final SessionService sessions;
  private final Policy policy;
  private final boolean secure;
  private final boolean google;

  public AuthController(
      AuthService auth,
      SessionService sessions,
      Policy policy,
      @Value("${app.secure-cookies}") boolean secure,
      @Value("${GOOGLE_CLIENT_ID:}") String google) {
    this.auth = auth;
    this.sessions = sessions;
    this.policy = policy;
    this.secure = secure;
    this.google = !google.isBlank();
  }

  @GetMapping("/auth/csrf")
  Map<String, String> csrf(CsrfToken token) {
    return Map.of("token", token.getToken());
  }

  @GetMapping("/auth/config")
  Map<String, Boolean> config(@CookieValue(name = "HUGAMEX_REFRESH", required = false) String raw) {
    // Presence is a UI hint only. Refresh still validates the digest, expiry and account in the
    // database.
    return Map.of("googleEnabled", google, "hasRefreshSession", raw != null && !raw.isBlank());
  }

  @PostMapping("/auth/register")
  AuthService.Challenge register(
      @Valid @RequestBody AuthRequests.Register r, HttpServletRequest q) {
    return auth.register(r, q.getRemoteAddr());
  }

  @PostMapping("/auth/resend-verification")
  AuthService.Challenge resend(@Valid @RequestBody AuthRequests.EmailOnly r, HttpServletRequest q) {
    return auth.send(r, "EMAIL_VERIFICATION", q.getRemoteAddr());
  }

  @PostMapping("/auth/forgot-password")
  AuthService.Challenge forgot(@Valid @RequestBody AuthRequests.EmailOnly r, HttpServletRequest q) {
    return auth.send(r, "PASSWORD_RESET", q.getRemoteAddr());
  }

  @PostMapping("/auth/verify-email")
  Map<String, String> verify(@Valid @RequestBody AuthRequests.Verify r, HttpServletRequest q) {
    auth.verifyEmail(r, q.getRemoteAddr());
    return Map.of("message", "Email verified.");
  }

  @PostMapping("/auth/verify-reset-otp")
  Map<String, String> verifyReset(@Valid @RequestBody AuthRequests.Verify r, HttpServletRequest q) {
    return Map.of("resetToken", auth.verifyReset(r, q.getRemoteAddr()));
  }

  @PostMapping("/auth/reset-password")
  Map<String, String> reset(@Valid @RequestBody AuthRequests.Reset r, HttpServletRequest q) {
    auth.reset(r, q.getRemoteAddr());
    return Map.of("message", "Password updated. Sign in again.");
  }

  @PostMapping("/auth/login")
  Map<String, String> login(
      @Valid @RequestBody AuthRequests.Login r,
      HttpServletRequest q,
      HttpServletResponse response) {
    return respond(sessionsForLogin(r, q), response);
  }

  private SessionService.Session sessionsForLogin(AuthRequests.Login r, HttpServletRequest q) {
    return auth.login(r, q.getRemoteAddr());
  }

  @PostMapping("/auth/refresh")
  Map<String, String> refresh(
      @CookieValue(name = "HUGAMEX_REFRESH", required = false) String raw,
      HttpServletResponse response) {
    return respond(sessions.refresh(raw), response);
  }

  @PostMapping("/auth/logout")
  Map<String, String> logout(
      @CookieValue(name = "HUGAMEX_REFRESH", required = false) String raw,
      HttpServletResponse response) {
    sessions.logout(raw);
    cookie(response, "", 0);
    return Map.of("message", "Signed out.");
  }

  @GetMapping("/auth/me")
  UserDto me(Authentication a) {
    Actor actor = policy.actor(a);
    return sessions.me(actor.id(), actor.mfaVerified());
  }

  @PostMapping("/account/change-password")
  Map<String, String> change(
      Authentication a, @Valid @RequestBody AuthRequests.Change r, HttpServletResponse response) {
    auth.change(policy.actor(a), r);
    cookie(response, "", 0);
    return Map.of("message", "Password updated. Sign in again.");
  }

  private Map<String, String> respond(SessionService.Session s, HttpServletResponse response) {
    cookie(response, s.refreshToken(), 604800);
    return Map.of("accessToken", s.accessToken());
  }

  public void cookie(HttpServletResponse r, String value, long seconds) {
    r.addHeader(
        "Set-Cookie",
        ResponseCookie.from("HUGAMEX_REFRESH", value)
            .httpOnly(true)
            .secure(secure)
            .sameSite("Lax")
            .path("/api/v1/auth")
            .maxAge(seconds)
            .build()
            .toString());
  }
}
