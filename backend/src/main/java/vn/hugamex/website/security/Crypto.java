package vn.hugamex.website.security;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class Crypto {
  private final byte[] tokenKey, otpKey, mfaKey;
  private final SecureRandom random = new SecureRandom();

  public Crypto(
      @Value("${app.token-key}") String token,
      @Value("${app.otp-key}") String otp,
      @Value("${app.mfa-key}") String mfa) {
    tokenKey = key(token);
    otpKey = key(otp);
    mfaKey = key(mfa);
    if (mfaKey.length != 32)
      throw new IllegalStateException("MFA encryption requires a 32-byte key.");
  }

  public static byte[] key(String value) {
    try {
      byte[] k = Base64.getDecoder().decode(value);
      if (k.length < 32) throw new IllegalArgumentException();
      return k;
    } catch (Exception e) {
      throw new IllegalStateException(
          "Security keys must be base64 encoded and at least 32 bytes.");
    }
  }

  public String randomToken() {
    byte[] b = new byte[32];
    random.nextBytes(b);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
  }

  public String otp() {
    return String.format("%06d", random.nextInt(1000000));
  }

  public String tokenHash(String raw) {
    return hmac(tokenKey, raw);
  }

  public String otpHash(UUID id, String email, String purpose, String code) {
    return hmac(otpKey, id + ":" + email + ":" + purpose + ":" + code);
  }

  public boolean equal(String a, String b) {
    return a != null
        && b != null
        && MessageDigest.isEqual(
            a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
  }

  private String hmac(byte[] key, String raw) {
    try {
      Mac m = Mac.getInstance("HmacSHA256");
      m.init(new SecretKeySpec(key, "HmacSHA256"));
      return HexFormat.of().formatHex(m.doFinal(raw.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException("Digest failed");
    }
  }

  public String encrypt(String raw) {
    try {
      byte[] iv = new byte[12];
      random.nextBytes(iv);
      Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
      c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(mfaKey, "AES"), new GCMParameterSpec(128, iv));
      byte[] encrypted = c.doFinal(raw.getBytes(StandardCharsets.UTF_8));
      byte[] out = new byte[iv.length + encrypted.length];
      System.arraycopy(iv, 0, out, 0, iv.length);
      System.arraycopy(encrypted, 0, out, iv.length, encrypted.length);
      return Base64.getEncoder().encodeToString(out);
    } catch (Exception e) {
      throw new IllegalStateException("Encryption failed");
    }
  }

  public String decrypt(String raw) {
    try {
      byte[] b = Base64.getDecoder().decode(raw);
      Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
      c.init(
          Cipher.DECRYPT_MODE,
          new SecretKeySpec(mfaKey, "AES"),
          new GCMParameterSpec(128, Arrays.copyOf(b, 12)));
      return new String(c.doFinal(Arrays.copyOfRange(b, 12, b.length)), StandardCharsets.UTF_8);
    } catch (Exception e) {
      throw new IllegalStateException("Decryption failed");
    }
  }
}
