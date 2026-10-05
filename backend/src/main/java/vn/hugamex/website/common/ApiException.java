package vn.hugamex.website.common;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
  public final HttpStatus status;

  public ApiException(int status, String message) {
    super(message);
    this.status = HttpStatus.valueOf(status);
  }
}
