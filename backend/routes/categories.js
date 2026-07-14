const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.get('/', (req, res) => {
  const result = pool.query('SELECT * FROM categories ORDER BY name');
  res.json({ categories: result.rows });
});

router.get('/:id', (req, res) => {
  const result = pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found.' });
  res.json({ category: result.rows[0] });
});

module.exports = router;
