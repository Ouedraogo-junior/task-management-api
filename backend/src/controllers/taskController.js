const { Task, Project, User, ProjectMember } = require('../models');
const { Op } = require('sequelize');

// @desc    Créer une nouvelle tâche dans un projet
// @route   POST /api/projects/:projectId/tasks
// @access  Private (membres du projet)
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const { projectId } = req.params;

    // Vérifier que le projet existe
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'members',
          where: { id: req.user.id },
          required: false
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    // Vérifier que l'utilisateur est membre du projet
    const isMember = project.members.some(member => member.id === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être membre du projet pour créer une tâche'
      });
    }

    // Si assignedTo est fourni, vérifier que c'est un membre du projet
    if (assignedTo) {
      const assigneeMember = await ProjectMember.findOne({
        where: {
          projectId: projectId,
          userId: assignedTo
        }
      });

      if (!assigneeMember) {
        return res.status(400).json({
          success: false,
          message: 'L\'utilisateur assigné doit être membre du projet'
        });
      }
    }

    // Créer la tâche
    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user.id,
      dueDate: dueDate || null
    });

    // Récupérer la tâche avec les relations
    const taskWithRelations = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: taskWithRelations
    });
  } catch (error) {
    console.error('Erreur createTask:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la tâche',
      error: error.message
    });
  }
};

// @desc    Récupérer toutes les tâches d'un projet
// @route   GET /api/projects/:projectId/tasks
// @access  Private (membres du projet)
const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignedTo } = req.query;

    // Vérifier que le projet existe et que l'utilisateur est membre
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'members',
          where: { id: req.user.id },
          required: false
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    const isMember = project.members.some(member => member.id === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce projet'
      });
    }

    // Construire les filtres
    const whereClause = { projectId };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (assignedTo) whereClause.assignedTo = assignedTo;

    // Récupérer les tâches
    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Erreur getTasks:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tâches',
      error: error.message
    });
  }
};

// @desc    Récupérer une tâche par son ID
// @route   GET /api/tasks/:id
// @access  Private (membres du projet)
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
          include: [
            {
              model: User,
              as: 'members',
              attributes: ['id'],
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Vérifier que l'utilisateur est membre du projet
    const isMember = task.project.members.some(member => member.id === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette tâche'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Erreur getTaskById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la tâche',
      error: error.message
    });
  }
};

// @desc    Mettre à jour une tâche
// @route   PUT /api/tasks/:id
// @access  Private (membres du projet)
const updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          as: 'project',
          include: [
            {
              model: User,
              as: 'members',
              attributes: ['id'],
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Vérifier que l'utilisateur est membre du projet
    const isMember = task.project.members.some(member => member.id === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être membre du projet pour modifier cette tâche'
      });
    }

    // Si assignedTo est fourni, vérifier que c'est un membre du projet
    if (assignedTo !== undefined && assignedTo !== null) {
      const assigneeMember = await ProjectMember.findOne({
        where: {
          projectId: task.projectId,
          userId: assignedTo
        }
      });

      if (!assigneeMember) {
        return res.status(400).json({
          success: false,
          message: 'L\'utilisateur assigné doit être membre du projet'
        });
      }
    }

    // Mettre à jour les champs
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    // Récupérer la tâche mise à jour avec les relations
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    console.error('Erreur updateTask:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la tâche',
      error: error.message
    });
  }
};

// @desc    Supprimer une tâche
// @route   DELETE /api/tasks/:id
// @access  Private (créateur ou admin du projet)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          as: 'project',
          include: [
            {
              model: User,
              as: 'members',
              through: { attributes: ['role'] }
            }
          ]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Vérifier les permissions (créateur de la tâche, owner ou admin du projet)
    const userMembership = task.project.members.find(m => m.id === req.user.id);
    const isCreator = task.createdBy === req.user.id;
    const isOwner = task.project.ownerId === req.user.id;
    const isAdmin = userMembership?.ProjectMember?.role === 'admin';

    if (!isCreator && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Seul le créateur, le propriétaire ou un admin peut supprimer cette tâche'
      });
    }

    await task.destroy();

    res.status(200).json({
      success: true,
      message: 'Tâche supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteTask:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la tâche',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques d'un projet
// @route   GET /api/projects/:projectId/stats
// @access  Private (membres du projet)
const getProjectStats = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Vérifier que le projet existe et que l'utilisateur est membre
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'members',
          where: { id: req.user.id },
          required: false
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    const isMember = project.members.some(member => member.id === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce projet'
      });
    }

    // Récupérer toutes les tâches du projet
    const tasks = await Task.findAll({
      where: { projectId },
      attributes: ['status', 'priority']
    });

    // Calculer les statistiques
    const stats = {
      total: tasks.length,
      byStatus: {
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        done: tasks.filter(t => t.status === 'done').length
      },
      byPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length
      },
      completionRate: tasks.length > 0 
        ? ((tasks.filter(t => t.status === 'done').length / tasks.length) * 100).toFixed(2) + '%'
        : '0%'
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur getProjectStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getProjectStats
};