-- schema.sql
-- Run: wrangler d1 execute coffee-cart-db --file=schema.sql

CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  item       TEXT    NOT NULL,
  category   TEXT    NOT NULL DEFAULT '',
  size       TEXT    NOT NULL,
  milk       TEXT    NOT NULL DEFAULT '',
  syrups     TEXT    NOT NULL DEFAULT '[]',   -- JSON array e.g. ["Vanilla","Caramel"]
  extras     TEXT    NOT NULL DEFAULT '[]',   -- JSON array e.g. ["Chia Seeds"]
  total      REAL    NOT NULL DEFAULT 0,
  status     TEXT    NOT NULL DEFAULT 'pending',  -- pending | ready | done
  created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON orders(created_at);
