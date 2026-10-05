package vn.hugamex.website.auth;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Profile("prod")
public class SmtpEmailService implements EmailService {
  private final JavaMailSender sender;
  private final String from;

  public SmtpEmailService(JavaMailSender sender, @Value("${app.mail-from}") String from) {
    if (from.isBlank()) throw new IllegalStateException("MAIL_FROM required");
    this.sender = sender;
    this.from = from;
  }

  public void send(String email, String purpose, UUID id, String code) {
    var m = new SimpleMailMessage();
    m.setFrom(from);
    m.setTo(email);
    m.setSubject("HUGAMEX " + purpose);
    m.setText("Challenge: " + id + "\nYour code: " + code + "\nExpires in five minutes.");
    sender.send(m);
  }
}
