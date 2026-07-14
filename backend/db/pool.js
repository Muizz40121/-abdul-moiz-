const path = require('path');
const fs = require('fs');

// SQLite via node:sqlite (synchronous, works everywhere)
const { DatabaseSync } = require('node:sqlite');
const dbDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
fs.mkdirSync(dbDir, { recursive: true });
const db = new DatabaseSync(path.join(dbDir, 'pakbazaar.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

module.exports = {
  exec(sql) { db.exec(sql); },
  query(text, params) {
    const trimmed = text.trim().toUpperCase();
    const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('RETURNING');
    if (isSelect) {
      return { rows: params ? db.prepare(text).all(...params) : db.prepare(text).all() };
    }
    const result = params ? db.prepare(text).run(...params) : db.prepare(text).run();
    return { rows: [], changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) };
  },
  end() { db.close(); }
};
