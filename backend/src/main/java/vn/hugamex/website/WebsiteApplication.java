package vn.hugamex.website;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    exclude =
        org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration
            .class)
@io.swagger.v3.oas.annotations.OpenAPIDefinition(
    info =
        @io.swagger.v3.oas.annotations.info.Info(
            title = "HUGAMEX API",
            version = "v1",
            description =
                "Backend-only corporate content, authentication and RBAC CMS. Cookie auth transitions require X-CSRF-TOKEN; admin operations use Bearer access tokens and role/MFA checks."))
@io.swagger.v3.oas.annotations.security.SecurityScheme(
    name = "bearerAuth",
    type = io.swagger.v3.oas.annotations.enums.SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT")
public class WebsiteApplication {
  public static void main(String[] args) {
    SpringApplication.run(WebsiteApplication.class, args);
  }
}
