-- Checkout attribution for payment funnel analysis.

ALTER TABLE orders ADD COLUMN checkout_context TEXT;
ALTER TABLE orders ADD COLUMN checkout_country TEXT;
ALTER TABLE orders ADD COLUMN checkout_source TEXT;
ALTER TABLE orders ADD COLUMN checkout_entry_page TEXT;
ALTER TABLE orders ADD COLUMN checkout_referrer TEXT;
ALTER TABLE orders ADD COLUMN checkout_user_agent TEXT;

CREATE INDEX IF NOT EXISTS orders_checkout_country_idx ON orders (checkout_country, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_checkout_source_idx ON orders (checkout_source, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_checkout_entry_page_idx ON orders (checkout_entry_page, created_at DESC);
