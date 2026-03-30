const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/balance', requireAuth, (req, res) => {
  const row = db.prepare('SELECT points FROM users WHERE id = ?').get(req.userId);
  res.json({ points: row?.points ?? 0 });
});

module.exports = router;
