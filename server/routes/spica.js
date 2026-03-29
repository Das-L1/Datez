const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const GRANTS = { ad: 10, premium: 30 };

// Unlock Spica mode or top up likes
router.post('/unlock', requireAuth, (req, res) => {
  const { method } = req.body; // 'ad' | 'premium'
  const grant = GRANTS[method];
  if (!grant) return res.status(400).json({ error: 'method must be "ad" or "premium"' });

  db.prepare(`
    UPDATE users
    SET spica_unlocked = 1, spica_likes = spica_likes + ?
    WHERE id = ?
  `).run(grant, req.userId);

  const { spica_likes, spica_unlocked } = db.prepare(
    'SELECT spica_likes, spica_unlocked FROM users WHERE id = ?'
  ).get(req.userId);

  res.json({ spica_unlocked, spica_likes, granted: grant });
});

// Use a Spica like (costs 1 from balance)
router.post('/like', requireAuth, (req, res) => {
  const { target_id } = req.body;
  if (!target_id) return res.status(400).json({ error: 'target_id required' });

  const user = db.prepare('SELECT spica_likes FROM users WHERE id = ?').get(req.userId);
  if (!user || user.spica_likes < 1) {
    return res.status(402).json({ error: 'No Spica likes remaining' });
  }

  db.prepare('UPDATE users SET spica_likes = spica_likes - 1 WHERE id = ?').run(req.userId);

  // Also record as a regular like
  db.prepare('INSERT OR IGNORE INTO swipes (swiper_id, swiped_id, direction) VALUES (?, ?, "like")').run(req.userId, target_id);

  // Check for mutual match
  let matched = false;
  let matchId = null;
  const mutual = db.prepare(
    'SELECT id FROM swipes WHERE swiper_id = ? AND swiped_id = ? AND direction = "like"'
  ).get(target_id, req.userId);

  if (mutual) {
    const [u1, u2] = [req.userId, target_id].sort((a, b) => a - b);
    const existing = db.prepare('SELECT id FROM matches WHERE user1_id = ? AND user2_id = ?').get(u1, u2);
    if (!existing) {
      const r = db.prepare('INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)').run(u1, u2);
      matchId = r.lastInsertRowid;
    } else {
      matchId = existing.id;
    }
    matched = true;
  }

  const { spica_likes } = db.prepare('SELECT spica_likes FROM users WHERE id = ?').get(req.userId);
  res.json({ matched, matchId, spica_likes });
});

// Get spica status
router.get('/status', requireAuth, (req, res) => {
  const { spica_unlocked, spica_likes } = db.prepare(
    'SELECT spica_unlocked, spica_likes FROM users WHERE id = ?'
  ).get(req.userId);
  res.json({ spica_unlocked, spica_likes });
});

module.exports = router;
