const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// Routes pour les tâches individuelles
router.route('/:id')
  .get(protect, taskController.getTaskById)
  .put(protect, taskController.updateTask)
  .delete(protect, taskController.deleteTask);

module.exports = router;