package vn.hugamex.website.common;

import com.fasterxml.jackson.databind.*;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class Json {
  private final ObjectMapper mapper;

  public Json(ObjectMapper mapper) {
    this.mapper = mapper;
  }

  public String write(Object o) {
    try {
      return mapper.writeValueAsString(o);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid JSON");
    }
  }

  public JsonNode read(String s) {
    try {
      return mapper.readTree(s);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid JSON");
    }
  }

  public Map<String, String> strings(String s) {
    return mapper.convertValue(
        read(s), new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {});
  }
}
