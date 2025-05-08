// src/models/profile.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  middleName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferredLanguage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cognitoUsername: {
    type: DataTypes.UUID,
    allowNull: true
  },
  sub: {
    type: DataTypes.UUID,
    allowNull: true
  },
  roles: {
    type: DataTypes.ARRAY(DataTypes.ENUM('USER', 'ADMIN')),
    defaultValue: ['USER']
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  publicKey: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  privateKey: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: true
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updatedById: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'Profile',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Profile;