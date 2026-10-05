package vn.hugamex.website.contact;

import jakarta.mail.internet.InternetAddress;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.*;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class ContactNotificationService {
  private final JdbcTemplate db;
  private final TransactionTemplate transactions;
  private final ObjectProvider<JavaMailSender> sender;
  private final String recipient, from, mode;
  private final boolean enabled;

  public ContactNotificationService(
      JdbcTemplate db,
      PlatformTransactionManager manager,
      ObjectProvider<JavaMailSender> sender,
      @Value("${app.contact-notifications-enabled:false}") boolean enabled,
      @Value("${app.contact-notification-email:}") String recipient,
      @Value("${app.mail-from:}") String from,
      @Value("${app.mail-mode:file}") String mode) {
    this.db = db;
    this.transactions = new TransactionTemplate(manager);
    this.sender = sender;
    this.enabled = enabled;
    this.recipient = recipient;
    this.from = from;
    this.mode = mode;
    if (enabled) {
      try {
        new InternetAddress(recipient, true).validate();
      } catch (Exception e) {
        throw new IllegalStateException("CONTACT_NOTIFICATION_EMAIL must be a valid email address");
      }
    }
  }

  public boolean enabled() {
    return enabled;
  }

  public void processPending() {
    if (!enabled) return;
    var ids =
        db.queryForList(
            "SELECT id FROM contact_messages WHERE notification_status IN ('PENDING','RETRY') AND notification_next_at<=now() ORDER BY created_at,id LIMIT 5",
            UUID.class);
    for (UUID id : ids) deliver(id);
  }

  public void deliver(UUID id) {
    if (!enabled) return;
    transactions.executeWithoutResult(
        tx -> {
          var rows =
              db.queryForList(
                  "SELECT * FROM contact_messages WHERE id=? AND notification_status IN ('PENDING','RETRY') AND notification_next_at<=now() FOR UPDATE SKIP LOCKED",
                  id);
          if (rows.isEmpty()) return;
          var c = rows.getFirst();
          int attempts = ((Number) c.get("notification_attempts")).intValue() + 1;
          String body =
              "HUGAMEX — Liên hệ mới / New enquiry\n\n"
                  + "Mã / Reference: "
                  + id
                  + "\n"
                  + "Họ và tên / Name: "
                  + c.get("full_name")
                  + "\n"
                  + "Công ty / Company: "
                  + c.get("company")
                  + "\n"
                  + "Email: "
                  + c.get("email")
                  + "\n"
                  + "Điện thoại / Phone: "
                  + c.get("phone")
                  + "\n"
                  + "Chủ đề / Subject: "
                  + c.get("subject")
                  + "\n\n"
                  + c.get("message")
                  + "\n\nTin nhắn đã được lưu trong CMS / This message is saved in the CMS inbox.\n";
          try {
            if (mode.equals("smtp")) {
              var message = new SimpleMailMessage();
              message.setFrom(from);
              message.setTo(recipient);
              message.setReplyTo(new InternetAddress(c.get("email").toString(), true).getAddress());
              message.setSubject("HUGAMEX — Liên hệ mới / New enquiry [" + id + "]");
              message.setText(body);
              sender.getObject().send(message);
            } else {
              Path dir = Path.of(".dev-mail");
              Files.createDirectories(dir);
              Files.setPosixFilePermissions(dir, PosixFilePermissions.fromString("rwx------"));
              Path file = dir.resolve("contact-" + id + ".txt");
              Files.writeString(
                  file,
                  "To: " + recipient + "\nReply-To: " + c.get("email") + "\n\n" + body,
                  StandardOpenOption.CREATE,
                  StandardOpenOption.TRUNCATE_EXISTING);
              Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("rw-------"));
            }
            db.update(
                "UPDATE contact_messages SET notification_status='SENT',notification_attempts=?,notified_at=now() WHERE id=?",
                attempts,
                id);
          } catch (Exception e) {
            db.update(
                "UPDATE contact_messages SET notification_status=?,notification_attempts=?,notification_next_at=now()+(? * interval '1 second') WHERE id=?",
                attempts >= 5 ? "FAILED" : "RETRY",
                attempts,
                Math.min(3600, 30 * (1 << attempts)),
                id);
            org.slf4j.LoggerFactory.getLogger(ContactNotificationService.class)
                .warn(
                    "Contact notification delivery failed; queued for retry or marked failed; no provider details logged");
          }
        });
  }
}
