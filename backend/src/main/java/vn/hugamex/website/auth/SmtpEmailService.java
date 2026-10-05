package vn.hugamex.website.auth;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mail-mode", havingValue = "smtp")
public class SmtpEmailService implements EmailService {
  private final JavaMailSender sender;
  private final String from;

  public SmtpEmailService(JavaMailSender sender, @Value("${app.mail-from}") String from) {
    this.sender = sender;
    this.from = from;
  }

  public void send(String email, String purpose, UUID id, String code) {
    var m = new SimpleMailMessage();
    m.setFrom(from);
    m.setTo(email);
    String action =
        switch (purpose) {
          case "EMAIL_VERIFICATION" -> "Xác thực email";
          case "PASSWORD_RESET" -> "Đặt lại mật khẩu";
          default -> throw new IllegalArgumentException("Unsupported email purpose");
        };
    m.setSubject("HUGAMEX — " + action);
    m.setText(
        "HUGAMEX\n\n"
            + action
            + " / "
            + (purpose.equals("EMAIL_VERIFICATION") ? "Email verification" : "Password reset")
            + "\n\nMã xác thực / Your code: "
            + code
            + "\nMã hết hạn sau 5 phút / Expires in 5 minutes."
            + "\nKhông chia sẻ mã này với bất kỳ ai / Do not share this code."
            + "\nNếu bạn không yêu cầu mã này, hãy bỏ qua thư / If you did not request this, ignore this email.");
    try {
      sender.send(m);
      org.slf4j.LoggerFactory.getLogger(SmtpEmailService.class)
          .info("Authentication email accepted by SMTP transport; purpose={}", purpose);
    } catch (org.springframework.mail.MailException e) {
      org.slf4j.LoggerFactory.getLogger(SmtpEmailService.class)
          .warn(
              e instanceof org.springframework.mail.MailAuthenticationException
                  ? "SMTP authentication failed; check local App Password configuration"
                  : "SMTP delivery failed; no provider details logged");
      // Never propagate provider exceptions: they can contain recipients or message contents.
      throw new EmailDeliveryException();
    }
  }
}
