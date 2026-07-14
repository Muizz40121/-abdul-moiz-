const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/:id', (req, res) => {
  const result = pool.query('SELECT id, name, email, phone, avatar, location, is_admin, created_at FROM users WHERE id = ?', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  const user = result.rows[0];
  const adCount = pool.query("SELECT COUNT(*) as count FROM products WHERE seller_id = ? AND status = 'active'", [user.id]);
  res.json({ user, stats: { active_ads: adCount.rows[0].count } });
});

router.put('/update', auth, (req, res) => {
  const { name, phone, location, avatar } = req.body;
  const updates = []; const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (location !== undefined) { updates.push('location = ?'); params.push(location); }
  if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
  if (updates.length > 0) { updates.push("updated_at = datetime('now')"); params.push(req.user.id); pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params); }
  const user = pool.query('SELECT id, name, email, phone, avatar, location, is_admin, created_at FROM users WHERE id = ?', [req.user.id]).rows[0];
  res.json({ user });
});

router.put('/change-password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required.' });
  const result = pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
  if (!bcrypt.compareSync(currentPassword, result.rows[0].password)) return res.status(400).json({ error: 'Current password is incorrect.' });
  pool.query('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?', [bcrypt.hashSync(newPassword, 10), req.user.id]);
  res.json({ message: 'Password updated successfully.' });
});

module.exports = router;
