# 🏟️ Sports Training Academy Website
**Pamantasan ng Lungsod ng Valenzuela**  
WS101 – Web Systems and Technology I  
AY 2024-2025

---

## 📁 Project Structure

```
sports-academy/
├── api/
│   └── index.js            # Express.js REST API (Vercel serverless)
├── frontend/
│   ├── index.html          # Main single-page app
│   ├── css/style.css       # Full stylesheet
│   └── js/app.js           # Frontend logic & API calls
├── server.js               # Local dev entry point
├── vercel.json             # Vercel deployment config
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

---

## 🌐 Deploy to Vercel (Recommended)

### Step 1 – Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sports-academy.git
git push -u origin main
```

### Step 2 – Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your GitHub repository
4. Leave all settings as default — Vercel auto-detects `vercel.json`
5. Click **Deploy**
6. Your site will be live at `https://your-project.vercel.app` ✅

### Step 3 – Set Environment Variable (optional but recommended)
In Vercel dashboard → Project → Settings → Environment Variables:
```
JWT_SECRET = your_strong_random_secret_here
```

> ⚠️ **Note on SQLite + Vercel:** The database uses `/tmp` on Vercel, which is ephemeral — data resets on cold starts. This is fine for a school demo. For persistent data, consider upgrading to [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Supabase](https://supabase.com) (both have free tiers).

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
| Backend | Node.js + Express.js (Vercel Serverless) |
| Database | SQLite (via better-sqlite3, /tmp) |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Hosting | Vercel |

---

## 👥 Team

- **Gavino, John Mark C.**
- **Obugan, Jhaelord Laurence A.**
- **Espino, Carl Justin**

**BSIT 2-8**  
Instructor: Ms. Sherilene B. Pamintuan, MIT
