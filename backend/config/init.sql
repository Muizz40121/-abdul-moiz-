CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  location TEXT DEFAULT '',
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  condition TEXT DEFAULT 'used',
  category_id INTEGER REFERENCES categories(id),
  seller_id INTEGER REFERENCES users(id),
  location TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  is_read INTEGER DEFAULT 0,
  related_id INTEGER DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO categories (id, name, slug, icon) VALUES
(1, 'Vehicles', 'vehicles', 'fa-car'),
(2, 'Property', 'property', 'fa-home'),
(3, 'Electronics', 'electronics', 'fa-mobile-alt'),
(4, 'Furniture', 'furniture', 'fa-couch'),
(5, 'Fashion', 'fashion', 'fa-tshirt'),
(6, 'Books & Education', 'books-education', 'fa-book'),
(7, 'Sports & Outdoors', 'sports-outdoors', 'fa-futbol'),
(8, 'Pets', 'pets', 'fa-paw'),
(9, 'Services', 'services', 'fa-concierge-bell'),
(10, 'Jobs', 'jobs', 'fa-briefcase'),
(11, 'Food & Agriculture', 'food-agriculture', 'fa-apple-alt'),
(12, 'Music & Hobbies', 'music-hobbies', 'fa-guitar');
