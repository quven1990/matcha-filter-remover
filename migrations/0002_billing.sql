-- Creem credits / wallet ledger (no Google login required)

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  email TEXT,
  creem_customer_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS wallets_email_idx ON wallets (email);
CREATE INDEX IF NOT EXISTS wallets_creem_customer_idx ON wallets (creem_customer_id);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY NOT NULL,
  wallet_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  meta TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (ref_id)
);

CREATE INDEX IF NOT EXISTS credit_ledger_wallet_idx ON credit_ledger (wallet_id, created_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY NOT NULL,
  wallet_id TEXT NOT NULL,
  pack TEXT NOT NULL,
  credits INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL,
  creem_checkout_id TEXT,
  creem_order_id TEXT,
  email TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_wallet_idx ON orders (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_checkout_idx ON orders (creem_checkout_id);
