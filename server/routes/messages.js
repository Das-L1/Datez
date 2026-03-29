const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function assertInMatch(matchId, userId) {
  return db.prepare('SELECT id FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)').get(matchId, userId, userId);
}

// Get messages for a match
router.get('/:matchId', requireAuth, (req, res) => {
  if (!assertInMatch(req.params.matchId, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const messages = db.prepare('SELECT * FROM messages WHERE match_id = ? ORDER BY created_at ASC').all(req.params.matchId);
  res.json(messages);
});

// Send a message
router.post('/:matchId', requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });
  if (!assertInMatch(req.params.matchId, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO messages (match_id, sender_id, content) VALUES (?, ?, ?)'
  ).run(req.params.matchId, req.userId, content.trim());
  res.json(db.prepare('SELECT * FROM messages WHERE id = ?').get(lastInsertRowid));
});

// Send a tip inside a match
router.post('/:matchId/tips', requireAuth, (req, res) => {
  const { amount, message } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'amount must be positive' });

  const match = assertInMatch(req.params.matchId, req.userId);
  if (!match) return res.status(403).json({ error: 'Forbidden' });

  const matchRow = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.matchId);
  const receiverId = matchRow.user1_id === req.userId ? matchRow.user2_id : matchRow.user1_id;

  const { lastInsertRowid } = db.prepare(
    'INSERT INTO tips (sender_id, receiver_id, match_id, amount, message) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, receiverId, req.params.matchId, amount, message || null);

  const tip = db.prepare('SELECT * FROM tips WHERE id = ?').get(lastInsertRowid);
  res.json(tip);
});

// Get tips for a match
router.get('/:matchId/tips', requireAuth, (req, res) => {
  if (!assertInMatch(req.params.matchId, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const tips = db.prepare(`
    SELECT t.*, u.name as sender_name, u.photo_url as sender_photo
    FROM tips t JOIN users u ON u.id = t.sender_id
    WHERE t.match_id = ? ORDER BY t.created_at ASC
  `).all(req.params.matchId);
  res.json(tips);
});

module.exports = router;
