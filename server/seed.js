const bcrypt = require('bcryptjs');
const db = require('./db');

const HASH = bcrypt.hashSync('password', 10);

const users = [
  // Demo account
  {
    email: 'demo@datez.com', name: 'Alex', age: 28, gender: 'man', interested_in: 'women',
    bio: "Software engineer who loves hiking, craft coffee, and bad puns. Looking for my partner in crime.",
    photo_url: 'https://i.pravatar.cc/400?u=demo@datez.com',
    profile_type: 'regular', allowance_expectation: 0,
  },
  // Women profiles
  {
    email: 'sarah@demo.com', name: 'Sarah', age: 26, gender: 'woman', interested_in: 'men',
    bio: "Yoga instructor & travel addict. I've visited 30 countries and counting. Let's explore the world together!",
    photo_url: 'https://i.pravatar.cc/400?u=sarah@demo.com',
    profile_type: 'sugar_baby', allowance_expectation: 300,
  },
  {
    email: 'emma@demo.com', name: 'Emma', age: 29, gender: 'woman', interested_in: 'men',
    bio: "NYC chef by day, amateur photographer by night. I'll cook for you if you make me laugh.",
    photo_url: 'https://i.pravatar.cc/400?u=emma@demo.com',
    profile_type: 'regular', allowance_expectation: 0,
  },
  {
    email: 'olivia@demo.com', name: 'Olivia', age: 24, gender: 'woman', interested_in: 'everyone',
    bio: "Art grad student. Into gallery openings, farmers markets, and long talks over wine.",
    photo_url: 'https://i.pravatar.cc/400?u=olivia@demo.com',
    profile_type: 'sugar_baby', allowance_expectation: 500,
  },
  {
    email: 'ava@demo.com', name: 'Ava', age: 31, gender: 'woman', interested_in: 'men',
    bio: "Marketing director, fitness lover. I work hard and play harder. Brunch every Sunday is non-negotiable.",
    photo_url: 'https://i.pravatar.cc/400?u=ava@demo.com',
    profile_type: 'regular', allowance_expectation: 0,
  },
  {
    email: 'mia@demo.com', name: 'Mia', age: 27, gender: 'woman', interested_in: 'men',
    bio: "Nurse with a dark sense of humor. Obsessed with true crime podcasts and rescue dogs.",
    photo_url: 'https://i.pravatar.cc/400?u=mia@demo.com',
    profile_type: 'sugar_baby', allowance_expectation: 200,
  },
  {
    email: 'isabella@demo.com', name: 'Isabella', age: 25, gender: 'woman', interested_in: 'men',
    bio: "Aspiring novelist. I'll write you a character based on your worst habits.",
    photo_url: 'https://i.pravatar.cc/400?u=isabella@demo.com',
    profile_type: 'regular', allowance_expectation: 0,
  },
  {
    email: 'charlotte@demo.com', name: 'Charlotte', age: 33, gender: 'woman', interested_in: 'men',
    bio: "Attorney. I argue for a living so family dinners are never boring. Looking for someone who keeps up.",
    photo_url: 'https://i.pravatar.cc/400?u=charlotte@demo.com',
    profile_type: 'sugar_mommy', allowance_expectation: 0,
  },
  // Men profiles
  {
    email: 'liam@demo.com', name: 'Liam', age: 30, gender: 'man', interested_in: 'women',
    bio: "Architect who designs buildings by day, builds furniture by night. Big fan of tacos and terrible movies.",
    photo_url: 'https://i.pravatar.cc/400?u=liam@demo.com',
    profile_type: 'regular', allowance_expectation: 0,
  },
  {
    email: 'noah@demo.com', name: 'Noah', age: 35, gender: 'man', interested_in: 'women',
    bio: "VC partner, amateur golfer, full-time foodie. I travel for work but always come back with good stories.",
    photo_url: 'https://i.pravatar.cc/400?u=noah@demo.com',
    profile_type: 'sugar_daddy', allowance_expectation: 0,
  },
  {
    email: 'ethan@demo.com', name: 'Ethan', age: 28, gender: 'man', interested_in: 'women',
    bio: "Marine biologist. I study the ocean and occasionally surface for coffee and human contact.",
    photo_url: 'https://i.pravatar.cc/400?u=ethan@demo.com',
    profile_type: 'regular', allowance_expectation: 0,
  },
  {
    email: 'james@demo.com', name: 'James', age: 38, gender: 'man', interested_in: 'women',
    bio: "Tech founder. Building the future one startup at a time. Looking for someone grounded to keep me sane.",
    photo_url: 'https://i.pravatar.cc/400?u=james@demo.com',
    profile_type: 'sugar_daddy', allowance_expectation: 0,
  },
  {
    email: 'oliver@demo.com', name: 'Oliver', age: 27, gender: 'man', interested_in: 'everyone',
    bio: "Music producer and terrible cook. I'll feed you studio sessions if you handle the meals.",
    photo_url: 'https://i.pravatar.cc/400?u=oliver@demo.com',
    profile_type: 'regular', allowance_expectation: 0,
  },
];

