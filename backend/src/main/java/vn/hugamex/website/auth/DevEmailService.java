package vn.hugamex.website.auth;

import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile({"dev", "test"})
@ConditionalOnProperty(name = "app.mail-mode", havingValue = "file", matchIfMissing = true)
public class DevEmailService implements EmailService {
  public void send(String email, String purpose, UUID id, String code) {
    try {
      Path dir = Path.of(".dev-mail");
      Files.createDirectories(dir);
      Files.setPosixFilePermissions(dir, PosixFilePermissions.fromString("rwx------"));
      Path file = dir.resolve(id + ".txt");
      Files.writeString(
          file,
          "To: "
              + email
              + "\nPurpose: "
              + purpose
              + "\nChallenge: "
              + id
              + "\nOTP: "
              + code
              + "\nExpires in 5 minutes.\n",
          StandardOpenOption.CREATE_NEW);
      Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("rw-------"));
    } catch (Exception e) {
      throw new IllegalStateException("Unable to deliver development email");
    }
  }
}
