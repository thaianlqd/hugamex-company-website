import java.sql.*;
import java.util.*;

/** Local read-only verification tool; never logs credentials or provider exception messages. */
class SupabaseCheck {
  private static final List<String> TABLES = List.of(
      "users", "roles", "user_roles", "auth_identities", "refresh_sessions",
      "email_otp_challenges", "mfa_totp", "mfa_recovery_codes", "media_files",
      "content_items", "content_translations", "post_categories", "homepage_sections",
      "contact_messages", "site_settings", "audit_logs", "rate_limit_buckets");
  private static long count(Connection c, String sql) throws SQLException {
    try (var statement = c.createStatement(); var result = statement.executeQuery(sql)) {
      result.next();
      return result.getLong(1);
    }
  }
  private static boolean exists(Connection c, String table) throws SQLException {
    try (var statement = c.prepareStatement("SELECT to_regclass(?) IS NOT NULL")) {
      statement.setString(1, "public." + table);
      try (var result = statement.executeQuery()) { result.next(); return result.getBoolean(1); }
    }
  }
  private static void require(boolean ok, String message) {
    if (!ok) throw new IllegalStateException(message);
  }
  public static void main(String[] args) {
    try {
      String mode = args.length == 0 ? "preflight" : args[0];
      require(Set.of("preflight", "postflight").contains(mode), "Use preflight or postflight");
      String url = System.getenv("DATABASE_URL");
      require("jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require".equals(url),
          "Expected the configured Supabase session pooler URL with sslmode=require");
      var properties = new Properties();
      for (String name : List.of("DATABASE_USERNAME", "DATABASE_PASSWORD")) {
        String value = System.getenv(name);
        require(value != null && !value.isBlank(), "Configure " + name + " directly in backend/.env");
        properties.setProperty(name.equals("DATABASE_USERNAME") ? "user" : "password", value);
      }
      properties.setProperty("connectTimeout", "10");
      properties.setProperty("socketTimeout", "10");
      properties.setProperty("loggerLevel", "OFF");
      try (Connection c = DriverManager.getConnection(url, properties)) {
        c.setReadOnly(true);
        c.setAutoCommit(false);
        System.out.println("Supabase session-pooler JDBC connection: passed (TLS required)");
        try (var statement = c.createStatement();
             var result = statement.executeQuery("SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()")) {
          System.out.println("PostgreSQL backend connection SSL: " + (result.next() ? result.getBoolean(1) : "unavailable"));
        }
        int present = 0;
        for (String table : TABLES) if (exists(c, table)) present++;
        System.out.println("Core application tables present: " + present + "/" + TABLES.size());
        boolean history = exists(c, "flyway_schema_history");
        require(present == 0 || history, "Application-name tables already exist without Flyway history; stop and review collisions");
        long migrations = 0;
        if (history) {
          require(count(c, "SELECT count(*) FROM public.flyway_schema_history WHERE NOT success") == 0,
              "Failed Flyway migration detected; review before startup");
          require(count(c, "SELECT count(*) FROM public.flyway_schema_history WHERE script NOT IN "
              + "('V1__initial_schema.sql','V2__seed_roles.sql','V3__corporate_route_identity.sql','V4__backend_only_platform_access.sql')") == 0,
              "Flyway history is not exclusive to this application; stop and review");
          migrations = count(c, "SELECT count(*) FROM public.flyway_schema_history WHERE success");
          System.out.println("Successful Flyway migrations: " + migrations);
        }
        if (mode.equals("postflight")) {
          require(present == TABLES.size() && migrations == 4, "Expected 17 core tables and four successful migrations");
          require(count(c, "SELECT count(*) FROM information_schema.columns WHERE table_schema='public' "
              + "AND table_name='media_files' AND column_name='data' AND data_type='bytea'") == 1,
              "Media data must use BYTEA");
          for (String table : TABLES)
            require(count(c, "SELECT count(*) FROM pg_class WHERE oid='public." + table + "'::regclass AND relrowsecurity") == 1,
                "Expected RLS on core application tables");
          long owners = count(c, "SELECT count(*) FROM public.users u JOIN public.user_roles r ON r.user_id=u.id "
              + "WHERE r.role_name='SUPER_ADMIN' AND u.status='ACTIVE'");
          System.out.println("Core RLS / media BYTEA: passed");
          System.out.println("Active SUPER_ADMIN count: " + owners);
        }
        c.rollback();
        System.out.println("Read-only " + mode + ": passed; no application data written");
      }
    } catch (SQLException e) {
      System.err.println("Database check failed; SQLState=" + e.getSQLState() + ". No provider details logged.");
      System.exit(1);
    } catch (IllegalStateException e) {
      System.err.println(e.getMessage());
      System.exit(1);
    }
  }
}
