// scripts/create-test-data.js
// Script para crear datos de prueba iniciales en la base de datos

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { Organization, Profile } = require('../src/models');
const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

// Creación de la organización predeterminada
async function createDefaultOrganization() {
  try {
    const defaultOrg = await Organization.findOrCreate({
      where: { id: '00000000-0000-0000-0000-000000000000' },
      defaults: {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Organización de Prueba',
        description: 'Esta es la organización predeterminada para pruebas',
        slug: 'test-org',
        email: 'info@test-org.example.com',
        phone: '+123456789',
        website: 'https://test-org.example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    if (defaultOrg[1]) {
      console.log('Organización predeterminada creada.');
    } else {
      console.log('La organización predeterminada ya existía.');
    }

    return defaultOrg[0];
  } catch (error) {
    logger.error('Error al crear la organización predeterminada:', error);
    throw error;
  }
}

// Creación de perfil para el usuario admin
async function createAdminProfile(organizationId) {
  try {
    const adminProfile = await Profile.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        id: uuidv4(),
        firstName: 'Admin',
        lastName: 'Usuario',
        email: 'admin@example.com',
        organizationId,
        roles: ['ADMIN', 'USER'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    if (adminProfile[1]) {
      console.log('Perfil de administrador creado.');
    } else {
      console.log('El perfil de administrador ya existía.');
    }

    return adminProfile[0];
  } catch (error) {
    logger.error('Error al crear el perfil de administrador:', error);
    throw error;
  }
}

async function createTestData() {
  try {
    console.log('Creando datos de prueba...');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');
    
    // Crear organización predeterminada
    const organization = await createDefaultOrganization();
    
    // Crear usuario administrador
    await createAdminProfile(organization.id);
    
    console.log('Creación de datos de prueba completada.');
  } catch (error) {
    console.error('Error al crear datos de prueba:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestData()
    .then(() => {
      console.log('Script completado exitosamente.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error en el script:', err);
      process.exit(1);
    });
}

module.exports = { createTestData };