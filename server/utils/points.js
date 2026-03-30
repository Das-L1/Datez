const db = require('../db');

const TODAY = () => new Date().toISOString().slice(0, 10);
const DAILY_MSG_CAP = 20; // max pts from messages per day

function award(userId, amount) {
  db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(amount, userId);
}

/** Award daily login bonus (+5) once per calendar day. Returns pts awarded. */
function awardLogin(userId) {
  const today = TODAY();
  const user = db.prepare('SELECT last_active_date, daily_msg_points FROM users WHERE id = ?').get(userId);
  if (!user) return 0;

  const updates = { last_active_date: today };
  let pts = 0;

  if (user.last_active_date !== today) {
    // New day — reset daily msg counter and award login bonus
    updates.daily_msg_points = 0;
    pts = 5;
  }

  db.prepare('UPDATE users SET last_active_date = ?, daily_msg_points = COALESCE(?, daily_msg_points) WHERE id = ?')
    .run(today, updates.daily_msg_points ?? null, userId);

  if (pts > 0) award(userId, pts);
  return pts;
}

/** Award points for sending a message (+2, capped at DAILY_MSG_CAP per day). */
function awardMessage(userId) {
  const today = TODAY();
  const user = db.prepare('SELECT last_active_date, daily_msg_points FROM users WHERE id = ?').get(userId);
  if (!user) return 0;

  // Reset if new day
  const currentDay = user.last_active_date === today ? (user.daily_msg_points || 0) : 0;
  if (currentDay >= DAILY_MSG_CAP) return 0;

  const earned = Math.min(2, DAILY_MSG_CAP - currentDay);
  db.prepare('UPDATE users SET points = points + ?, daily_msg_points = ?, last_active_date = ? WHERE id = ?')
    .run(earned, currentDay + earned, today, userId);
  return earned;
}

/** Award points for getting a match (+10). */
function awardMatch(userId) {
  award(userId, 10);
  return 10;
}

module.exports = { award, awardLogin, awardMessage, awardMatch };
