# NGO Donation & Volunteer Management System

A full-stack web app to track donors, donations, volunteers, activities, and fund utilization with SQL analytics.

**SDG 17 – Partnerships for the Goals**

---

## Features
- 📊 Dashboard with live stats
- 🤝 Donor management (add, view, delete)
- 💰 Donation tracking with payment modes
- 👥 Volunteer registration & status
- 📅 Activity / event management
- 📂 Fund utilization tracking
- 🔍 SQL Analytics with charts

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3)
- **Frontend**: Vanilla HTML/CSS/JS

---

## Deploy on Railway (New App)

### Option 1: Via GitHub (Recommended)
1. Push this folder to a **new GitHub repo**
2. Go to [railway.app](https://railway.app) → **New Project**
3. Choose **Deploy from GitHub repo**
4. Select your new repo
5. Railway auto-detects Node.js and deploys
6. Click **Generate Domain** → you get a link like `yourapp.up.railway.app`

### Option 2: Via Railway CLI
```bash
npm install -g @railway/cli
railway login
railway init        # creates new project
railway up          # deploys
railway domain      # generates your URL
```

---

## Run Locally
```bash
npm install
npm start
# Open http://localhost:3000
```
