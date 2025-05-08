// src/models/index.js
const Profile = require('./profile');
const Organization = require('./organization');
const Subscription = require('./subscription');

// Definir relaciones
Profile.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Profile, { foreignKey: 'organizationId' });

Subscription.belongsTo(Profile, { foreignKey: 'profileId' });
Profile.hasMany(Subscription, { foreignKey: 'profileId' });

Subscription.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Subscription, { foreignKey: 'organizationId' });

module.exports = {
  Profile,
  Organization,
  Subscription
};