const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sports_academy_secret_2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Database — use /tmp on Railway (ephemeral but works), or local for dev
const DB_PATH = process.env.RAILWAY_ENVIRONMENT
  ? '/tmp/sports_academy.db'
  : path.join(__dirname, 'database', 'sports_academy.db');

const db = new Database(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'athlete',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS athletes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    full_name TEXT NOT NULL,
    age INTEGER,
    sport TEXT,
    level TEXT,
    contact TEXT,
    coach_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    sport TEXT NOT NULL,
    country TEXT,
    experience_years INTEGER,
    bio TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS training_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    sport TEXT,
    coach_id INTEGER REFERENCES coaches(id),
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT,
    max_slots INTEGER DEFAULT 20,
    enrolled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    athlete_id INTEGER REFERENCES athletes(id),
    session_id INTEGER REFERENCES training_sessions(id),
    status TEXT DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    athlete_id INTEGER REFERENCES athletes(id),
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'paid',
    receipt_no TEXT UNIQUE,
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    athlete_id INTEGER REFERENCES athletes(id),
    session_id INTEGER REFERENCES training_sessions(id),
    score REAL,
    notes TEXT,
    attendance TEXT DEFAULT 'present',
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    athlete_id INTEGER REFERENCES athletes(id),
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    image_url TEXT
  );
`);

// Seed sample data
const coachCount = db.prepare('SELECT COUNT(*) as count FROM coaches').get();
if (coachCount.count === 0) {
  const insertCoach = db.prepare(`INSERT INTO coaches (full_name, sport, country, experience_years, bio) VALUES (?, ?, ?, ?, ?)`);
  [
    ['Carlos Moya', 'Tennis', 'Spain', 25, 'Former world No.1 and Grand Slam champion turned elite coach.'],
    ['Jürgen Klopp', 'Football', 'Germany', 20, 'High-intensity pressing and motivational coaching style.'],
    ['Maria Santos', 'Gymnastics', 'Philippines', 18, 'World-renowned gymnastics performance specialist.'],
    ['Kenji Tanaka', 'Athletics', 'Japan', 15, 'Mental conditioning and technical precision expert.'],
  ].forEach(c => insertCoach.run(...c));

  const insertSession = db.prepare(`INSERT INTO training_sessions (title, sport, coach_id, date, time, location, max_slots) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  [
    ['Advanced Tennis Techniques', 'Tennis', 1, '2025-06-10', '08:00', 'Court A – PLV Sports Complex', 15],
    ['Football Conditioning Camp', 'Football', 2, '2025-06-12', '14:00', 'Main Field – PLV', 30],
    ['Gymnastics Foundations', 'Gymnastics', 3, '2025-06-14', '09:00', 'Gymnasium Hall', 20],
    ['Speed & Agility Boot Camp', 'Athletics', 4, '2025-06-18', '07:00', 'Track Oval', 25],
  ].forEach(s => insertSession.run(...s));
}

// AUTH Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────
app.post('/api/register', (req, res) => {
  const { full_name, email, password, role } = req.body;
  if (!full_name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(full_name, email, hash, role || 'athlete');
    const token = jwt.sign({ id: result.lastInsertRowid, email, role: role || 'athlete' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastInsertRowid, full_name, email, role: role || 'athlete' } });
  } catch (e) {
    res.status(400).json({ error: 'Email already registered' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } });
});

