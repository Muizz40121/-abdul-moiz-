const pool = require('./pool');
const path = require('path');
const fs = require('fs');
try { pool.exec(fs.readFileSync(path.join(__dirname, '..', 'config', 'init.sql'), 'utf8')); console.log('Database initialized'); } catch (e) { console.error(e.message); }
pool.end();
