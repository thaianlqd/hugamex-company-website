package vn.hugamex.website.user;

import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {
  @Mapping(target = "id", source = "entity.id")
  @Mapping(target = "email", source = "entity.email")
  @Mapping(target = "name", source = "entity.name")
  @Mapping(target = "verified", source = "entity.verified")
  @Mapping(target = "roles", source = "roles")
  @Mapping(target = "mfaEnabled", source = "mfaEnabled")
  @Mapping(target = "mfaVerified", source = "mfaVerified")
  UserDto map(
      UserEntity entity, java.util.Set<String> roles, boolean mfaEnabled, boolean mfaVerified);
}
