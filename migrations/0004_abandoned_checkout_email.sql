-- One-time checkout reminder email support.

ALTER TABLE orders ADD COLUMN creem_checkout_url TEXT;
ALTER TABLE orders ADD COLUMN abandoned_email_sent_at TEXT;
ALTER TABLE orders ADD COLUMN abandoned_email_error TEXT;

CREATE INDEX IF NOT EXISTS orders_abandoned_email_idx
  ON orders (status, abandoned_email_sent_at, created_at);

CREATE TABLE IF NOT EXISTS email_suppression (
  email TEXT PRIMARY KEY NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
