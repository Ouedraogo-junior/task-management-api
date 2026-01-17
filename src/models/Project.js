const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le nom du projet est requis' },
      len: { args: [3, 255], msg: 'Le nom doit contenir entre 3 et 255 caractères' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'owner_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'projects'
});

module.exports = Project;