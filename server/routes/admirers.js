const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const REVEAL_COST_POINTS = 50;
const FREE_AD_REVEALS_PER_DAY = 3;
const TODAY = () => new Date().toISOString().slice(0, 10);

// GET /api/admirers — list people who liked you (blurred unless revealed)
router.get('/', requireAuth, (req, res) => {
  // Everyone who swiped 'like' on me
  const likers = db.prepare(`
    SELECT u.id, u.name, u.age, u.photo_url, u.profile_type, u.mood,
           s.created_at as liked_at
    FROM swipes s
    JOIN users u ON u.id = s.swiper_id
    WHERE s.swiped_id = ? AND s.direction = 'like' AND u.is_setup_complete = 1
    ORDER BY s.created_at DESC
  `).all(req.userId);

  // Which of those have I already revealed?
  const revealed = new Set(
    db.prepare('SELECT revealed_id FROM admirer_reveals WHERE user_id = ?')
      .all(req.userId).map(r => r.revealed_id)
  );

  // How many free ad reveals used today?
  const adRevealedToday = db.prepare(
    "SELECT COUNT(*) as c FROM admirer_reveals WHERE user_id = ? AND method = 'ad' AND date(created_at) = ?"
  ).get(req.userId, TODAY())?.c ?? 0;

  const { points } = db.prepare('SELECT points FROM users WHERE id = ?').get(req.userId);

  const result = likers.map(u => {
    const isRevealed = revealed.has(u.id);
    // Check if already matched
    const [u1, u2] = [req.userId, u.id].sort((a, b) => a - b);
    const isMatch = !!db.prepare('SELECT id FROM matches WHERE user1_id = ? AND user2_id = ?').get(u1, u2);
    return {
      id: isRevealed ? u.id : null,
      token: u.id, // opaque token for reveal — client uses this
      name: isRevealed ? u.name : null,
      age: isRevealed ? u.age : null,
      photo_url: isRevealed ? u.photo_url : null,
      profile_type: isRevealed ? u.profile_type : null,
      mood: isRevealed ? u.mood : null,
      liked_at: u.liked_at,
      revealed: isRevealed,
      is_match: isMatch,
    };
  });

  res.json({
    admirers: result,
    count: result.length,
    points,
    free_reveals_left: Math.max(0, FREE_AD_REVEALS_PER_DAY - adRevealedToday),
    reveal_cost_points: REVEAL_COST_POINTS,
  });
});

// POST /api/admirers/:userId/reveal — reveal an admirer
router.post('/:userId/reveal', requireAuth, (req, res) => {
  const targetId = parseInt(req.params.userId);
  const { method } = req.body; // 'ad' | 'points'

  // Verify this person actually liked me
  const like = db.prepare('SELECT id FROM swipes WHERE swiper_id = ? AND swiped_id = ? AND direction = "like"')
    .get(targetId, req.userId);
  if (!like) return res.status(404).json({ error: 'Not an admirer' });

  // Already revealed?
  const existing = db.prepare('SELECT id FROM admirer_reveals WHERE user_id = ? AND revealed_id = ?')
    .get(req.userId, targetId);
  if (existing) {
    const user = db.prepare('SELECT id, name, age, photo_url, profile_type, mood FROM users WHERE id = ?').get(targetId);
    return res.json({ ...user, already_revealed: true });
  }

  if (method === 'ad') {
    const adToday = db.prepare(
      "SELECT COUNT(*) as c FROM admirer_reveals WHERE user_id = ? AND method = 'ad' AND date(created_at) = ?"
    ).get(req.userId, TODAY())?.c ?? 0;
    if (adToday >= FREE_AD_REVEALS_PER_DAY) {
      return res.status(402).json({ error: `Daily free reveals exhausted (${FREE_AD_REVEALS_PER_DAY}/day)` });
    }
  } else if (method === 'points') {
    const { points } = db.prepare('SELECT points FROM users WHERE id = ?').get(req.userId);
    if (points < REVEAL_COST_POINTS) {
      return res.status(402).json({ error: `Not enough points (need ${REVEAL_COST_POINTS})` });
    }
    db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(REVEAL_COST_POINTS, req.userId);
  } else {
    return res.status(400).json({ error: 'method must be "ad" or "points"' });
  }

  db.prepare('INSERT INTO admirer_reveals (user_id, revealed_id, method) VALUES (?, ?, ?)')
    .run(req.userId, targetId, method);

  const user = db.prepare('SELECT id, name, age, photo_url, profile_type, mood FROM users WHERE id = ?').get(targetId);
  const { points: newPoints } = db.prepare('SELECT points FROM users WHERE id = ?').get(req.userId);
  res.json({ ...user, points: newPoints });
});

module.exports = router;
