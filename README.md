# MemeFun

A Pump.fun-inspired Indian memecoin launchpad and trading simulator using INR (no real blockchain or wallets).

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Framer Motion + PWA
- Backend: FastAPI + SQLite/JSON

## Features
- Launch, explore, and trade mock memecoins
- Animated, Indian-themed UI
- PWA support

## Getting Started

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # or pip install fastapi uvicorn[standard] aiosqlite
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:8000](http://localhost:8000)

## Directory Structure
- /frontend → React app
- /backend → FastAPI app
- /tokens.json → Token data

## Deployment
- Frontend: Netlify/Vercel
- Backend: Railway/Render 