package vn.hugamex.website.media;

import java.util.UUID;

public interface MediaStorage {
  void put(UUID id, byte[] data);

  byte[] get(UUID id);
}
