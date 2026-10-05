package vn.hugamex.website.auth;

import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class Totp {
  private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  public String secret() {
    byte[] b = new byte[20];
    new SecureRandom().nextBytes(b);
    StringBuilder out = new StringBuilder();
    int buffer = 0, bits = 0;
    for (byte v : b) {
      buffer = (buffer << 8) | (v & 255);
      bits += 8;
      while (bits >= 5) {
        bits -= 5;
        out.append(ALPHABET.charAt((buffer >> bits) & 31));
      }
    }
    return out.toString();
  }

  private byte[] decode(String s) {
    byte[] result = new byte[s.length() * 5 / 8];
    int buffer = 0, bits = 0, pos = 0;
    for (char c : s.toCharArray()) {
      int v = ALPHABET.indexOf(c);
      if (v < 0) throw new IllegalArgumentException();
      buffer = (buffer << 5) | v;
      bits += 5;
      if (bits >= 8) {
        bits -= 8;
        result[pos++] = (byte) (buffer >> bits);
      }
    }
    return result;
  }

  public String code(String secret, long counter) {
    try {
      var m = Mac.getInstance("HmacSHA1");
      m.init(new SecretKeySpec(decode(secret), "HmacSHA1"));
      byte[] h = m.doFinal(ByteBuffer.allocate(8).putLong(counter).array());
      int o = h[h.length - 1] & 15;
      int n =
          ((h[o] & 127) << 24)
              | ((h[o + 1] & 255) << 16)
              | ((h[o + 2] & 255) << 8)
              | (h[o + 3] & 255);
      return String.format("%06d", n % 1000000);
    } catch (Exception e) {
      throw new IllegalStateException("TOTP failed");
    }
  }

  public long verify(String secret, String code, long current, long last) {
    if (!code.matches("[0-9]{6}")) return -1;
    for (long c = current - 1; c <= current + 1; c++)
      if (c > last
          && java.security.MessageDigest.isEqual(
              code(secret, c).getBytes(java.nio.charset.StandardCharsets.US_ASCII),
              code.getBytes(java.nio.charset.StandardCharsets.US_ASCII))) return c;
    return -1;
  }
}
