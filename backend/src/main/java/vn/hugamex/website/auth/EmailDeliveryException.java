package vn.hugamex.website.auth;

/** Safe delivery failure; never retains provider messages or sensitive mail contents. */
public class EmailDeliveryException extends IllegalStateException {
  public EmailDeliveryException() {
    super("Unable to deliver authentication email via SMTP");
  }
}
