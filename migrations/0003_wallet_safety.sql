-- Wallet safety / abuse controls (suspend + safety block counters)
-- AI uploads are still not retained; we only store counters and status.

ALTER TABLE wallets ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE wallets ADD COLUMN safety_block_count INTEGER NOT NULL DEFAULT 0;
