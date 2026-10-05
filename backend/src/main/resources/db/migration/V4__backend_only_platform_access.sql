-- Business tables are accessed by Spring only. No anonymous platform API policies.
-- Scope is limited to this application's tables; unrelated Supabase tables are untouched.
DO $$
DECLARE table_name text; platform_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users','roles','user_roles','auth_identities','refresh_sessions',
    'email_otp_challenges','mfa_totp','mfa_recovery_codes','media_files',
    'content_items','content_translations','post_categories','homepage_sections',
    'contact_messages','site_settings','audit_logs','rate_limit_buckets'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    FOREACH platform_role IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=platform_role) THEN
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %I', table_name, platform_role);
      END IF;
    END LOOP;
  END LOOP;
END $$;
