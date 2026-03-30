const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const PUBLIC_FIELDS = 'id, email, name, age, bio, gender, interested_in, photo_url, profile_type, allowance_expectation, kinks, spica_unlocked, spica_likes, is_setup_complete';

// Update own profile (including kinks)
router.put('/me', requireAuth, (req, res) => {
  const { name, age, bio, gender, interested_in, photo_url, profile_type, allowance_expectation, kinks } = req.body;
  db.prepare(`
    UPDATE users
    SET name = ?, age = ?, bio = ?, gender = ?, interested_in = ?,
        photo_url = ?, profile_type = ?, allowance_expectation = ?,
        kinks = ?, is_setup_complete = 1
    WHERE id = ?
  `).run(
    name, age, bio, gender, interested_in,
    photo_url, profile_type || 'regular', allowance_expectation || 0,
    JSON.stringify(kinks || []), req.userId
  );
  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(req.userId);
  res.json({ ...user, kinks: JSON.parse(user.kinks || '[]') });
});

// Update kinks only
router.put('/me/kinks', requireAuth, (req, res) => {
  const { kinks } = req.body;
  if (!Array.isArray(kinks)) return res.status(400).json({ error: 'kinks must be an array' });
  db.prepare('UPDATE users SET kinks = ? WHERE id = ?').run(JSON.stringify(kinks), req.userId);
  res.json({ kinks });
});

// Get any profile (public fields; kinks only returned if requester has spica_unlocked)
router.get('/:id', requireAuth, (req, res) => {
  const requester = db.prepare('SELECT spica_unlocked FROM users WHERE id = ?').get(req.userId);
  const user = db.prepare(
    'SELECT id, name, age, bio, gender, photo_url, profile_type, allowance_expectation, kinks FROM users WHERE id = ?'
  ).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const vacations = db.prepare(
    'SELECT * FROM vacations WHERE user_id = ? AND end_date >= date("now") ORDER BY start_date'
  ).all(req.params.id);
  const kinks = requester?.spica_unlocked ? JSON.parse(user.kinks || '[]') : [];
  res.json({ ...user, kinks, vacations });
});

module.exports = router;
