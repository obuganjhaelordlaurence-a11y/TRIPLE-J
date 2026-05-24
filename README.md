# 🏟️ Sports Training Academy Website
**Pamantasan ng Lungsod ng Valenzuela**  
WS101 – Web Systems and Technology I  
AY 2024-2025

---

## 📁 Project Structure

```
sports-academy/
├── backend/
│   └── server.js          # Express.js REST API
├── frontend/
│   ├── index.html          # Main single-page app
│   ├── css/style.css       # Full stylesheet
│   └── js/app.js           # Frontend logic & API calls
├── database/
│   └── (sports_academy.db auto-created on first run)
├── package.json
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher

### Steps

```bash
# 1. Extract the project folder
cd sports-academy

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open browser
# http://localhost:3000
```

The SQLite database is created automatically at `database/sports_academy.db` on first run, with sample coaches and sessions pre-loaded.

---

## 🌐 Publishing / Deployment

### Option A – Railway (Free, Recommended)
1. Go to [railway.app](https://railway.app) and sign up
2. Click **New Project → Deploy from GitHub**
3. Push this folder to a GitHub repo, connect it
4. Set the start command: `node backend/server.js`
5. Railway provides a public URL automatically

### Option B – Render (Free Tier)
1. Go to [render.com](https://render.com)
2. New → **Web Service** → Connect your GitHub repo
3. Build Command: `npm install`
4. Start Command: `node backend/server.js`
5. Free tier spins down after inactivity (spins back up on request)

### Option C – Heroku
```bash
# Install Heroku CLI, then:
heroku create sports-training-academy
git push heroku main
```

### Option D – VPS (DigitalOcean, Linode)
```bash
# On your server:
git clone <your-repo>
cd sports-academy
npm install
# Use PM2 to keep it running:
npm install -g pm2
pm2 start backend/server.js --name "sports-academy"
pm2 startup && pm2 save
```

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/register | Create account |
| POST | /api/login | Login |
| GET | /api/athletes | List athletes (auth) |
| POST | /api/athletes | Add athlete (auth) |
| PUT | /api/athletes/:id | Update athlete (auth) |
| DELETE | /api/athletes/:id | Delete athlete (auth) |
| GET | /api/sessions | List training sessions |
| POST | /api/sessions | Create session (auth) |
| GET | /api/applications | List applications (auth) |
| POST | /api/applications | Apply for session (auth) |
| GET | /api/payments | List payments (auth) |
| POST | /api/payments | Record payment (auth) |
| GET | /api/performance | Performance records (auth) |
| POST | /api/performance | Log performance (auth) |
| GET | /api/coaches | List coaches |
| GET | /api/achievements | List achievements |
| GET | /api/stats | Dashboard stats (auth) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (JSON Web Tokens) + bcrypt |

---

## 👥 Team

- **Gavino, John Mark C.**
- **Obugan, Jhaelord Laurence A.**
- **Espino, Carl Justin**

**BSIT 2-8**  
Instructor: Ms. Sherilene B. Pamintuan, MIT
