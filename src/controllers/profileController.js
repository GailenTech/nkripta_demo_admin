// src/controllers/profileController.js
const profileService = require('../services/profileService');
const authService = require('../services/authService');
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
    
    // For demo purposes, allow admins to get all profiles
    // This is ONLY for the demo UI, in production you would want more restrictions
    let organizationId = null;
    if (req.user.roles && !req.user.roles.includes('ADMIN')) {
      organizationId = req.user.organizationId;
    }
    
    // Get profiles from service
    const result = await profileService.listProfiles(organizationId, parseInt(page), parseInt(limit));
    
    // Format to match the expected structure in the UI
    return res.json({
      items: result.profiles,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (error) {
    logger.error('Error al listar perfiles:', error);
    next(error);
  }
};

/**
 * Crear un nuevo perfil por un administrador
 * 
 * Este endpoint permite a un administrador crear un perfil dentro de una organización.
 * El sistema crea un usuario en Cognito y un perfil en la base de datos.
 */
const createProfile = async (req, res, next) => {
  try {
    // Solo administradores pueden crear perfiles
    if (!req.user.roles.includes('ADMIN')) {
      return res.status(403).json({ message: 'No autorizado para crear perfiles' });
    }
    
    const profileData = req.body;
    
    // Verificar datos mínimos requeridos
    if (!profileData.email || !profileData.firstName || !profileData.lastName || !profileData.organizationId) {
      return res.status(400).json({ message: 'Faltan datos requeridos (email, firstName, lastName, organizationId)' });
    }
    
    // En modo desarrollo, los administradores pueden operar en cualquier organización
    if (process.env.NODE_ENV !== 'development') {
      // Verificar que el administrador pertenece a la organización o es super-admin
      const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');
      const isSameOrg = req.user.organizationId === profileData.organizationId;
      
      if (!isSuperAdmin && !isSameOrg) {
        return res.status(403).json({ message: 'No puede crear perfiles en una organización a la que no pertenece' });
      }
    }
    
    // Generar contraseña temporal aleatoria
    const temporaryPassword = `Temp${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6).toUpperCase()}!`;
    
    // Preparar datos para registro
    const userData = {
      ...profileData,
      password: temporaryPassword
    };
    
    // Crear usuario utilizando el servicio de autenticación existente
    const result = await authService.registerUser(userData);
    
    if (result && result.success) {
      // Obtener el perfil creado
      const createdProfile = await profileService.getProfile(result.profileId);
      
      // Incluir la contraseña temporal en la respuesta (para entorno de desarrollo)
      const response = {
        ...createdProfile.dataValues,
        temporaryPassword: process.env.NODE_ENV === 'development' ? temporaryPassword : undefined,
        message: 'Perfil creado correctamente'
      };
      
      return res.status(201).json(response);
    } else {
      return res.status(500).json({ message: 'Error al crear perfil' });
    }
  } catch (error) {
    logger.error('Error al crear perfil:', error);
    
    // Manejo de errores específicos
    if (error.message.includes('ya existe')) {
      return res.status(409).json({ message: 'Ya existe un usuario con este email' });
    }
    
    next(error);
  }
};

/**
 * Listar perfiles de una organización
 */
const getOrganizationMembers = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // En modo desarrollo, permitir ver perfiles de cualquier organización a administradores
    if (process.env.NODE_ENV !== 'development') {
      // Verificar si el usuario tiene permiso para ver perfiles de esta organización
      const isAdmin = req.user.roles.includes('ADMIN');
      const isSameOrg = req.user.organizationId === organizationId;
      
      if (!isAdmin && !isSameOrg) {
        return res.status(403).json({ message: 'No autorizado para ver perfiles de esta organización' });
      }
    }
    
    // Obtener perfiles de la organización
    const result = await profileService.listProfiles(organizationId, parseInt(page), parseInt(limit));
    
    // Formato compatible con la UI
    return res.json({
      items: result.profiles,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (error) {
    logger.error('Error al listar perfiles de la organización:', error);
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  listProfiles,
  createProfile,
  getOrganizationMembers
};