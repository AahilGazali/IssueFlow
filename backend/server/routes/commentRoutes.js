const express = require('express');
const router = express.Router();
const {
  createComment,
  getComments,
  getComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { authenticateUser } = require('../middleware/supabaseAuthMiddleware');

// All routes require authentication
router.use(authenticateUser);

router.post('/', createComment);
router.get('/', getComments);
router.get('/:id', getComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

module.exports = router;
