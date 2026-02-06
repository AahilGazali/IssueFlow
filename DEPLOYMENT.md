# IssueFlow – Deployment Checklist

Use this checklist when deploying the app (e.g. Vercel + Railway, or Vercel + Render).

---

## 1. Supabase (Database & Auth)

- [ ] **Supabase project** is created and you have:
  - **Project URL** (e.g. `https://xxxx.supabase.co`)
  - **anon key**
  - **service_role key** (Settings → API; keep secret, backend only)

- [ ] **Run these SQL scripts** in Supabase **SQL Editor** (in this order if starting fresh):

  | Order | File | Purpose |
  |-------|------|--------|
  | 1 | Create `projects` and `project_members` tables (see your Supabase docs or existing schema) | Core tables |
  | 2 | `backend/server/sql/add-tickets-columns.sql` | Tickets table + optional columns (includes `created_by`) |
| 3 | `backend/server/sql/add-tickets-created-by.sql` | Add `created_by` if missing |
| 4 | `backend/server/sql/fix-tickets-priority-constraint.sql` | Fix `tickets_priority_check` (allow lowest, low, medium, high, highest) |
| 5 | `backend/server/sql/comments-table.sql` | Comments on tickets |
| 6 | `backend/server/sql/notifications-table.sql` | In-app notifications |

  Ensure `tickets` has at least: `id` (UUID), `project_id`, `title`, `assignee`, `created_by`, and any columns your app uses. Run `add-tickets-columns.sql` for a full set of optional columns.

---

## 2. Backend (Node/Express)

- [ ] **Environment variables** (e.g. on Railway, Render, or in `backend/server/.env`):

  ```env
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  PORT=3000
  CORS_ORIGIN=https://your-frontend-domain.com
  ```

  - **CORS_ORIGIN**: Comma-separated list of allowed frontend origins (e.g. `https://yourapp.vercel.app`). No trailing slash.

- [ ] **Start command**: `node backend/server/server.js` (from repo root) or `node server.js` (from `backend/server`).

- [ ] **Health check**: `GET /health` should return 200. Use this for platform health checks.

- [ ] **.env is not committed** (already in `.gitignore`). On hosting, set env vars in the dashboard.

---

## 3. Frontend (React/Vite)

- [ ] **Build**: From repo root or `frontend/` run:

  ```bash
  cd frontend && npm install && npm run build
  ```

- [ ] **Environment variable** (set at build time, e.g. in Vercel):

  ```env
  VITE_API_URL=https://your-backend-api.com
  ```

  - In **development** you can leave it unset (Vite proxy to `localhost:3000`).
  - In **production** it must be the public URL of your backend (no trailing slash).

- [ ] **Serve** the `frontend/dist` folder (Vercel/Netlify do this automatically for Vite).

- [ ] **Single-page app (SPA)**: If the server doesn’t support SPA fallback, configure redirects so all routes serve `index.html` (e.g. Vercel `rewrites` or Netlify `_redirects`).

---

## 4. Post-Deploy Checks

- [ ] **Backend**: Open `https://your-api.com/health` → should return `{"message":"Server is running"}`.
- [ ] **Frontend**: Open the app URL → Login/Register works.
- [ ] **Projects**: Create a project and a ticket.
- [ ] **Comments**: Open a ticket and add a comment (no “Ticket not found” or “created_by does not exist”).
- [ ] **Notifications**: Bell icon shows and opens; assign/comment notifications appear when expected.
- [ ] **Settings**: Notification toggles and profile/display name save correctly.

---

## 5. Optional / Later

- **HTTPS**: Use HTTPS for frontend and backend in production.
- **Rate limiting**: Add rate limiting on auth and API routes if needed.
- **Logging**: Use a logger and avoid logging secrets.
- **Secrets**: Never commit `.env` or service_role key; use the host’s env/config.

---

## Quick reference

| Item | Dev | Production |
|------|-----|------------|
| Backend .env | `backend/server/.env` | Host env vars (e.g. Railway/Render) |
| Frontend API URL | Unset (proxy) or `http://localhost:3000` | `VITE_API_URL=https://your-api.com` |
| CORS | `http://localhost:5173,http://localhost:3000` | `CORS_ORIGIN=https://your-app.com` |
