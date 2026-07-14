const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });
  const existing = pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered.' });
  const result = pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, bcrypt.hashSync(password, 10)]);
  const user = pool.query('SELECT id, name, email, phone, avatar, location, is_admin, created_at FROM users WHERE id = ?', [result.lastInsertRowid]).rows[0];
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });
  res.status(201).json({ user, token });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const result = pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });
  const user = result.rows[0];
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid email or password.' });
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });
  const { password: _, ...userData } = user;
  res.json({ user: userData, token });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided.' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const result = pool.query('SELECT id, name, email, phone, avatar, location, is_admin, created_at FROM users WHERE id = ?', [decoded.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: result.rows[0] });
  } catch { res.status(401).json({ error: 'Invalid token.' }); }
});

module.exports = router;
