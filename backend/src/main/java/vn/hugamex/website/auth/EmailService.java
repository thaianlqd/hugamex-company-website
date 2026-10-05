package vn.hugamex.website.auth;

public interface EmailService {
  void send(String email, String purpose, java.util.UUID challenge, String code);
}
