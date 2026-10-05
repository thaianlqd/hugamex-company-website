package vn.hugamex.website.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.time.*;
import java.util.*;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final JwtEncoder encoder;
  private final JwtDecoder decoder;
  private final Clock clock;

  public JwtService(@Value("${app.jwt-key}") String key, Clock clock) {
    byte[] k = Crypto.key(key);
    this.clock = clock;
    encoder = new NimbusJwtEncoder(new ImmutableSecret<>(k));
    var d =
        NimbusJwtDecoder.withSecretKey(new SecretKeySpec(k, "HmacSHA256"))
            .macAlgorithm(MacAlgorithm.HS256)
            .build();
    d.setJwtValidator(JwtValidators.createDefaultWithIssuer("hugamex"));
    decoder = d;
  }

  public String issue(UUID user, UUID session) {
    var claims =
        JwtClaimsSet.builder()
            .issuer("hugamex")
            .subject(user.toString())
            .audience(List.of("hugamex-api"))
            .issuedAt(clock.instant())
            .expiresAt(clock.instant().plusSeconds(600))
            .claim("sid", session.toString())
            .build();
    return encoder
        .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
        .getTokenValue();
  }

  public Jwt decode(String raw) {
    Jwt jwt = decoder.decode(raw);
    if (!jwt.getAudience().contains("hugamex-api")) throw new JwtException("Invalid audience");
    return jwt;
  }
}
