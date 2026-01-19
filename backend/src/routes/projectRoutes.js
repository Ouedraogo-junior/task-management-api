const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
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

// Routes pour les tâches d'un projet
router.route('/:projectId/tasks')
  .get(protect, taskController.getTasks)
  .post(protect, taskController.createTask);

// Route pour les statistiques du projet
router.get('/:projectId/stats', protect, taskController.getProjectStats);

module.exports = router;