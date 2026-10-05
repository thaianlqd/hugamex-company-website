package vn.hugamex.website.user;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;

@Entity
@Table(name = "users")
@Getter
public class UserEntity {
  @Id private UUID id;

  @Column(nullable = false, unique = true, length = 254)
  private String email;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(name = "password_hash")
  private String passwordHash;

  @Column(nullable = false)
  private boolean verified;

  @Column(nullable = false, length = 12)
  private String status;

  protected UserEntity() {}
}
