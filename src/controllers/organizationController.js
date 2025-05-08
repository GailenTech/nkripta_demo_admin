// src/controllers/organizationController.js
const organizationService = require('../services/organizationService');
const logger = require('../utils/logger');

const createOrganization = async (req, res, next) => {
  try {
    // Solo administradores pueden crear organizaciones
    if (!req.user.roles.includes('ADMIN')) {
      return res.status(403).json({ message: 'No autorizado para crear organizaciones' });
    }
    
    const organization = await organizationService.createOrganization(req.body, req.user.profileId);
    return res.status(201).json(organization);
  } catch (error) {
    logger.error('Error al crear organización:', error);
    next(error);
  }
};

const getOrganization = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    
    // Verificar que el usuario pertenezca a esta organización o sea admin
    if (req.user.organizationId !== organizationId && !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({ message: 'No autorizado para ver esta organización' });
    }
    
    const organization = await organizationService.getOrganization(organizationId);
    return res.json(organization);
  } catch (error) {
    logger.error('Error al obtener organización:', error);
    next(error);
  }
};

const updateOrganization = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    
    // Verificar que el usuario pertenezca a esta organización y sea admin
    if ((req.user.organizationId !== organizationId || !req.user.roles.includes('ADMIN'))) {
      return res.status(403).json({ message: 'No autorizado para actualizar esta organización' });
    }
    
    const organization = await organizationService.updateOrganization(organizationId, req.body, req.user.profileId);
    return res.json(organization);
  } catch (error) {
    logger.error('Error al actualizar organización:', error);
    next(error);
  }
};

const getOrganizationMembers = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Verificar que el usuario pertenezca a esta organización
    if (req.user.organizationId !== organizationId && !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({ message: 'No autorizado para ver los miembros de esta organización' });
    }
    
    const result = await organizationService.getOrganizationMembers(organizationId, parseInt(page), parseInt(limit));
    return res.json(result);
  } catch (error) {
    logger.error('Error al obtener miembros de la organización:', error);
    next(error);
  }
};

module.exports = {
  createOrganization,
  getOrganization,
  updateOrganization,
  getOrganizationMembers
};