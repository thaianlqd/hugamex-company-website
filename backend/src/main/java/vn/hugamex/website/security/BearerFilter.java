package vn.hugamex.website.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class BearerFilter extends OncePerRequestFilter {
  private final JwtService jwt;
  private final JdbcTemplate db;

  public BearerFilter(JwtService jwt, JdbcTemplate db) {
    this.jwt = jwt;
    this.db = db;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String header = req.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      try {
        var token = jwt.decode(header.substring(7));
        UUID uid = UUID.fromString(token.getSubject());
        UUID sid = UUID.fromString(token.getClaimAsString("sid"));
        var rows =
            db.query(
                "SELECT s.mfa_verified,s.authenticated_at,EXISTS(SELECT 1 FROM mfa_totp m WHERE m.user_id=u.id AND m.enabled=true) FROM refresh_sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.user_id=? AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='ACTIVE' AND u.verified=true",
                (rs, n) ->
                    new Object[] {
                      rs.getBoolean(1), rs.getTimestamp(2).toInstant(), rs.getBoolean(3)
                    },
                sid,
                uid);
        if (rows.size() != 1) throw new IllegalArgumentException();
        Set<String> roles =
            new HashSet<>(
                db.queryForList(
                    "SELECT role_name FROM user_roles WHERE user_id=?", String.class, uid));
        Actor a =
            new Actor(
                uid,
                sid,
                roles,
                (boolean) rows.getFirst()[0],
                (java.time.Instant) rows.getFirst()[1],
                (boolean) rows.getFirst()[2]);
        SecurityContextHolder.getContext()
            .setAuthentication(
                new UsernamePasswordAuthenticationToken(
                    a,
                    null,
                    roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList()));
      } catch (org.springframework.dao.DataAccessException e) {
        res.setStatus(503);
        res.setContentType("application/problem+json");
        res.getWriter().write("{\"status\":503,\"detail\":\"Service temporarily unavailable.\"}");
        return;
      } catch (Exception e) {
        res.setStatus(401);
        res.setContentType("application/problem+json");
        res.getWriter()
            .write("{\"status\":401,\"detail\":\"Session expired. Please sign in again.\"}");
        return;
      }
    }
    chain.doFilter(req, res);
  }
}
