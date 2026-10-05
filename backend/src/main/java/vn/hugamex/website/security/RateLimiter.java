package vn.hugamex.website.security;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import vn.hugamex.website.common.ApiException;

@Service
public class RateLimiter {
  private final JdbcTemplate db;
  private final Crypto crypto;

  public RateLimiter(JdbcTemplate db, Crypto crypto) {
    this.db = db;
    this.crypto = crypto;
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = ApiException.class)
  public void check(String action, String identity, int max, int seconds) {
    String key = action + ":" + crypto.tokenHash(identity);
    int count =
        db.queryForObject(
            "INSERT INTO rate_limit_buckets(bucket_key,window_start,requests) VALUES (?,now(),1) ON CONFLICT(bucket_key) DO UPDATE SET requests=CASE WHEN rate_limit_buckets.window_start<now()-(? * interval '1 second') THEN 1 ELSE rate_limit_buckets.requests+1 END,window_start=CASE WHEN rate_limit_buckets.window_start<now()-(? * interval '1 second') THEN now() ELSE rate_limit_buckets.window_start END RETURNING requests",
            Integer.class,
            key,
            seconds,
            seconds);
    if (count > max)
      throw new ApiException(429, "Too many attempts. Please wait before trying again.");
  }
}
