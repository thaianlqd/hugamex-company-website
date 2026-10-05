package vn.hugamex.website;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.Test;
import vn.hugamex.website.common.ApiException;
import vn.hugamex.website.content.*;

class CustomerRecordValidationTest {
  private final ContentValidation validator = new ContentValidation();

  private void check(Map<String, String> metadata) throws Exception {
    var document = new ObjectMapper().readTree("{\"type\":\"doc\",\"content\":[]}");
    validator.check(
        new ContentRequests.Save(
            "vi", "Customers", "customers", "", document, "", "", null, false, metadata, List.of()),
        "PARTNER");
  }

  @Test
  void historicalCompositionRequiresDateAndTotal() throws Exception {
    check(
        Map.of(
            "referenceYear",
            "2022",
            "customerNames",
            "Columbia|Toray Group|L.L.Bean",
            "composition",
            "Columbia:40|Sumitex:36|Other:24"));
    check(Map.of());
    assertThrows(ApiException.class, () -> check(Map.of("composition", "Columbia:100")));
    assertThrows(
        ApiException.class,
        () -> check(Map.of("referenceYear", "2022", "composition", "Columbia:40|Other:24")));
    assertThrows(
        ApiException.class,
        () -> check(Map.of("referenceYear", "2022", "composition", "Columbia:50|Columbia:50")));
    assertThrows(
        ApiException.class,
        () -> check(Map.of("referenceYear", "2022", "composition", "Other:NaN")));
    assertThrows(ApiException.class, () -> check(Map.of("referenceYear", "today")));
    assertThrows(ApiException.class, () -> check(Map.of("customerNames", "Columbia||Toray")));
  }
}
