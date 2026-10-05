package vn.hugamex.website.config;

import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import java.util.Properties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(MailProperties.class)
public class MailConfig {
  public MailConfig(Environment env) {
    String mode = env.getProperty("app.mail-mode", "file");
    if (!mode.equals("file") && !mode.equals("smtp"))
      throw new IllegalStateException("MAIL_MODE must be file or smtp");
    if (mode.equals("file") && (!env.matchesProfiles("dev", "test") || env.matchesProfiles("prod")))
      throw new IllegalStateException(
          "MAIL_MODE=file is restricted to dev/test; production requires smtp");
    if (mode.equals("smtp")) {
      for (String property :
          new String[] {
            "spring.mail.host", "spring.mail.username", "spring.mail.password", "app.mail-from"
          })
        if (env.getProperty(property, "").isBlank())
          throw new IllegalStateException(
              "MAIL_MODE=smtp requires SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD and MAIL_FROM");
      Integer port;
      try {
        port = env.getProperty("spring.mail.port", Integer.class, 587);
      } catch (RuntimeException e) {
        throw new IllegalStateException("SMTP_PORT must be a valid port");
      }
      if (port < 1 || port > 65535)
        throw new IllegalStateException("SMTP_PORT must be a valid port");
      try {
        InternetAddress from = new InternetAddress(env.getProperty("app.mail-from"), true);
        from.validate();
      } catch (AddressException e) {
        throw new IllegalStateException("MAIL_FROM must be a valid email address");
      }
    }
  }

  @Bean
  @ConditionalOnProperty(name = "app.mail-mode", havingValue = "smtp")
  JavaMailSender smtpSender(MailProperties mail) {
    var sender = new JavaMailSenderImpl();
    sender.setHost(mail.getHost());
    sender.setPort(mail.getPort() == null ? 587 : mail.getPort());
    sender.setUsername(mail.getUsername());
    sender.setPassword(mail.getPassword());
    sender.setDefaultEncoding("UTF-8");
    var properties = new Properties();
    properties.setProperty("mail.smtp.auth", "true");
    properties.setProperty("mail.smtp.starttls.enable", "true");
    properties.setProperty("mail.smtp.starttls.required", "true");
    properties.setProperty("mail.smtp.ssl.checkserveridentity", "true");
    properties.setProperty("mail.smtp.connectiontimeout", "5000");
    properties.setProperty("mail.smtp.timeout", "10000");
    properties.setProperty("mail.smtp.writetimeout", "10000");
    properties.setProperty("mail.debug", "false");
    sender.setJavaMailProperties(properties);
    return sender;
  }
}