console.log('Seeding database...');

// Clear existing seed data
db.exec('DELETE FROM tips; DELETE FROM messages; DELETE FROM matches; DELETE FROM swipes; DELETE FROM vacations; DELETE FROM users;');

const insertUser = db.prepare(`
  INSERT INTO users (email, password_hash, name, age, gender, interested_in, bio, photo_url, profile_type, allowance_expectation, is_setup_complete)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

const ids = {};
for (const u of users) {
  const { lastInsertRowid } = insertUser.run(u.email, HASH, u.name, u.age, u.gender, u.interested_in, u.bio, u.photo_url, u.profile_type, u.allowance_expectation);
  ids[u.email] = lastInsertRowid;
}

// Add vacations for some users
const insertVacation = db.prepare('INSERT INTO vacations (user_id, location, start_date, end_date) VALUES (?, ?, ?, ?)');

insertVacation.run(ids['sarah@demo.com'],    'Paris, France',       '2026-04-10', '2026-04-20');
insertVacation.run(ids['sarah@demo.com'],    'Barcelona, Spain',    '2026-06-01', '2026-06-10');
insertVacation.run(ids['emma@demo.com'],     'Tokyo, Japan',        '2026-04-05', '2026-04-15');
insertVacation.run(ids['olivia@demo.com'],   'New York, NY',        '2026-03-30', '2026-04-05');
insertVacation.run(ids['noah@demo.com'],     'Paris, France',       '2026-04-12', '2026-04-18');
insertVacation.run(ids['noah@demo.com'],     'London, UK',          '2026-05-01', '2026-05-07');
insertVacation.run(ids['james@demo.com'],    'Miami, FL',           '2026-04-01', '2026-04-08');
insertVacation.run(ids['james@demo.com'],    'Monaco',              '2026-05-15', '2026-05-22');
insertVacation.run(ids['charlotte@demo.com'],'New York, NY',        '2026-04-01', '2026-04-30');
insertVacation.run(ids['liam@demo.com'],     'Tokyo, Japan',        '2026-04-08', '2026-04-14');
insertVacation.run(ids['ava@demo.com'],      'Miami, FL',           '2026-04-03', '2026-04-10');

// Make some users pre-like the demo account so they match instantly on right-swipe
const demoId = ids['demo@datez.com'];
const preLikers = ['sarah@demo.com', 'emma@demo.com', 'olivia@demo.com', 'ava@demo.com', 'noah@demo.com'];

const insertSwipe = db.prepare('INSERT OR IGNORE INTO swipes (swiper_id, swiped_id, direction) VALUES (?, ?, ?)');
for (const email of preLikers) {
  insertSwipe.run(ids[email], demoId, 'like');
}

console.log('Done! Demo account: demo@datez.com / password');
console.log(`Created ${users.length} users, vacations, and pre-likes.`);
