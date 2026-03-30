const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'datez.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    age INTEGER,
    bio TEXT,
    gender TEXT CHECK(gender IN ('man','woman','nonbinary')),
    interested_in TEXT CHECK(interested_in IN ('men','women','everyone')),
    photo_url TEXT,
    profile_type TEXT NOT NULL DEFAULT 'regular'
      CHECK(profile_type IN ('regular','sugar_daddy','sugar_mommy','sugar_baby')),
    allowance_expectation INTEGER DEFAULT 0,
    is_setup_complete INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vacations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    location TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS swipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    swiper_id INTEGER NOT NULL,
    swiped_id INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('like','pass')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(swiper_id, swiped_id),
    FOREIGN KEY(swiper_id) REFERENCES users(id),
    FOREIGN KEY(swiped_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id),
    FOREIGN KEY(user1_id) REFERENCES users(id),
    FOREIGN KEY(user2_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(match_id) REFERENCES matches(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    match_id INTEGER NOT NULL,
    amount INTEGER NOT NULL CHECK(amount > 0),
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id),
    FOREIGN KEY(match_id) REFERENCES matches(id)
  );
`);

// Safe migrations for new columns
const migrations = [
  "ALTER TABLE users ADD COLUMN kinks TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE users ADD COLUMN spica_unlocked INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN spica_likes INTEGER NOT NULL DEFAULT 0",
  // Points & engagement
  "ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN last_active_date TEXT",
  "ALTER TABLE users ADD COLUMN daily_msg_points INTEGER NOT NULL DEFAULT 0",
  // Mood
  "ALTER TABLE users ADD COLUMN mood TEXT",
  // Off the Clock
  "ALTER TABLE users ADD COLUMN available_days TEXT",
  "ALTER TABLE users ADD COLUMN available_from INTEGER",
  "ALTER TABLE users ADD COLUMN available_to INTEGER",
  // Constellation
  "ALTER TABLE users ADD COLUMN constellation_type TEXT",
  "ALTER TABLE users ADD COLUMN partner_display TEXT",
  "ALTER TABLE users ADD COLUMN seeking_desc TEXT",
  // New tables (CREATE IF NOT EXISTS won't fail)
  `CREATE TABLE IF NOT EXISTS admirer_reveals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    revealed_id INTEGER NOT NULL,
    method TEXT NOT NULL CHECK(method IN ('ad','points')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(revealed_id) REFERENCES users(id)
  )`,
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { /* already exists */ }
}

module.exports = db;
