package vn.hugamex.website.security;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.*;
import org.springframework.web.cors.*;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  @Bean
  FilterRegistrationBean<BearerFilter> disableDoubleFilter(BearerFilter f) {
    var b = new FilterRegistrationBean<>(f);
    b.setEnabled(false);
    return b;
  }

  @Bean
  @Order(2)
  SecurityFilterChain api(
      HttpSecurity h, BearerFilter bearer, @Value("${app.secure-cookies}") boolean secure)
      throws Exception {
    var csrf = new CookieCsrfTokenRepository();
    csrf.setCookiePath("/api/v1");
    csrf.setHeaderName("X-CSRF-TOKEN");
    csrf.setCookieCustomizer(b -> b.secure(secure).sameSite("Lax").httpOnly(true));
    h.securityMatcher("/api/**")
        .cors(c -> {})
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .csrf(
            c ->
                c.csrfTokenRepository(csrf)
                    .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                    .ignoringRequestMatchers(
                        "/api/v1/admin/**", "/api/v1/auth/mfa/**", "/api/v1/account/**"))
        .authorizeHttpRequests(
            a ->
                a.requestMatchers(
                        "/api/v1/public/**",
                        "/api/v1/media/**",
                        "/api/v1/contact",
                        "/api/v1/auth/csrf",
                        "/api/v1/auth/config",
                        "/api/v1/auth/register",
                        "/api/v1/auth/login",
                        "/api/v1/auth/refresh",
                        "/api/v1/auth/logout",
                        "/api/v1/auth/verify-email",
                        "/api/v1/auth/resend-verification",
                        "/api/v1/auth/forgot-password",
                        "/api/v1/auth/verify-reset-otp",
                        "/api/v1/auth/reset-password")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .addFilterBefore(bearer, UsernamePasswordAuthenticationFilter.class)
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint((q, r, x) -> problem(r, 401, "Sign in required."))
                    .accessDeniedHandler(
                        (q, r, x) -> problem(r, 403, "Access denied or invalid CSRF token.")));
    headers(h);
    return h.build();
  }

  @Bean
  @Order(3)
  SecurityFilterChain rest(HttpSecurity h, org.springframework.core.env.Environment env)
      throws Exception {
    h.authorizeHttpRequests(
        a -> {
          if (env.matchesProfiles("dev", "test"))
            a.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
          a.anyRequest().denyAll();
        });
    headers(h);
    if (env.matchesProfiles("dev", "test"))
      h.headers(
          x ->
              x.contentSecurityPolicy(
                  c ->
                      c.policyDirectives(
                          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")));
    return h.build();
  }

  public static void headers(HttpSecurity h) throws Exception {
    h.headers(
        x ->
            x.contentSecurityPolicy(
                    c ->
                        c.policyDirectives(
                            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
                .referrerPolicy(
                    r ->
                        r.policy(
                            org.springframework.security.web.header.writers
                                .ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                .permissionsPolicy(p -> p.policy("camera=(), microphone=(), geolocation=()")));
  }

  static void problem(jakarta.servlet.http.HttpServletResponse r, int status, String detail)
      throws java.io.IOException {
    r.setStatus(status);
    r.setContentType("application/problem+json");
    r.getWriter().write("{\"status\":" + status + ",\"detail\":\"" + detail + "\"}");
  }

  @Bean
  CorsConfigurationSource cors(@Value("${app.origins}") String origins) {
    var c = new CorsConfiguration();
    List<String> list = Arrays.stream(origins.split(",")).map(String::trim).toList();
    if (list.contains("*") || list.isEmpty())
      throw new IllegalStateException("Explicit CORS origins required");
    c.setAllowedOrigins(list);
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    c.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-CSRF-TOKEN"));
    c.setAllowCredentials(true);
    var s = new UrlBasedCorsConfigurationSource();
    s.registerCorsConfiguration("/**", c);
    return s;
  }
}
