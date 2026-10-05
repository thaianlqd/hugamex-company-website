package vn.hugamex.website.media;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PostgresMediaStorage implements MediaStorage {
  private final JdbcTemplate db;

  public PostgresMediaStorage(JdbcTemplate db) {
    this.db = db;
  }

  public void put(UUID id, byte[] data) {
    db.update("UPDATE media_files SET data=? WHERE id=?", data, id);
  }

  public byte[] get(UUID id) {
    return db.queryForObject("SELECT data FROM media_files WHERE id=?", byte[].class, id);
  }
}
