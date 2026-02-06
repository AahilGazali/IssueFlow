const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getDeletedProjects,
  restoreProject,
  permanentDeleteProject,
  addMember,
  inviteMember,
  toggleStar,
  getMembers,
} = require('../controllers/projectController');
const { authenticateUser } = require('../middleware/supabaseAuthMiddleware');

// All routes require authentication
router.use(authenticateUser);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/deleted', getDeletedProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/restore', restoreProject);
router.post('/:id/permanent-delete', permanentDeleteProject);
// Specific :id routes (order doesn't affect POST/GET, but kept together)
router.post('/:id/invite', inviteMember);
router.get('/:id/members', getMembers);
router.post('/:id/members', addMember);
router.post('/:id/star', toggleStar);

module.exports = router;
