const express = require('express');
const router = express.Router();
const {
  list,
  unreadCount,
  markRead,
  markAllRead,
} = require('../controllers/notificationController');
const { authenticateUser } = require('../middleware/supabaseAuthMiddleware');

router.use(authenticateUser);

router.get('/', list);
router.get('/unread-count', unreadCount);
router.post('/:id/read', markRead);
router.post('/read-all', markAllRead);

module.exports = router;
