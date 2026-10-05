package vn.hugamex.website.config;

import java.time.Clock;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.*;

@Configuration
public class AppConfig {
  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
  }

  @org.springframework.context.annotation.Bean
  @org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)
  org.springframework.boot.ApplicationRunner loggingGuard(
      org.springframework.core.env.Environment env) {
    return args -> {
      if (env.matchesProfiles("prod")
          && (env.getProperty("debug", Boolean.class, false)
              || !env.getProperty("app.secure-cookies", Boolean.class, false)))
        throw new IllegalStateException("Production requires debug disabled and secure cookies.");
      var logging = org.springframework.boot.logging.LoggingSystem.get(getClass().getClassLoader());
      for (String logger :
          java.util.List.of(
              "org.springframework.web",
              "org.springframework.security",
              "org.springframework.jdbc"))
        logging.setLogLevel(logger, org.springframework.boot.logging.LogLevel.INFO);
    };
  }
}
