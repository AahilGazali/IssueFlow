const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  logout,
  updatePassword,
  updateProfile,
} = require('../controllers/authController');
const { authenticateUser } = require('../middleware/supabaseAuthMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateUser, getCurrentUser);
router.post('/logout', authenticateUser, logout);
router.post('/password', authenticateUser, updatePassword);
router.post('/profile', authenticateUser, updateProfile);

module.exports = router;
