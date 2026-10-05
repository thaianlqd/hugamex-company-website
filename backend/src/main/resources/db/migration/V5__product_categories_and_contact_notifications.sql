-- Product categories are separate from editorial categories; public access remains Spring-only.
ALTER TABLE content_items DROP CONSTRAINT content_items_kind_check;
ALTER TABLE content_items ADD CONSTRAINT content_items_kind_check CHECK(kind IN ('POST','PAGE','BRANCH','PRODUCT','PARTNER','CERTIFICATION','CATEGORY','PRODUCT_CATEGORY','HERO'));
CREATE TABLE product_categories (
  product_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES content_items(id),
  PRIMARY KEY(product_id, category_id)
);
CREATE INDEX product_categories_category_idx ON product_categories(category_id,product_id);
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE platform_role text; BEGIN
  FOREACH platform_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=platform_role) THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.product_categories FROM %I', platform_role);
    END IF;
  END LOOP;
END $$;

-- Queue state stays alongside the durable admin inbox entry. Existing entries are not mailed.
ALTER TABLE contact_messages ADD COLUMN notification_status varchar(12) NOT NULL DEFAULT 'DISABLED' CHECK(notification_status IN ('DISABLED','PENDING','RETRY','SENT','FAILED'));
ALTER TABLE contact_messages ADD COLUMN notification_attempts integer NOT NULL DEFAULT 0 CHECK(notification_attempts>=0);
ALTER TABLE contact_messages ADD COLUMN notification_next_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE contact_messages ADD COLUMN notified_at timestamptz;
CREATE INDEX contact_notification_queue_idx ON contact_messages(notification_next_at) WHERE notification_status IN ('PENDING','RETRY');
