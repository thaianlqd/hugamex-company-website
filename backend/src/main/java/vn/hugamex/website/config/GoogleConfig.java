package vn.hugamex.website.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.security.oauth2.client.web.*;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.SecurityFilterChain;
import vn.hugamex.website.auth.*;

@Configuration
@ConditionalOnExpression("!'${GOOGLE_CLIENT_ID:}'.isEmpty()")
public class GoogleConfig {
  @Bean
  ClientRegistrationRepository clients(
      @Value("${GOOGLE_CLIENT_ID}") String id,
      @Value("${GOOGLE_CLIENT_SECRET}") String secret,
      @Value("${GOOGLE_REDIRECT_URI}") String redirect) {
    return new InMemoryClientRegistrationRepository(
        org.springframework.security.config.oauth2.client.CommonOAuth2Provider.GOOGLE
            .getBuilder("google")
            .clientId(id)
            .clientSecret(secret)
            .redirectUri(redirect)
            .scope("openid", "email", "profile")
            .build());
  }

  @Bean
  @Order(1)
  SecurityFilterChain oauth(
      HttpSecurity h,
      ClientRegistrationRepository clients,
      GoogleService google,
      AuthController cookies,
      @Value("${app.frontend-url}") String frontend)
      throws Exception {
    var resolver = new DefaultOAuth2AuthorizationRequestResolver(clients, "/oauth2/authorization");
    resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
    h.securityMatcher("/oauth2/**", "/login/oauth2/**")
        .authorizeHttpRequests(a -> a.anyRequest().permitAll())
        .oauth2Login(
            o ->
                o.authorizationEndpoint(e -> e.authorizationRequestResolver(resolver))
                    .successHandler(
                        (q, r, a) -> {
                          try {
                            var s = google.login((OidcUser) a.getPrincipal());
                            cookies.cookie(r, s.refreshToken(), 604800);
                            q.getSession().invalidate();
                            org.springframework.security.core.context.SecurityContextHolder
                                .clearContext();
                            r.sendRedirect(frontend + "/tai-khoan");
                          } catch (vn.hugamex.website.common.ApiException ex) {
                            q.getSession().invalidate();
                            r.sendRedirect(frontend + "/dang-nhap?oauth=account-conflict");
                          }
                        })
                    .failureHandler(
                        (q, r, e) -> {
                          if (q.getSession(false) != null) q.getSession(false).invalidate();
                          r.sendRedirect(frontend + "/dang-nhap?oauth=failed");
                        }));
    vn.hugamex.website.security.SecurityConfig.headers(h);
    return h.build();
  }
}
