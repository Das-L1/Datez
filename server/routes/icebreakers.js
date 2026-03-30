const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const BASE = [
  "Desert island: one album, one food, one person — what are yours?",
  "What's your most controversial food take?",
  "Rate yourself as a road trip co-pilot (1–10). Defend it.",
  "What's something you're weirdly good at that surprises people?",
  "Describe your perfect Friday night in exactly 5 words.",
  "Most spontaneous thing you've ever done?",
  "Morning person or night owl — and is there a path to redemption?",
  "A hill you'll die on that's completely unimportant?",
  "If your life had a theme song right now, what would it be?",
  "Biggest green flag someone can have on a first date?",
  "What's something you used to judge people for but now totally get?",
  "Hot take: the best date idea is ___",
  "What skill have you always wanted to learn but keep putting off?",
  "How would your best friend describe you in a dating app bio?",
  "What did you want to be when you grew up, and how far off are you?",
  "Weirdest thing you find attractive in a person?",
  "What's your go-to karaoke song?",
  "Last thing that genuinely made you laugh out loud?",
];

const TRAVEL = [
  "Best trip you've taken and why it changed you?",
  "Slow travel or pack-it-all-in itinerary — be honest.",
  "You're both travelers. Would you rather meet somewhere you've both been, or somewhere neither of you has?",
  "Window seat or aisle? And is there room to negotiate?",
];

const SUGAR = [
  "Perfect first date — budget no object, anywhere in the world. Where are we going?",
  "What's something you'd love to experience but never had the right person to do it with?",
  "What does your ideal arrangement actually look like day-to-day?",
];

const SPICY = [
  "🌶️ No wrong answers: top, bottom, or 'it depends on the vibe'?",
  "🌶️ What's a dealbreaker most people wouldn't expect from you?",
  "🌶️ Lights on or lights off — and can you be talked out of it?",
  "🌶️ Something you've always wanted to try but haven't asked for yet?",
  "🌶️ Rate your flirting game honestly. What's your signature move?",
  "🌶️ What's your love language in the streets vs the sheets?",
];

// Seeded shuffle so prompts are consistent per match
function seededPick(arr, seed, n) {
  let s = seed;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// GET /api/icebreakers/:matchId
router.get('/:matchId', requireAuth, (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const match = db.prepare('SELECT * FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)')
    .get(matchId, req.userId, req.userId);
  if (!match) return res.status(403).json({ error: 'Forbidden' });

  const otherId = match.user1_id === req.userId ? match.user2_id : match.user1_id;
  const me = db.prepare('SELECT profile_type, spica_unlocked, kinks FROM users WHERE id = ?').get(req.userId);
  const other = db.prepare('SELECT profile_type, kinks FROM users WHERE id = ?').get(otherId);
  const bothHaveVacations =
    db.prepare('SELECT COUNT(*) as c FROM vacations WHERE user_id = ? AND end_date >= date("now")').get(req.userId).c > 0 &&
    db.prepare('SELECT COUNT(*) as c FROM vacations WHERE user_id = ? AND end_date >= date("now")').get(otherId).c > 0;

  // Build prompt pool
  let pool = [...BASE];
  if (bothHaveVacations) pool = [...TRAVEL, ...pool];

  const sugarTypes = new Set(['sugar_daddy', 'sugar_mommy', 'sugar_baby']);
  if (sugarTypes.has(me.profile_type) || sugarTypes.has(other.profile_type)) {
    pool = [...SUGAR, ...pool];
  }

  if (me.spica_unlocked) {
    const myKinks = JSON.parse(me.kinks || '[]');
    const theirKinks = JSON.parse(other.kinks || '[]');
    const overlap = myKinks.filter(k => theirKinks.includes(k)).length;
    if (overlap > 0) pool = [...SPICY, ...pool];
  }

  const prompts = seededPick(pool, matchId, 3);
  res.json({ prompts });
});

module.exports = router;
