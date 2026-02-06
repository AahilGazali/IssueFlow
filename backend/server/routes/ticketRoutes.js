const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
} = require('../controllers/ticketController');
const { authenticateUser } = require('../middleware/supabaseAuthMiddleware');

// All routes require authentication
router.use(authenticateUser);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/stats', getTicketStats);
router.get('/:id', getTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

module.exports = router;
