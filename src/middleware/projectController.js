const { Project, User, ProjectMember, Task } = require('../models');
const { Op } = require('sequelize');

// @desc    Créer un nouveau projet
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Créer le projet
    const project = await Project.create({
      name,
      description,
      ownerId: req.user.id
    });

    // Ajouter automatiquement le créateur comme membre admin
    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Erreur createProject:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du projet',
      error: error.message
    });
  }
};

// @desc    Récupérer tous les projets de l'utilisateur
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    // Récupérer les projets où l'utilisateur est membre
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'members',
          where: { id: req.user.id },
          attributes: ['id', 'name', 'email'],
          through: { attributes: ['role', 'joinedAt'] }
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Erreur getProjects:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des projets',
      error: error.message
    });
  }
};

// @desc    Récupérer un projet par son ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar'],
          through: { attributes: ['role', 'joinedAt'] }
        },
        {
          model: Task,
          as: 'tasks',
          include: [
            {
              model: User,
              as: 'assignee',
              attributes: ['id', 'name', 'email']
            }
          ]
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
        message: 'Accès non autorisé à ce projet'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Erreur getProjectById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du projet',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un projet
// @route   PUT /api/projects/:id
// @access  Private (Owner ou Admin)
const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'members',
          through: { attributes: ['role'] }
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    // Vérifier les permissions (owner ou admin)
    const userMembership = project.members.find(m => m.id === req.user.id);
    const isOwner = project.ownerId === req.user.id;
    const isAdmin = userMembership?.ProjectMember?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire ou un admin peut modifier ce projet'
      });
    }

    // Mettre à jour
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Erreur updateProject:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du projet',
      error: error.message
    });
  }
};

// @desc    Supprimer un projet
// @route   DELETE /api/projects/:id
// @access  Private (Owner uniquement)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    // Seul le propriétaire peut supprimer
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut supprimer ce projet'
      });
    }

    await project.destroy();

    res.status(200).json({
      success: true,
      message: 'Projet supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteProject:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du projet',
      error: error.message
    });
  }
};

// @desc    Ajouter un membre au projet
// @route   POST /api/projects/:id/members
// @access  Private (Owner ou Admin)
const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'members',
          through: { attributes: ['role'] }
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    // Vérifier les permissions
    const userMembership = project.members.find(m => m.id === req.user.id);
    const isOwner = project.ownerId === req.user.id;
    const isAdmin = userMembership?.ProjectMember?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire ou un admin peut ajouter des membres'
      });
    }

    // Vérifier que l'utilisateur existe
    const userToAdd = await User.findByPk(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si déjà membre
    const alreadyMember = project.members.some(m => m.id === userId);
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur est déjà membre du projet'
      });
    }

    // Ajouter le membre
    await ProjectMember.create({
      projectId: project.id,
      userId: userId,
      role: role || 'member'
    });

    // Récupérer le projet mis à jour
    const updatedProject = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: { attributes: ['role', 'joinedAt'] }
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Membre ajouté avec succès',
      data: updatedProject
    });
  } catch (error) {
    console.error('Erreur addMember:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du membre',
      error: error.message
    });
  }
};

// @desc    Retirer un membre du projet
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Owner ou Admin)
const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'members',
          through: { attributes: ['role'] }
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    // Ne peut pas retirer le propriétaire
    if (parseInt(userId) === project.ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de retirer le propriétaire du projet'
      });
    }

    // Vérifier les permissions
    const userMembership = project.members.find(m => m.id === req.user.id);
    const isOwner = project.ownerId === req.user.id;
    const isAdmin = userMembership?.ProjectMember?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire ou un admin peut retirer des membres'
      });
    }

    // Retirer le membre
    await ProjectMember.destroy({
      where: {
        projectId: project.id,
        userId: userId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Membre retiré avec succès'
    });
  } catch (error) {
    console.error('Erreur removeMember:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait du membre',
      error: error.message
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember
};