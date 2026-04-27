DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS store_config;

-- Holds the admin password and the live menu data
CREATE TABLE store_config (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

-- Holds the submitted orders
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  room TEXT NOT NULL,
  notes TEXT,
  category TEXT NOT NULL,
  drink TEXT NOT NULL,
  options TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON orders(created_at);

-- Default admin password is 'admin'. Change this from the admin panel later!
INSERT INTO store_config (id, data) VALUES ('admin_pass', 'Ilovepanguins');

-- Default starting menu
INSERT INTO store_config (id, data) VALUES ('menu', '{"categories":[{"id":"cat_1","name":"Coffee","drinks":[{"id":"d_1","name":"House Roast","price":1.5}],"optionGroups":[{"id":"og_1","name":"Cup Size","type":"radio","choices":[{"id":"c_1","name":"12 oz","price":0},{"id":"c_2","name":"16 oz","price":1}]},{"id":"og_2","name":"Syrups","type":"checkbox","choices":[{"id":"c_3","name":"Vanilla","price":0.5}]}]}]}');
