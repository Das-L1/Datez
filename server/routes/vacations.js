const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get my vacations
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM vacations WHERE user_id = ? ORDER BY start_date').all(req.userId);
  res.json(rows);
});

// Add a vacation
router.post('/', requireAuth, (req, res) => {
  const { location, start_date, end_date } = req.body;
  if (!location || !start_date || !end_date) {
    return res.status(400).json({ error: 'location, start_date, and end_date are required' });
  }
  if (start_date > end_date) {
    return res.status(400).json({ error: 'start_date must be before end_date' });
  }
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO vacations (user_id, location, start_date, end_date) VALUES (?, ?, ?, ?)'
  ).run(req.userId, location, start_date, end_date);
  const vacation = db.prepare('SELECT * FROM vacations WHERE id = ?').get(lastInsertRowid);
  res.json(vacation);
});

// Delete a vacation
router.delete('/:id', requireAuth, (req, res) => {
  const vacation = db.prepare('SELECT * FROM vacations WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!vacation) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM vacations WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Travelers — users who have a vacation overlapping a location + date range
router.get('/travelers', requireAuth, (req, res) => {
  const { location, date } = req.query;
  if (!location) return res.status(400).json({ error: 'location is required' });
  const today = date || new Date().toISOString().slice(0, 10);

  // Find users (excluding self and already-swiped) who have a vacation in that location
  const swiped = db.prepare('SELECT swiped_id FROM swipes WHERE swiper_id = ?').all(req.userId).map(r => r.swiped_id);
  swiped.push(req.userId);
  const placeholders = swiped.map(() => '?').join(',');

  const travelers = db.prepare(`
    SELECT DISTINCT u.id, u.name, u.age, u.bio, u.photo_url, u.profile_type, u.allowance_expectation,
           v.location, v.start_date, v.end_date
    FROM vacations v
    JOIN users u ON u.id = v.user_id
    WHERE u.is_setup_complete = 1
      AND u.id NOT IN (${placeholders})
      AND lower(v.location) LIKE lower(?)
      AND v.start_date <= ? AND v.end_date >= ?
    ORDER BY v.start_date
    LIMIT 20
  `).all(...swiped, `%${location}%`, today, today);

  res.json(travelers);
});

module.exports = router;
