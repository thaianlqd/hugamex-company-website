package vn.hugamex.website;

import static org.junit.jupiter.api.Assertions.*;

import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import vn.hugamex.website.auth.*;
import vn.hugamex.website.common.*;
import vn.hugamex.website.security.*;

class SecurityUnitTest {
  @Test
  void totpMatchesRfc6238Sha1SixDigitVector() {
    assertEquals("287082", new Totp().code("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 1));
  }

  @Test
  void totpReplayAndWrongCodeRejected() {
    var t = new Totp();
    String secret = t.secret();
    String code = t.code(secret, 100);
    assertEquals(100, t.verify(secret, code, 100, 99));
    assertEquals(-1, t.verify(secret, code, 100, 100));
    assertEquals(-1, t.verify(secret, "abcdef", 100, -1));
  }

  @Test
  void cryptoRoundTripAndDigestBinding() {
    String key = Base64.getEncoder().encodeToString(new byte[32]);
    var c = new Crypto(key, key, key);
    String secret = c.randomToken();
    assertEquals(secret, c.decrypt(c.encrypt(secret)));
    assertNotEquals(c.encrypt(secret), c.encrypt(secret));
    UUID id = UUID.randomUUID();
    assertNotEquals(
        c.otpHash(id, "a", "EMAIL_VERIFICATION", "123456"),
        c.otpHash(id, "a", "PASSWORD_RESET", "123456"));
    assertNotEquals(secret, c.tokenHash(secret));
    assertThrows(IllegalStateException.class, () -> new Crypto("", key, key));
  }

  @Test
  void weakPasswordsRejected() {
    assertThrows(ApiException.class, () -> AuthService.password("short"));
    assertThrows(ApiException.class, () -> AuthService.password("123456789012"));
    assertDoesNotThrow(() -> AuthService.password("a secure password phrase"));
  }

  @Test
  void combinedRolesCannotBypassMandatoryMfa() {
    var p = new Policy(Clock.systemUTC());
    Actor a =
        new Actor(
            UUID.randomUUID(), UUID.randomUUID(), Set.of("ADMIN", "EDITOR"), false, Instant.now());
    var auth = new UsernamePasswordAuthenticationToken(a, null, List.of());
    assertFalse(p.admin(auth));
    assertFalse(p.cms(auth, "POST"));
    assertFalse(p.business(auth));
  }

  @Test
  void configuredEditorMfaMustBeCompleted() {
    var p = new Policy(Clock.systemUTC());
    var a =
        new Actor(
            UUID.randomUUID(), UUID.randomUUID(), Set.of("EDITOR"), false, Instant.now(), true);
    var auth = new UsernamePasswordAuthenticationToken(a, null, List.of());
    assertFalse(p.admin(auth));
    assertFalse(p.cms(auth, "POST"));
  }

  @Test
  void editorCannotManageBusinessOrSecurity() {
    var p = new Policy(Clock.systemUTC());
    Actor a =
        new Actor(UUID.randomUUID(), UUID.randomUUID(), Set.of("EDITOR"), false, Instant.now());
    var auth = new UsernamePasswordAuthenticationToken(a, null, List.of());
    assertTrue(p.cms(auth, "POST"));
    assertFalse(p.cms(auth, "BRANCH"));
    assertFalse(p.superAdmin(auth));
    assertFalse(p.business(auth));
  }
}
