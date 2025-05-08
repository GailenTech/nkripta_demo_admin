// src/controllers/profileController.js
const profileService = require('../services/profileService');
const logger = require('../utils/logger');

const getProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    
    // Verificar si el usuario tiene permiso para ver este perfil
    if (req.user.profileId !== profileId && !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({ message: 'No autorizado para ver este perfil' });
    }
    
    const profile = await profileService.getProfile(profileId);
    return res.json(profile);
  } catch (error) {
    logger.error('Error al obtener perfil:', error);
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    
    // Verificar si el usuario tiene permiso para actualizar este perfil
    if (req.user.profileId !== profileId && !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({ message: 'No autorizado para actualizar este perfil' });
    }
    
    const profile = await profileService.updateProfile(profileId, req.body, req.user.profileId);
    return res.json(profile);
  } catch (error) {
    logger.error('Error al actualizar perfil:', error);
    next(error);
  }
};

const listProfiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const organizationId = req.user.organizationId;
    
    const result = await profileService.listProfiles(organizationId, parseInt(page), parseInt(limit));
    return res.json(result);
  } catch (error) {
    logger.error('Error al listar perfiles:', error);
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  listProfiles
};