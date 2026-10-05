package vn.hugamex.website.media;

import java.io.*;
import java.util.*;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import vn.hugamex.website.common.ApiException;

@Component
public class MediaValidation {
  public record Validated(byte[] data, String mime, String extension, String original) {}

  public Validated validate(MultipartFile f) {
    String name = Optional.ofNullable(f.getOriginalFilename()).orElse("");
    String mime = Optional.ofNullable(f.getContentType()).orElse("");
    String extension =
        name.contains(".")
            ? name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT)
            : "";
    Map<String, Set<String>> types =
        Map.of(
            "image/jpeg",
            Set.of("jpg", "jpeg"),
            "image/png",
            Set.of("png"),
            "image/webp",
            Set.of("webp"),
            "application/pdf",
            Set.of("pdf"));
    if (!types.containsKey(mime) || !types.get(mime).contains(extension))
      throw new ApiException(
          400, "Allowed files: JPEG, PNG, WebP and PDF, with matching extension and MIME.");
    long max = mime.equals("application/pdf") ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (f.getSize() == 0 || f.getSize() > max)
      throw new ApiException(400, "Image limit is 5 MB; PDF limit is 10 MB.");
    try {
      byte[] b = f.getBytes();
      boolean match =
          switch (mime) {
            case "image/jpeg" ->
                b.length > 4
                    && (b[0] & 255) == 255
                    && (b[1] & 255) == 216
                    && (b[2] & 255) == 255
                    && (b[b.length - 2] & 255) == 255
                    && (b[b.length - 1] & 255) == 217;
            case "image/png" ->
                b.length > 24
                    && Arrays.equals(
                        Arrays.copyOf(b, 8), new byte[] {(byte) 137, 80, 78, 71, 13, 10, 26, 10});
            case "image/webp" ->
                b.length > 16
                    && new String(b, 0, 4, java.nio.charset.StandardCharsets.US_ASCII)
                        .equals("RIFF")
                    && new String(b, 8, 4, java.nio.charset.StandardCharsets.US_ASCII)
                        .equals("WEBP");
            case "application/pdf" ->
                b.length > 8
                    && new String(b, 0, 5, java.nio.charset.StandardCharsets.US_ASCII)
                        .equals("%PDF-");
            default -> false;
          };
      if (!match) throw new ApiException(400, "File signature does not match its declared type.");
      if (mime.equals("image/png") || mime.equals("image/jpeg")) {
        try (var stream =
            javax.imageio.ImageIO.createImageInputStream(new ByteArrayInputStream(b))) {
          var readers = javax.imageio.ImageIO.getImageReaders(stream);
          if (!readers.hasNext()) throw new ApiException(400, "Invalid image.");
          var reader = readers.next();
          try {
            reader.setInput(stream);
            long width = reader.getWidth(0), height = reader.getHeight(0);
            if (width < 1 || height < 1 || width * height > 40000000L)
              throw new ApiException(400, "Image dimensions exceed the allowed limit.");
          } finally {
            reader.dispose();
          }
        }
      }
      String safe = name.replaceAll("[^a-zA-Z0-9._-]", "_");
      if (safe.length() > 200) safe = safe.substring(safe.length() - 200);
      return new Validated(b, mime, extension, safe);
    } catch (IOException e) {
      throw new ApiException(400, "Invalid file.");
    }
  }
}
