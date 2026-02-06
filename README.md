# Bug Tracker - Full Stack Application

Industry-grade Bug/Issue Tracker with React frontend and Node.js/Express backend using Supabase.

## Project Structure

```
Bug-Tracker/
├── backend/
│   └── server/          # Backend API (Node.js + Express + Supabase)
├── frontend/            # Frontend (React + Vite)
├── start-backend.bat    # Start backend only
├── start-frontend.bat   # Start frontend only
├── start-all.bat        # Start both servers
└── package.json         # Root package.json for backend
```

## Quick Start

### Option 1: Start Both Servers (Recommended)

Double-click `start-all.bat` or run:
```bash
start-all.bat
```

This will:
- Install dependencies if needed
- Start backend on http://localhost:3000
- Start frontend on http://localhost:5173

### Option 2: Start Servers Separately

**Backend:**
```bash
start-backend.bat
# or
npm start
```

**Frontend:**
```bash
start-frontend.bat
# or
cd frontend
npm install
npm run dev
```

## Setup Requirements

### 1. Backend Setup

1. Create `.env` file in `backend/server/`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
```

2. Set up Supabase database tables (see backend/README.md for SQL schema)

### 2. Frontend Setup

1. Create `.env` file in `frontend/`:
```env
VITE_API_URL=http://localhost:3000
```

## Installation

### Backend Dependencies
```bash
npm install
```

### Frontend Dependencies
```bash
cd frontend
npm install
```

## Running the Application

1. **Start Backend:**
   - Backend runs on `http://localhost:3000`
   - API endpoints available at `/api/*`

2. **Start Frontend:**
   - Frontend runs on `http://localhost:5173`
   - Opens automatically in your browser

3. **Access the App:**
   - Open http://localhost:5173 in your browser
   - Register a new account or login
   - Start creating projects and tickets!

## Features

### Backend
- ✅ Supabase authentication
- ✅ Project management
- ✅ Ticket (issue) management
- ✅ Kanban workflow (todo, in_progress, done)
- ✅ Comments on tickets
- ✅ Protected routes with JWT

### Frontend
- ✅ User authentication (login/register)
- ✅ Project dashboard
- ✅ Kanban board for tickets
- ✅ Ticket creation and management
- ✅ Comments system
- ✅ Responsive design
- ✅ Modern UI

## Tech Stack

### Backend
- Node.js
- Express.js
- Supabase (PostgreSQL + Auth)
- @supabase/supabase-js
- dotenv, cors, helmet

### Frontend
- React 18
- Vite
- React Router
- Axios
- Context API

## Troubleshooting

1. **Backend won't start:**
   - Check if `.env` file exists in `backend/server/`
   - Verify Supabase credentials are correct
   - Ensure port 3000 is not in use

2. **Frontend won't start:**
   - Check if `.env` file exists in `frontend/`
   - Verify `VITE_API_URL` is set correctly
   - Ensure port 5173 is not in use

3. **API calls failing:**
   - Verify backend is running on port 3000
   - Check browser console for errors
   - Verify CORS is enabled in backend

## Development

- Backend: `npm run dev` (uses nodemon for auto-reload)
- Frontend: `npm run dev` (Vite HMR enabled)

## Production Build

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full deployment checklist (Supabase SQL, env vars, CORS, and post-deploy checks).

### Backend
```bash
npm start
```
Set `CORS_ORIGIN` to your frontend URL(s) when deploying (e.g. `https://yourapp.vercel.app`).

### Frontend
```bash
cd frontend
npm run build
```
Set `VITE_API_URL` to your backend API URL at build time (e.g. `https://api.yourapp.com`). Serve the `dist/` folder.

## License

ISC
