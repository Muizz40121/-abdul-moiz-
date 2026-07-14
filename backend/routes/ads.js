const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  const { category, search, location, condition, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;
  let sql = "SELECT p.*, c.name as category_name, c.slug as category_slug, u.name as seller_name, u.avatar as seller_avatar FROM products p JOIN categories c ON p.category_id = c.id JOIN users u ON p.seller_id = u.id WHERE p.status = 'active'";
  const params = [];
  if (category) { sql += ' AND (c.slug = ? OR c.id = ?)'; params.push(category, category); }
  if (search) { sql += ' AND (p.title LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (location) { sql += ' AND p.location LIKE ?'; params.push(`%${location}%`); }
  if (condition) { sql += ' AND p.condition = ?'; params.push(condition); }
  if (minPrice) { sql += ' AND p.price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { sql += ' AND p.price <= ?'; params.push(Number(maxPrice)); }
  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  else if (sort === 'price_desc') orderBy = 'p.price DESC';
  else if (sort === 'oldest') orderBy = 'p.created_at ASC';
  else if (sort === 'views') orderBy = 'p.views DESC';
  sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const result = pool.query(sql, params);
  const countResult = pool.query("SELECT COUNT(*) as total FROM products p JOIN categories c ON p.category_id = c.id WHERE p.status = 'active'");
  const ads = result.rows.map(ad => {
    const images = pool.query('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY is_primary DESC LIMIT 1', [ad.id]);
    return { ...ad, images: images.rows.map(i => i.image_url) };
  });
  res.json({ ads, total: countResult.rows[0].total, page: Number(page), limit: Number(limit) });
});

router.get('/my-ads', auth, (req, res) => {
  const result = pool.query('SELECT p.*, c.name as category_name, (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as image_count FROM products p JOIN categories c ON p.category_id = c.id WHERE p.seller_id = ? ORDER BY p.created_at DESC', [req.user.id]);
  res.json({ ads: result.rows });
});

router.get('/:id', (req, res) => {
  const result = pool.query('SELECT p.*, c.name as category_name, c.slug as category_slug, u.name as seller_name, u.avatar as seller_avatar, u.phone as seller_phone, u.location as seller_location, u.created_at as seller_joined FROM products p JOIN categories c ON p.category_id = c.id JOIN users u ON p.seller_id = u.id WHERE p.id = ?', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Ad not found.' });
  const ad = result.rows[0];
  pool.query('UPDATE products SET views = views + 1 WHERE id = ?', [ad.id]);
  ad.images = pool.query('SELECT image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC', [ad.id]).rows;
  ad.similar_ads = pool.query("SELECT p.id, p.title, p.price, p.created_at, (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image FROM products p WHERE p.category_id = ? AND p.id != ? AND p.status = 'active' ORDER BY p.created_at DESC LIMIT 4", [ad.category_id, ad.id]).rows;
  res.json({ ad });
});

router.post('/', auth, (req, res) => {
  const { title, description, price, condition, category_id, location, images } = req.body;
  if (!title || !description || !price || !category_id) return res.status(400).json({ error: 'Title, description, price, and category are required.' });
  const result = pool.query('INSERT INTO products (title, description, price, condition, category_id, seller_id, location) VALUES (?, ?, ?, ?, ?, ?, ?)', [title, description, Number(price), condition || 'used', category_id, req.user.id, location || '']);
  const productId = result.lastInsertRowid;
  if (images && Array.isArray(images)) images.forEach((url, i) => pool.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)', [productId, url, i === 0 ? 1 : 0]));
  const ad = pool.query('SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [productId]).rows[0];
  res.status(201).json({ ad });
});

router.put('/:id', auth, (req, res) => {
  const existing = pool.query('SELECT * FROM products WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Ad not found or unauthorized.' });
  const { title, description, price, condition, category_id, location, status } = req.body;
  const updates = []; const params = [];
  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (price !== undefined) { updates.push('price = ?'); params.push(Number(price)); }
  if (condition !== undefined) { updates.push('condition = ?'); params.push(condition); }
  if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
  if (location !== undefined) { updates.push('location = ?'); params.push(location); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (updates.length > 0) { updates.push("updated_at = datetime('now')"); params.push(req.params.id); pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params); }
  const updated = pool.query('SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [req.params.id]).rows[0];
  res.json({ ad: updated });
});

router.delete('/:id', auth, (req, res) => {
  const existing = pool.query('SELECT * FROM products WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Ad not found or unauthorized.' });
  pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Ad deleted successfully.' });
});

router.patch('/:id/sold', auth, (req, res) => {
  const existing = pool.query('SELECT * FROM products WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Ad not found or unauthorized.' });
  pool.query("UPDATE products SET status = 'sold', updated_at = datetime('now') WHERE id = ?", [req.params.id]);
  res.json({ message: 'Ad marked as sold.' });
});

module.exports = router;
