const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { awardMatch } = require('../utils/points');

const router = express.Router();

function isActiveNow(user) {
  if (!user.available_days || !user.available_from == null || user.available_to == null) return null;
  const days = JSON.parse(user.available_days || '[]');
  if (!days.length) return null;
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const hour = now.getHours();
  if (!days.includes(day)) return false;
  return hour >= user.available_from && hour < user.available_to;
}

function chemistryScore(myKinks, theirKinks) {
  if (!myKinks.length || !theirKinks.length) return null;
  const overlap = theirKinks.filter(k => myKinks.includes(k)).length;
  const union = new Set([...myKinks, ...theirKinks]).size;
  return union > 0 ? Math.round((overlap / union) * 100) : 0;
}

// Discover users to swipe on
router.get('/discover', requireAuth, (req, res) => {
  const me = db.prepare(
    'SELECT gender, interested_in, spica_unlocked, kinks FROM users WHERE id=?'
  ).get(req.userId);
  const myKinks = me?.spica_unlocked ? JSON.parse(me.kinks || '[]') : [];

  const swiped = db.prepare('SELECT swiped_id FROM swipes WHERE swiper_id=?').all(req.userId).map(r => r.swiped_id);
  swiped.push(req.userId);
  const ph = swiped.map(() => '?').join(',');

  let query = `
    SELECT u.id, u.name, u.age, u.bio, u.photo_url, u.profile_type, u.allowance_expectation,
           u.kinks, u.mood, u.constellation_type, u.partner_display, u.seeking_desc,
           u.available_days, u.available_from, u.available_to,
           (SELECT COALESCE(SUM(amount),0) FROM tips WHERE receiver_id=u.id) as tips_total
    FROM users u
    WHERE u.is_setup_complete=1 AND u.id NOT IN (${ph})
  `;
  const params = [...swiped];

  if (me?.interested_in && me.interested_in !== 'everyone') {
    query += ' AND u.gender=?';
    params.push(me.interested_in);
  }
  query += ' ORDER BY RANDOM() LIMIT 20';

  const users = db.prepare(query).all(...params);

  const withExtras = users.map(u => {
    const vacations = db.prepare(
      'SELECT location, start_date, end_date FROM vacations WHERE user_id=? AND end_date >= date("now") ORDER BY start_date LIMIT 3'
    ).all(u.id);
    const theirKinks = me?.spica_unlocked ? JSON.parse(u.kinks || '[]') : [];
    const { kinks: _raw, ...rest } = u;
    const active = isActiveNow(u);
    return {
      ...rest,
      kinks: theirKinks,
      vacations,
      active_now: active,
      chemistry_score: me?.spica_unlocked ? chemistryScore(myKinks, theirKinks) : null,
    };
  });

  res.json(withExtras);
});

// Record a swipe
router.post('/', requireAuth, (req, res) => {
  const { swiped_id, direction } = req.body;
  if (!['like', 'pass'].includes(direction)) {
    return res.status(400).json({ error: 'direction must be like or pass' });
  }

  db.prepare('INSERT OR IGNORE INTO swipes (swiper_id, swiped_id, direction) VALUES (?,?,?)').run(req.userId, swiped_id, direction);

  let matched = false;
  let matchId = null;

  if (direction === 'like') {
    const mutual = db.prepare(
      'SELECT id FROM swipes WHERE swiper_id=? AND swiped_id=? AND direction="like"'
    ).get(swiped_id, req.userId);

    if (mutual) {
      const [u1, u2] = [req.userId, swiped_id].sort((a, b) => a - b);
      const existing = db.prepare('SELECT id FROM matches WHERE user1_id=? AND user2_id=?').get(u1, u2);
      if (!existing) {
        const r = db.prepare('INSERT INTO matches (user1_id, user2_id) VALUES (?,?)').run(u1, u2);
        matchId = r.lastInsertRowid;
      } else {
        matchId = existing.id;
      }
      matched = true;
      // Award both users match points
      awardMatch(req.userId);
      awardMatch(swiped_id);
    }
  }

  res.json({ matched, matchId });
});

// Get matches
router.get('/matches', requireAuth, (req, res) => {
  const matches = db.prepare(`
    SELECT m.id as match_id, m.created_at as matched_at,
           u.id, u.name, u.age, u.photo_url, u.profile_type, u.allowance_expectation, u.mood,
           (SELECT content FROM messages WHERE match_id=m.id ORDER BY created_at DESC LIMIT 1) as last_message,
           (SELECT created_at FROM messages WHERE match_id=m.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
           (SELECT COALESCE(SUM(amount),0) FROM tips WHERE match_id=m.id AND receiver_id=?) as tips_received
    FROM matches m
    JOIN users u ON u.id = CASE WHEN m.user1_id=? THEN m.user2_id ELSE m.user1_id END
    WHERE m.user1_id=? OR m.user2_id=?
    ORDER BY COALESCE(last_message_at, m.created_at) DESC
  `).all(req.userId, req.userId, req.userId, req.userId);
  res.json(matches);
});

module.exports = router;
