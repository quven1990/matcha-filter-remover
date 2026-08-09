CREATE TABLE IF NOT EXISTS samples (
  id TEXT PRIMARY KEY NOT NULL,
  mode TEXT NOT NULL,
  media_type TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  bytes BLOB NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS samples_created_at_idx ON samples (created_at DESC);
