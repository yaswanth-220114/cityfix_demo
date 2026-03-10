# CityFix 🏙️

> AI-powered civic complaint management platform — *Report it. Track it. Fix it.*

---

## Project Structure

```
prompt_cityfix/
├── frontend/                  # React + Vite frontend
│   ├── public/                # Static assets (favicon, etc.)
│   ├── src/
│   │   ├── assets/            # Images, icons
│   │   ├── components/        # Reusable UI components
│   │   │   ├── maps/
│   │   │   └── ui/
│   │   ├── config/            # App configuration
│   │   ├── contexts/          # React context providers
│   │   ├── data/              # Static/mock data
│   │   ├── firebase/          # Firebase config & helpers
│   │   ├── pages/
│   │   │   ├── admin/         # Admin dashboard pages
│   │   │   ├── citizen/       # Citizen portal pages
│   │   │   ├── officer/       # Officer pages
│   │   │   ├── LandingPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── services/          # API service calls
│   │   ├── utils/             # Utility helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── backend/                   # Node.js + Express API server
│   ├── config/                # DB and app config
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Auth & other middleware
│   ├── models/                # Mongoose models
│   ├── routes/                # API routes
│   ├── services/              # Business logic services
│   ├── uploads/               # File upload storage
│   ├── server.js
│   └── package.json
│
├── database/                  # DB scripts / seeds
├── .env                       # Root env (shared secrets)
├── .gitignore
└── package.json               # Root orchestrator scripts
```

---

## Getting Started

### 1. Install dependencies

```bash
# Install frontend deps
cd frontend && npm install

# Install backend deps
cd backend && npm install
```

### 2. Environment Variables

- Copy `frontend/.env` and fill in your `VITE_*` keys (Google OAuth, Firebase, Gemini, EmailJS)
- Copy `backend/.env.example` → `backend/.env` and fill in MongoDB URI, JWT secret, etc.

### 3. Run the app

```bash
# Terminal 1 — Start backend
cd backend && node server.js

# Terminal 2 — Start frontend
cd frontend && npm run dev
```

Frontend runs at: **http://localhost:5173**
Backend API runs at: **http://localhost:5000** (or as set in backend `.env`)

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 19, Vite, TailwindCSS, React Router v7   |
| UI        | Lucide Icons, Recharts, React Leaflet           |
| Auth      | Google OAuth (`@react-oauth/google`), JWT       |
| AI        | Google Gemini API                               |
| Database  | Firebase Firestore + MongoDB (Mongoose)         |
| Backend   | Node.js, Express, Socket.IO                     |
| Email     | EmailJS                                         |
