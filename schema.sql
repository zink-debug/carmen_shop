CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  room       TEXT    NOT NULL,
  notes      TEXT,
  item       TEXT    NOT NULL,
  category   TEXT    NOT NULL,
  size       TEXT    NOT NULL,
  temp       TEXT,
  milk       TEXT    NOT NULL DEFAULT '',
  syrups     TEXT    NOT NULL DEFAULT '[]',
  extras     TEXT    NOT NULL DEFAULT '[]',
  payment    TEXT    NOT NULL,
  delivery   TEXT    NOT NULL,
  total      REAL    NOT NULL DEFAULT 0,
  status     TEXT    NOT NULL DEFAULT 'pending',
  created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON orders(created_at);
