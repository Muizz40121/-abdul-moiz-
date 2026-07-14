const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = pool.query('SELECT id, name, email, is_admin FROM users WHERE email = ?', [decoded.email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists. Please login again.' });
    }
    req.user = { id: user.rows[0].id, email: user.rows[0].email, is_admin: user.rows[0].is_admin };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = auth;