// ─── ATHLETES ────────────────────────────────────────────────────────────────
app.get('/api/athletes', authenticate, (req, res) => {
  res.json(db.prepare('SELECT * FROM athletes ORDER BY created_at DESC').all());
});
app.post('/api/athletes', authenticate, (req, res) => {
  const { full_name, age, sport, level, contact } = req.body;
  const r = db.prepare('INSERT INTO athletes (user_id, full_name, age, sport, level, contact) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, full_name, age, sport, level, contact);
  res.json({ id: r.lastInsertRowid, ...req.body });
});
app.put('/api/athletes/:id', authenticate, (req, res) => {
  const { full_name, age, sport, level, contact } = req.body;
  db.prepare('UPDATE athletes SET full_name=?, age=?, sport=?, level=?, contact=? WHERE id=?').run(full_name, age, sport, level, contact, req.params.id);
  res.json({ success: true });
});
app.delete('/api/athletes/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM athletes WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── SESSIONS ────────────────────────────────────────────────────────────────
app.get('/api/sessions', (req, res) => {
  res.json(db.prepare('SELECT ts.*, c.full_name as coach_name FROM training_sessions ts LEFT JOIN coaches c ON ts.coach_id = c.id ORDER BY date ASC').all());
});
app.post('/api/sessions', authenticate, (req, res) => {
  const { title, sport, coach_id, date, time, location, max_slots } = req.body;
  const r = db.prepare('INSERT INTO training_sessions (title, sport, coach_id, date, time, location, max_slots) VALUES (?,?,?,?,?,?,?)').run(title, sport, coach_id, date, time, location, max_slots);
  res.json({ id: r.lastInsertRowid });
});

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
app.get('/api/applications', authenticate, (req, res) => {
  res.json(db.prepare('SELECT a.*, ath.full_name as athlete_name, ts.title as session_title FROM applications a JOIN athletes ath ON a.athlete_id = ath.id JOIN training_sessions ts ON a.session_id = ts.id').all());
});
app.post('/api/applications', authenticate, (req, res) => {
  const { athlete_id, session_id } = req.body;
  const r = db.prepare('INSERT INTO applications (athlete_id, session_id) VALUES (?,?)').run(athlete_id, session_id);
  db.prepare('UPDATE training_sessions SET enrolled = enrolled + 1 WHERE id = ?').run(session_id);
  res.json({ id: r.lastInsertRowid });
});

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
app.get('/api/payments', authenticate, (req, res) => {
  res.json(db.prepare('SELECT p.*, a.full_name as athlete_name FROM payments p LEFT JOIN athletes a ON p.athlete_id = a.id ORDER BY paid_at DESC').all());
});
app.post('/api/payments', authenticate, (req, res) => {
  const { athlete_id, amount, type } = req.body;
  const receipt_no = 'RCP-' + Date.now();
  const r = db.prepare('INSERT INTO payments (athlete_id, amount, type, receipt_no) VALUES (?,?,?,?)').run(athlete_id, amount, type, receipt_no);
  res.json({ id: r.lastInsertRowid, receipt_no });
});

// ─── PERFORMANCE ─────────────────────────────────────────────────────────────
app.get('/api/performance', authenticate, (req, res) => {
  res.json(db.prepare('SELECT p.*, a.full_name as athlete_name FROM performance p JOIN athletes a ON p.athlete_id = a.id ORDER BY recorded_at DESC').all());
});
app.post('/api/performance', authenticate, (req, res) => {
  const { athlete_id, session_id, score, notes, attendance } = req.body;
  const r = db.prepare('INSERT INTO performance (athlete_id, session_id, score, notes, attendance) VALUES (?,?,?,?,?)').run(athlete_id, session_id, score, notes, attendance);
  res.json({ id: r.lastInsertRowid });
});

// ─── COACHES ─────────────────────────────────────────────────────────────────
app.get('/api/coaches', (req, res) => {
  res.json(db.prepare('SELECT * FROM coaches').all());
});

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
app.get('/api/achievements', (req, res) => {
  res.json(db.prepare('SELECT ach.*, a.full_name as athlete_name FROM achievements ach LEFT JOIN athletes a ON ach.athlete_id = a.id ORDER BY date DESC').all());
});

// ─── STATS ────────────────────────────────────────────────────────────────────
app.get('/api/stats', authenticate, (req, res) => {
  const athletes = db.prepare('SELECT COUNT(*) as count FROM athletes').get().count;
  const sessions = db.prepare('SELECT COUNT(*) as count FROM training_sessions').get().count;
  const payments = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM payments').get().total;
  const applications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  res.json({ athletes, sessions, payments, applications });
});

// Catch-all → serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => console.log(`🏟️  Sports Academy running on port ${PORT}`));
