const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const router = express.Router();

const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, crypto.randomUUID() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

function uploadToCloudinary(filePath) {
  try {
    const cloudinary = require('cloudinary').v2;
    return cloudinary.uploader.upload(filePath, { folder: 'pakbazaar' })
      .then(result => { fs.unlink(filePath, () => {}); return result.secure_url; })
      .catch(() => null);
  } catch {
    return null;
  }
}

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided.' });
  const localUrl = `/uploads/${req.file.filename}`;
  if (process.env.CLOUDINARY_URL) {
    try {
      const url = await uploadToCloudinary(req.file.path);
      if (url) return res.json({ url });
    } catch {}
  }
  res.json({ url: localUrl });
});

router.post('/multiple', upload.array('images', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No image files provided.' });
  const urls = [];
  for (const file of req.files) {
    const localUrl = `/uploads/${file.filename}`;
    if (process.env.CLOUDINARY_URL) {
      try {
        const url = await uploadToCloudinary(file.path);
        if (url) { urls.push(url); continue; }
      } catch {}
    }
    urls.push(localUrl);
  }
  res.json({ urls });
});

module.exports = router;
