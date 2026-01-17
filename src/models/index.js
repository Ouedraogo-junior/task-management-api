const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');
const ProjectMember = require('./ProjectMember');

// Relations User <-> Project (propriétaire)
User.hasMany(Project, { 
  foreignKey: 'ownerId', 
  as: 'ownedProjects',
  onDelete: 'CASCADE'
});
Project.belongsTo(User, { 
  foreignKey: 'ownerId', 
  as: 'owner'
});

// Relations User <-> Project (membres) - Many-to-Many
User.belongsToMany(Project, { 
  through: ProjectMember, 
  foreignKey: 'userId',
  otherKey: 'projectId',
  as: 'projects'
});
Project.belongsToMany(User, { 
  through: ProjectMember, 
  foreignKey: 'projectId',
  otherKey: 'userId',
  as: 'members'
});

// Relations Project <-> Task
Project.hasMany(Task, { 
  foreignKey: 'projectId', 
  as: 'tasks',
  onDelete: 'CASCADE'
});
Task.belongsTo(Project, { 
  foreignKey: 'projectId', 
  as: 'project'
});

// Relations User <-> Task (créateur)
User.hasMany(Task, { 
  foreignKey: 'createdBy', 
  as: 'createdTasks',
  onDelete: 'CASCADE'
});
Task.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator'
});

// Relations User <-> Task (assigné)
User.hasMany(Task, { 
  foreignKey: 'assignedTo', 
  as: 'assignedTasks',
  onDelete: 'SET NULL'
});
Task.belongsTo(User, { 
  foreignKey: 'assignedTo', 
  as: 'assignee'
});

module.exports = {
  User,
  Project,
  Task,
  ProjectMember
};