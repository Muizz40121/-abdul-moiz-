const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dbDir, { recursive: true });
const db = new DatabaseSync(path.join(dbDir, 'pakbazaar.db'));
db.exec('PRAGMA foreign_keys = ON');
try { db.exec(fs.readFileSync(path.join(__dirname, '..', 'config', 'init.sql'), 'utf8')); } catch {}

const hash = bcrypt.hashSync('password123', 10);

const users = [
  { name: 'Ali Raza', email: 'ali@test.com', password: hash, phone: '0300-1111111', location: 'Karachi' },
  { name: 'Sana Malik', email: 'sana@test.com', password: hash, phone: '0300-2222222', location: 'Lahore' },
  { name: 'Usman Ghani', email: 'usman@test.com', password: hash, phone: '0300-3333333', location: 'Islamabad' },
];
const userIds = [];
for (const u of users) {
  db.prepare('INSERT OR IGNORE INTO users (name, email, password, phone, location) VALUES (?, ?, ?, ?, ?)').run(u.name, u.email, u.password, u.phone, u.location);
  const r = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
  if (r) userIds.push(r.id);
}

const ads = [
  { title: 'Toyota Corolla 2020 - Excellent Condition', description: 'Well maintained Toyota Corolla 2020 model. Single owner, 45,000 km driven. Regular service at Toyota dealership. Accident free. Price negotiable.', price: 1500000, category_id: 1, seller_id: userIds[0], location: 'Karachi', condition: 'used' },
  { title: 'iPhone 15 Pro Max 256GB - Brand New', description: 'Brand new iPhone 15 Pro Max 256GB. Sealed box. PTA approved. Color: Natural Titanium. Warranty included.', price: 120000, category_id: 3, seller_id: userIds[0], location: 'Lahore', condition: 'new' },
  { title: '3 Bedroom Luxury Apartment for Rent', description: 'Beautiful 3 bedroom apartment in DHA Phase 8. Fully furnished. Modern kitchen, 2 bathrooms, drawing room, servant room. Available immediately.', price: 85000, category_id: 2, seller_id: userIds[1], location: 'Karachi', condition: 'new' },
  { title: 'Sofa Set - Premium Italian Leather', description: 'Premium Italian leather sofa set. 3+2+1 configuration. Dark brown color. Used for only 6 months. In excellent condition.', price: 45000, category_id: 4, seller_id: userIds[1], location: 'Lahore', condition: 'used' },
  { title: 'Dell XPS 15 Laptop - Core i7 12th Gen', description: 'Dell XPS 15 9520. Core i7-12700H, 16GB RAM, 512GB SSD, NVIDIA RTX 3050. 4K OLED display. Under warranty until Dec 2025.', price: 185000, category_id: 3, seller_id: userIds[2], location: 'Islamabad', condition: 'used' },
  { title: 'Mountain Bike - Trek X-Caliber 8', description: 'Trek X-Caliber 8 mountain bike. 29 inch wheels, hydraulic disc brakes, 12-speed drivetrain. Perfect condition. Used only 10 times.', price: 95000, category_id: 7, seller_id: userIds[2], location: 'Islamabad', condition: 'used' },
  { title: 'iPad Pro 12.9 M2 - With Pencil', description: 'iPad Pro 12.9 inch M2 chip. 256GB WiFi + Cellular. Includes Apple Pencil 2nd gen and Magic Keyboard. All original accessories.', price: 155000, category_id: 3, seller_id: userIds[0], location: 'Karachi', condition: 'used' },
  { title: 'Teaching Job - O/A Levels Mathematics', description: 'Well-reputed academy in Gulshan-e-Maymar looking for Mathematics teacher. O/A Levels experience required. Flexible timings. Competitive salary.', price: 0, category_id: 10, seller_id: userIds[1], location: 'Karachi', condition: 'new' },
  { title: 'Samsung 65" QLED 4K Smart TV', description: 'Samsung Q80B 65 inch QLED 4K Smart TV. Bought in 2023. Excellent condition. Includes wall mount and all accessories. Reason for selling: upgrading to 85 inch.', price: 135000, category_id: 3, seller_id: userIds[2], location: 'Lahore', condition: 'used' },
  { title: 'Golden Retriever Puppies - Vaccinated', description: 'Beautiful Golden Retriever puppies ready for adoption. 8 weeks old. Fully vaccinated. Dewormed. Both parents available for viewing. Health guarantee.', price: 25000, category_id: 8, seller_id: userIds[1], location: 'Islamabad', condition: 'new' },
];

const placeholders = [
  'https://placehold.co/600x400/ff6b00/fff?text=Car', 'https://placehold.co/600x400/002f34/fff?text=Phone', 'https://placehold.co/600x400/0d6efd/fff?text=Apartment', 'https://placehold.co/600x400/198754/fff?text=Sofa',
  'https://placehold.co/600x400/6f42c1/fff?text=Laptop', 'https://placehold.co/600x400/dc3545/fff?text=Bike', 'https://placehold.co/600x400/20c997/fff?text=iPad', 'https://placehold.co/600x400/ffc107/000?text=Job',
  'https://placehold.co/600x400/0dcaf0/000?text=TV', 'https://placehold.co/600x400/fd7e14/fff?text=Puppy',
];

const adIds = [];
for (const ad of ads) {
  const r = db.prepare('INSERT INTO products (title, description, price, condition, category_id, seller_id, location, status, views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(ad.title, ad.description, ad.price, ad.condition, ad.category_id, ad.seller_id, ad.location, 'active', Math.floor(Math.random() * 500) + 10);
  adIds.push(Number(r.lastInsertRowid));
}

for (let i = 0; i < adIds.length; i++) {
  db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)').run(adIds[i], placeholders[i]);
  db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)').run(adIds[i], 'https://placehold.co/600x400/dee2e6/002f34?text=Photo+2');
  db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)').run(adIds[i], 'https://placehold.co/600x400/ced4da/002f34?text=Photo+3');
}

if (userIds.length >= 2) {
  const convId = db.prepare('INSERT INTO conversations (product_id, buyer_id, seller_id) VALUES (?, ?, ?)').run(adIds[0], userIds[1], userIds[0]).lastInsertRowid;
  db.prepare('INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)').run(convId, userIds[1], 'Assalam-o-Alaikum! Is the car still available?');
  db.prepare('INSERT INTO messages (conversation_id, sender_id, message, is_read) VALUES (?, ?, ?, 1)').run(convId, userIds[0], 'Walaikum Assalam! Yes, it is still available.');
  db.prepare('INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)').run(convId, userIds[1], 'Great! Can I come see it this weekend?');
}

console.log(`Seeded: ${users.length} users, ${ads.length} products, conversations and messages.`);
db.close();
