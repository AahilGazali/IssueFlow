const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
if (corsOrigins.length === 0) corsOrigins.push('http://localhost:5173');

// Middleware
app.use(helmet());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
