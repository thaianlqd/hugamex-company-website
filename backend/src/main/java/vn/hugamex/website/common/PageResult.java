package vn.hugamex.website.common;

import java.util.List;

public record PageResult<T>(List<T> items, long total, int page, int size) {
  public static void check(int page, int size) {
    if (page < 0 || page > 10000 || size < 1 || size > 50)
      throw new ApiException(400, "Invalid pagination.");
  }
}
