package vn.hugamex.website.config;

import java.util.Set;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.*;

@Configuration
@Profile({"dev", "test"})
public class OpenApiConfig {
  @Bean
  OperationCustomizer csrfDocumentation() {
    Set<String> auth =
        Set.of(
            "register",
            "resend",
            "forgot",
            "verify",
            "verifyReset",
            "reset",
            "login",
            "refresh",
            "logout");
    return (operation, handler) -> {
      boolean protectedCookie =
          handler.getBeanType().getSimpleName().equals("AuthController")
              && auth.contains(handler.getMethod().getName());
      boolean publicContact =
          handler.getBeanType().getSimpleName().equals("ContactController")
              && handler.getMethod().getName().equals("create");
      if (protectedCookie || publicContact)
        operation.addParametersItem(
            new io.swagger.v3.oas.models.parameters.HeaderParameter()
                .name("X-CSRF-TOKEN")
                .required(true)
                .description(
                    "GET /api/v1/auth/csrf first; retain its cookie and send the returned token here.")
                .schema(new io.swagger.v3.oas.models.media.StringSchema()));
      return operation;
    };
  }
}
