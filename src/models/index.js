// src/models/index.js
const Profile = require('./profile');
const Organization = require('./organization');

// Definir relaciones
Profile.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Profile, { foreignKey: 'organizationId' });

module.exports = {
  Profile,
  Organization
};