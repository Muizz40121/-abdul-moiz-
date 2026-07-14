const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const cloudinary = require('cloudinary').v2;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const pool = require('../backend/db/pool');
try { pool.exec(fs.readFileSync(path.join(__dirname, '..', 'backend', 'config', 'init.sql'), 'utf8')); } catch (e) { console.error('Init SQL error:', e.message); }

const authRoutes = require('../backend/routes/auth');
const categoryRoutes = require('../backend/routes/categories');
const adRoutes = require('../backend/routes/ads');
const favoriteRoutes = require('../backend/routes/favorites');
const messageRoutes = require('../backend/routes/messages');
const profileRoutes = require('../backend/routes/profile');
const adminRoutes = require('../backend/routes/admin');
const { seed } = require('../backend/db/seed-data');
try { seed(); } catch (e) { console.error('Seed error:', e.message); }

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', require('../backend/routes/upload'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', node: process.version, timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'backend', 'uploads')));
if (process.env.VERCEL) app.use('/uploads', express.static('/tmp/uploads'));
app.use('/uploads', (req, res) => {
  res.status(200).set('Content-Type', 'image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#eee" width="400" height="300"/><text fill="#999" font-family="sans-serif" font-size="18" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Image not available</text></svg>');
});

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

module.exports = app;
