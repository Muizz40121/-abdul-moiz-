const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const pool = require('./db/pool');

// Initialize database tables
pool.exec(fs.readFileSync(path.join(__dirname, 'config', 'init.sql'), 'utf8'));

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const adRoutes = require('./routes/ads');
const favoriteRoutes = require('./routes/favorites');
const messageRoutes = require('./routes/messages');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
