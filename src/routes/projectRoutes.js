const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

// Routes CRUD pour les projets (toutes protégées)
router.route('/')
  .get(protect, projectController.getProjects)
  .post(protect, projectController.createProject);

router.route('/:id')
  .get(protect, projectController.getProjectById)
  .put(protect, projectController.updateProject)
  .delete(protect, projectController.deleteProject);

// Routes pour la gestion des membres
router.post('/:id/members', protect, projectController.addMember);
router.delete('/:id/members/:userId', protect, projectController.removeMember);

module.exports = router;