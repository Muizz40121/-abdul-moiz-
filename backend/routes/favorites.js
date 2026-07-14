const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, (req, res) => {
  const result = pool.query('SELECT p.*, c.name as category_name, u.name as seller_name, f.created_at as favorited_at FROM favorites f JOIN products p ON f.product_id = p.id JOIN categories c ON p.category_id = c.id JOIN users u ON p.seller_id = u.id WHERE f.user_id = ? ORDER BY f.created_at DESC', [req.user.id]);
  const ads = result.rows.map(ad => {
    const images = pool.query('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY is_primary DESC LIMIT 1', [ad.id]);
    return { ...ad, images: images.rows.map(i => i.image_url) };
  });
  res.json({ ads });
});

router.post('/:productId', auth, (req, res) => {
  const existing = pool.query('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
  if (existing.rows.length > 0) return res.status(400).json({ error: 'Already in favorites.' });
  pool.query('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)', [req.user.id, req.params.productId]);
  res.status(201).json({ message: 'Added to favorites.' });
});

router.delete('/:productId', auth, (req, res) => {
  pool.query('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
  res.json({ message: 'Removed from favorites.' });
});

router.get('/check/:productId', auth, (req, res) => {
  const result = pool.query('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
  res.json({ isFavorited: result.rows.length > 0 });
});

module.exports = router;
