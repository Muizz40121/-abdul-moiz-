const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

router.use(auth, admin);

router.get('/dashboard', (req, res) => {
  const totalUsers = pool.query('SELECT COUNT(*) as count FROM users').rows[0].count;
  const totalAds = pool.query('SELECT COUNT(*) as count FROM products').rows[0].count;
  const activeAds = pool.query("SELECT COUNT(*) as count FROM products WHERE status = 'active'").rows[0].count;
  const totalCategories = pool.query('SELECT COUNT(*) as count FROM categories').rows[0].count;
  const totalReports = pool.query('SELECT COUNT(*) as count FROM reports').rows[0].count;
  const pendingReports = pool.query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").rows[0].count;
  const todayAds = pool.query("SELECT COUNT(*) as count FROM products WHERE date(created_at) = date('now')").rows[0].count;
  const totalConversations = pool.query('SELECT COUNT(*) as count FROM conversations').rows[0].count;
  res.json({ totalUsers, totalAds, activeAds, totalCategories, totalReports, pendingReports, todayAds, totalConversations });
});

router.get('/users', (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  let sql = 'SELECT id, name, email, phone, location, is_admin, created_at, updated_at FROM users';
  const params = [];
  if (search) { sql += ' WHERE (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const users = pool.query(sql, params).rows;
  const total = pool.query('SELECT COUNT(*) as count FROM users' + (search ? ' WHERE name LIKE ? OR email LIKE ?' : ''), search ? [`%${search}%`, `%${search}%`] : []).rows[0].count;
  res.json({ users, total, page: Number(page), limit: Number(limit) });
});

router.put('/users/:id', (req, res) => {
  const existing = pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  const { name, email, is_admin } = req.body;
  const updates = []; const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (is_admin !== undefined) { updates.push('is_admin = ?'); params.push(Number(is_admin)); }
  if (updates.length > 0) { updates.push("updated_at = datetime('now')"); params.push(req.params.id); pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params); }
  const user = pool.query('SELECT id, name, email, phone, location, is_admin, created_at FROM users WHERE id = ?', [req.params.id]).rows[0];
  res.json({ user });
});

router.delete('/users/:id', (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself.' });
  const existing = pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ message: 'User deleted.' });
});

router.get('/ads', (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  let sql = 'SELECT p.*, u.name as seller_name, u.email as seller_email, c.name as category_name FROM products p JOIN users u ON p.seller_id = u.id JOIN categories c ON p.category_id = c.id';
  const params = []; const wheres = [];
  if (status) { wheres.push('p.status = ?'); params.push(status); }
  if (search) { wheres.push('(p.title LIKE ? OR u.name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (wheres.length > 0) sql += ' WHERE ' + wheres.join(' AND ');
  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const ads = pool.query(sql, params).rows.map(ad => {
    const images = pool.query('SELECT image_url FROM product_images WHERE product_id = ? LIMIT 1', [ad.id]).rows;
    return { ...ad, image: images.length > 0 ? images[0].image_url : null };
  });
  const countSql = 'SELECT COUNT(*) as count FROM products p' + (wheres.length > 0 ? ' WHERE ' + wheres.join(' AND ') : '');
  const total = pool.query(countSql, params.slice(0, -2)).rows[0].count;
  res.json({ ads, total, page: Number(page), limit: Number(limit) });
});

router.put('/ads/:id', (req, res) => {
  const existing = pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Ad not found.' });
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
  const ad = pool.query('SELECT p.*, u.name as seller_name, c.name as category_name FROM products p JOIN users u ON p.seller_id = u.id JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [req.params.id]).rows[0];
  res.json({ ad });
});

router.put('/ads/:id/images', (req, res) => {
  const existing = pool.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Ad not found.' });
  const { images } = req.body;
  if (!images || !Array.isArray(images)) return res.status(400).json({ error: 'Images array required.' });
  pool.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
  images.forEach((url, i) => pool.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)', [req.params.id, url, i === 0 ? 1 : 0]));
  const result = pool.query('SELECT image_url, is_primary FROM product_images WHERE product_id = ?', [req.params.id]);
  res.json({ images: result.rows });
});

router.delete('/ads/:id', (req, res) => {
  const existing = pool.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Ad not found.' });
  pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Ad deleted.' });
});

router.get('/categories', (req, res) => {
  const categories = pool.query('SELECT * FROM categories ORDER BY name').rows;
  const counts = pool.query('SELECT category_id, COUNT(*) as count FROM products GROUP BY category_id').rows;
  const catMap = {}; counts.forEach(c => catMap[c.category_id] = c.count);
  res.json({ categories: categories.map(c => ({ ...c, ad_count: catMap[c.id] || 0 })) });
});

router.post('/categories', (req, res) => {
  const { name, slug, icon } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required.' });
  const existing = pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
  if (existing.rows.length > 0) return res.status(400).json({ error: 'Category slug already exists.' });
  const r = pool.query('INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)', [name, slug, icon || 'fa-tag']);
  const cat = pool.query('SELECT * FROM categories WHERE id = ?', [r.lastInsertRowid]).rows[0];
  res.status(201).json({ category: cat });
});

router.put('/categories/:id', (req, res) => {
  const existing = pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Category not found.' });
  const { name, slug, icon } = req.body;
  const updates = []; const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (slug !== undefined) { updates.push('slug = ?'); params.push(slug); }
  if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
  if (updates.length > 0) { params.push(req.params.id); pool.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params); }
  const cat = pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]).rows[0];
  res.json({ category: cat });
});

router.delete('/categories/:id', (req, res) => {
  const existing = pool.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Category not found.' });
  pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ message: 'Category deleted.' });
});

router.get('/reports', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT r.*, p.title as product_title, u.name as reporter_name FROM reports r JOIN products p ON r.product_id = p.id JOIN users u ON r.reporter_id = u.id';
  const params = [];
  if (status) { sql += ' WHERE r.status = ?'; params.push(status); }
  sql += ' ORDER BY r.created_at DESC';
  const reports = pool.query(sql, params).rows;
  res.json({ reports });
});

router.put('/reports/:id', (req, res) => {
  const existing = pool.query('SELECT * FROM reports WHERE id = ?', [req.params.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Report not found.' });
  const { status } = req.body;
  if (status) pool.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
  const report = pool.query('SELECT * FROM reports WHERE id = ?', [req.params.id]).rows[0];
  res.json({ report });
});

router.delete('/reports/:id', (req, res) => {
  const existing = pool.query('SELECT id FROM reports WHERE id = ?', [req.params.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Report not found.' });
  pool.query('DELETE FROM reports WHERE id = ?', [req.params.id]);
  res.json({ message: 'Report deleted.' });
});

module.exports = router;