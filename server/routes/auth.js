const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const { awardLogin } = require('../utils/points');

const router = express.Router();

const PUBLIC_FIELDS = `id, email, name, age, bio, gender, interested_in, photo_url,
  profile_type, allowance_expectation, kinks, spica_unlocked, spica_likes,
  is_setup_complete, points, mood,
  available_days, available_from, available_to,
  constellation_type, partner_display, seeking_desc`;

function parseUser(u) {
  if (!u) return null;
  return {
    ...u,
    kinks: JSON.parse(u.kinks || '[]'),
    available_days: u.available_days ? JSON.parse(u.available_days) : [],
  };
}

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const hash = await bcrypt.hash(password, 10);
  const { lastInsertRowid } = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?,?,?)').run(email, hash, name);
  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id=?`).get(lastInsertRowid);
  const token = jwt.sign({ userId: lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: parseUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  awardLogin(row.id);
  const token = jwt.sign({ userId: row.id }, JWT_SECRET, { expiresIn: '7d' });
  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id=?`).get(row.id);
  res.json({ token, user: parseUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  awardLogin(req.userId);
  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id=?`).get(req.userId);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(parseUser(user));
});

module.exports = router;
