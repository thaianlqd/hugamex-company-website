package vn.hugamex.website;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import vn.hugamex.website.auth.*;
import vn.hugamex.website.config.MailConfig;

class MailConfigurationTest {
  private final ApplicationContextRunner context =
      new ApplicationContextRunner()
          .withConfiguration(AutoConfigurations.of(MailSenderAutoConfiguration.class))
          .withUserConfiguration(MailConfig.class, DevEmailService.class, SmtpEmailService.class)
          .withPropertyValues("spring.profiles.active=dev");

  private ApplicationContextRunner smtp() {
    // Reserved example domain; no network is invoked by these configuration tests.
    return context.withPropertyValues(
        "app.mail-mode=smtp",
        "spring.mail.host=smtp.example.invalid",
        "spring.mail.username=sender@example.invalid",
        "spring.mail.password=test-only-placeholder",
        "app.mail-from=sender@example.invalid");
  }

  @Test
  void fileModeSelectsExactlyOneProvider() {
    context
        .withPropertyValues("app.mail-mode=file")
        .run(
            c -> {
              assertThat(c)
                  .hasNotFailed()
                  .hasSingleBean(EmailService.class)
                  .hasBean("devEmailService")
                  .doesNotHaveBean(SmtpEmailService.class);
            });
  }

  @Test
  void defaultDevModeUsesFile() {
    context.run(
        c ->
            assertThat(c)
                .hasNotFailed()
                .hasSingleBean(EmailService.class)
                .doesNotHaveBean(SmtpEmailService.class));
  }

  @ParameterizedTest
  @ValueSource(strings = {"dev", "prod"})
  void smtpWorksWithoutChangingProfileAndRequiresTls(String profile) {
    smtp()
        .withPropertyValues("spring.profiles.active=" + profile)
        .run(
            c -> {
              assertThat(c)
                  .hasNotFailed()
                  .hasSingleBean(EmailService.class)
                  .hasSingleBean(JavaMailSender.class)
                  .doesNotHaveBean(DevEmailService.class);
              var sender = (JavaMailSenderImpl) c.getBean(JavaMailSender.class);
              assertThat(sender.getPort()).isEqualTo(587);
              assertThat(sender.getDefaultEncoding()).isEqualTo("UTF-8");
              assertThat(sender.getJavaMailProperties())
                  .containsEntry("mail.smtp.starttls.required", "true")
                  .containsEntry("mail.smtp.auth", "true")
                  .containsEntry("mail.smtp.ssl.checkserveridentity", "true")
                  .containsEntry("mail.debug", "false");
            });
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "spring.mail.host",
        "spring.mail.username",
        "spring.mail.password",
        "app.mail-from"
      })
  void missingSmtpConfigurationFailsClearly(String property) {
    smtp()
        .withPropertyValues(property + "=")
        .run(
            c -> {
              assertThat(c).hasFailed();
              assertThat(c.getStartupFailure())
                  .hasRootCauseMessage(
                      "MAIL_MODE=smtp requires SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD and MAIL_FROM");
            });
  }

  @Test
  void productionCannotUseFilesEvenWithDevAlsoActive() {
    context
        .withPropertyValues("app.mail-mode=file", "spring.profiles.active=dev,prod")
        .run(
            c -> {
              assertThat(c).hasFailed();
              assertThat(c.getStartupFailure())
                  .hasRootCauseMessage(
                      "MAIL_MODE=file is restricted to dev/test; production requires smtp");
            });
  }

  @Test
  void unknownModeFailsClearly() {
    context
        .withPropertyValues("app.mail-mode=other")
        .run(
            c -> {
              assertThat(c).hasFailed();
              assertThat(c.getStartupFailure())
                  .hasRootCauseMessage("MAIL_MODE must be file or smtp");
            });
  }

  @ParameterizedTest
  @ValueSource(strings = {"EMAIL_VERIFICATION", "PASSWORD_RESET"})
  void bothOtpPurposesSendThroughProviderWithoutSessionData(String purpose) {
    JavaMailSender sender = mock(JavaMailSender.class);
    new SmtpEmailService(sender, "sender@example.invalid")
        .send("recipient@example.invalid", purpose, UUID.randomUUID(), "123456");
    var message = ArgumentCaptor.forClass(SimpleMailMessage.class);
    verify(sender).send(message.capture());
    assertThat(message.getValue().getSubject()).startsWith("HUGAMEX");
    assertThat(message.getValue().getText())
        .contains("123456", "5", "Do not share", "HUGAMEX")
        .doesNotContain("Challenge:", "session", "password=");
  }

  @Test
  void providerErrorCannotExposeMessageOrCredentials() {
    JavaMailSender sender = mock(JavaMailSender.class);
    doThrow(new MailSendException("Simulated sensitive provider details"))
        .when(sender)
        .send(any(SimpleMailMessage.class));
    var error =
        assertThrows(
            IllegalStateException.class,
            () ->
                new SmtpEmailService(sender, "sender@example.invalid")
                    .send(
                        "recipient@example.invalid",
                        "EMAIL_VERIFICATION",
                        UUID.randomUUID(),
                        "123456"));
    assertThat(error).hasMessage("Unable to deliver authentication email via SMTP").hasNoCause();
  }
}
