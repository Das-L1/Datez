const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const PUBLIC_ME = `id, email, name, age, bio, gender, interested_in, photo_url,
  profile_type, allowance_expectation, kinks, spica_unlocked, spica_likes,
  is_setup_complete, points, mood,
  available_days, available_from, available_to,
  constellation_type, partner_display, seeking_desc`;

// Update own profile
router.put('/me', requireAuth, (req, res) => {
  const {
    name, age, bio, gender, interested_in, photo_url,
    profile_type, allowance_expectation, kinks,
    mood,
    available_days, available_from, available_to,
    constellation_type, partner_display, seeking_desc,
  } = req.body;

  db.prepare(`
    UPDATE users
    SET name=?, age=?, bio=?, gender=?, interested_in=?,
        photo_url=?, profile_type=?, allowance_expectation=?,
        kinks=?, mood=?,
        available_days=?, available_from=?, available_to=?,
        constellation_type=?, partner_display=?, seeking_desc=?,
        is_setup_complete=1
    WHERE id=?
  `).run(
    name, age, bio, gender, interested_in,
    photo_url, profile_type || 'regular', allowance_expectation || 0,
    JSON.stringify(kinks || []), mood || null,
    available_days ? JSON.stringify(available_days) : null,
    available_from ?? null, available_to ?? null,
    constellation_type || null, partner_display || null, seeking_desc || null,
    req.userId
  );

  const user = db.prepare(`SELECT ${PUBLIC_ME} FROM users WHERE id=?`).get(req.userId);
  res.json({ ...user, kinks: JSON.parse(user.kinks || '[]') });
});

// Update kinks only
router.put('/me/kinks', requireAuth, (req, res) => {
  const { kinks } = req.body;
  if (!Array.isArray(kinks)) return res.status(400).json({ error: 'kinks must be an array' });
  db.prepare('UPDATE users SET kinks=? WHERE id=?').run(JSON.stringify(kinks), req.userId);
  res.json({ kinks });
});

// Update mood only
router.put('/me/mood', requireAuth, (req, res) => {
  const { mood } = req.body;
  db.prepare('UPDATE users SET mood=? WHERE id=?').run(mood || null, req.userId);
  res.json({ mood });
});

// Get any public profile
router.get('/:id', requireAuth, (req, res) => {
  const requester = db.prepare('SELECT spica_unlocked FROM users WHERE id=?').get(req.userId);
  const user = db.prepare(`
    SELECT id, name, age, bio, gender, photo_url, profile_type, allowance_expectation,
           kinks, mood, constellation_type, partner_display, seeking_desc,
           available_days, available_from, available_to
    FROM users WHERE id=?
  `).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const vacations = db.prepare(
    'SELECT * FROM vacations WHERE user_id=? AND end_date >= date("now") ORDER BY start_date'
  ).all(req.params.id);
  const kinks = requester?.spica_unlocked ? JSON.parse(user.kinks || '[]') : [];
  res.json({ ...user, kinks, vacations });
});

module.exports = router;
