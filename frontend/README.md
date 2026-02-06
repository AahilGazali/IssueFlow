# IssueFlow Frontend

Modern React frontend for the IssueFlow application built with Vite, React Router, and Axios.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Context API** - State management

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Modal.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── ProjectContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   └── ProjectDetail.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Run the Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## Features

### Authentication
- User registration
- User login
- Protected routes
- Token-based authentication
- Auto-logout on token expiration

### Project Management
- View all projects
- Create new projects
- View project details
- Project-based access control

### Ticket Management (Kanban Board)
- Create tickets with priority levels (low, medium, high)
- Drag-and-drop workflow (todo → in_progress → done)
- Update ticket status
- Delete tickets
- View ticket details

### Comments
- Add comments to tickets
- View all comments for a ticket
- Real-time comment updates

## API Integration

The frontend communicates with the backend API through the `api.js` service layer:

- **Auth API**: Registration, login, logout, get current user
- **Projects API**: CRUD operations for projects
- **Tickets API**: CRUD operations for tickets
- **Comments API**: CRUD operations for comments

All API calls include automatic token injection and error handling.

## Routing

- `/` - Redirects to dashboard
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Projects dashboard (protected)
- `/project/:id` - Project detail with Kanban board (protected)

## Styling

The application uses custom CSS with:
- Modern gradient header
- Card-based layouts
- Responsive design
- Kanban board styling
- Modal components
- Form styling

## State Management

- **AuthContext**: Manages user authentication state
- **ProjectContext**: Manages projects and current project state

## Development

The frontend uses Vite for fast development with:
- Hot Module Replacement (HMR)
- Fast refresh
- Proxy configuration for API calls

## Production Build

After building, the `dist/` folder contains the production-ready files that can be served by any static file server.
