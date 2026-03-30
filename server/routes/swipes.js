const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Discover users to swipe on
router.get('/discover', requireAuth, (req, res) => {
  const me = db.prepare('SELECT gender, interested_in, spica_unlocked FROM users WHERE id = ?').get(req.userId);
  const swiped = db.prepare('SELECT swiped_id FROM swipes WHERE swiper_id = ?').all(req.userId).map(r => r.swiped_id);
  swiped.push(req.userId);
  const placeholders = swiped.map(() => '?').join(',');

  let query = `
    SELECT u.id, u.name, u.age, u.bio, u.photo_url, u.profile_type, u.allowance_expectation,
           u.kinks,
           (SELECT COUNT(*) FROM tips WHERE receiver_id = u.id) as tip_count,
           (SELECT COALESCE(SUM(amount),0) FROM tips WHERE receiver_id = u.id) as tips_total
    FROM users u
    WHERE u.is_setup_complete = 1
      AND u.id NOT IN (${placeholders})
  `;
  const params = [...swiped];

  if (me?.interested_in && me.interested_in !== 'everyone') {
    query += ' AND u.gender = ?';
    params.push(me.interested_in);
  }
  query += ' ORDER BY RANDOM() LIMIT 20';

  const users = db.prepare(query).all(...params);

  // Attach upcoming vacations + parse kinks for each user
  const withExtras = users.map(u => {
    const vacations = db.prepare(
      'SELECT location, start_date, end_date FROM vacations WHERE user_id = ? AND end_date >= date("now") ORDER BY start_date LIMIT 3'
    ).all(u.id);
    // Only expose kinks to users with Spica unlocked
    const kinks = me?.spica_unlocked ? JSON.parse(u.kinks || '[]') : [];
    const { kinks: _raw, ...rest } = u;
    return { ...rest, kinks, vacations };
  });

  res.json(withExtras);
});

// Record a swipe
router.post('/', requireAuth, (req, res) => {
  const { swiped_id, direction } = req.body;
  if (!['like', 'pass'].includes(direction)) {
    return res.status(400).json({ error: 'direction must be like or pass' });
  }

  db.prepare('INSERT OR IGNORE INTO swipes (swiper_id, swiped_id, direction) VALUES (?, ?, ?)').run(req.userId, swiped_id, direction);

  let matched = false;
  let matchId = null;

  if (direction === 'like') {
    const mutual = db.prepare(
      'SELECT id FROM swipes WHERE swiper_id = ? AND swiped_id = ? AND direction = "like"'
    ).get(swiped_id, req.userId);

    if (mutual) {
      const [u1, u2] = [req.userId, swiped_id].sort((a, b) => a - b);
      const existing = db.prepare('SELECT id FROM matches WHERE user1_id = ? AND user2_id = ?').get(u1, u2);
      if (!existing) {
        const r = db.prepare('INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)').run(u1, u2);
        matchId = r.lastInsertRowid;
      } else {
        matchId = existing.id;
      }
      matched = true;
    }
  }

  res.json({ matched, matchId });
});

// Get matches
router.get('/matches', requireAuth, (req, res) => {
  const matches = db.prepare(`
    SELECT m.id as match_id, m.created_at as matched_at,
           u.id, u.name, u.age, u.photo_url, u.profile_type, u.allowance_expectation,
           (SELECT content FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_message,
           (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
           (SELECT COALESCE(SUM(amount),0) FROM tips WHERE match_id = m.id AND receiver_id = ?) as tips_received
    FROM matches m
    JOIN users u ON u.id = CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END
    WHERE m.user1_id = ? OR m.user2_id = ?
    ORDER BY COALESCE(last_message_at, m.created_at) DESC
  `).all(req.userId, req.userId, req.userId, req.userId);
  res.json(matches);
});

module.exports = router;
