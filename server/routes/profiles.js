const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Update own profile
router.put('/me', requireAuth, (req, res) => {
  const { name, age, bio, gender, interested_in, photo_url, profile_type, allowance_expectation } = req.body;
  db.prepare(`
    UPDATE users
    SET name = ?, age = ?, bio = ?, gender = ?, interested_in = ?,
        photo_url = ?, profile_type = ?, allowance_expectation = ?, is_setup_complete = 1
    WHERE id = ?
  `).run(name, age, bio, gender, interested_in, photo_url, profile_type || 'regular', allowance_expectation || 0, req.userId);
  const user = db.prepare(
    'SELECT id, email, name, age, bio, gender, interested_in, photo_url, profile_type, allowance_expectation, is_setup_complete FROM users WHERE id = ?'
  ).get(req.userId);
  res.json(user);
});

// Get any profile (public fields)
router.get('/:id', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT id, name, age, bio, gender, photo_url, profile_type, allowance_expectation FROM users WHERE id = ?'
  ).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const vacations = db.prepare(
    'SELECT * FROM vacations WHERE user_id = ? AND end_date >= date("now") ORDER BY start_date'
  ).all(req.params.id);
  res.json({ ...user, vacations });
});

module.exports = router;
