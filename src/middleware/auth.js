// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    // Verificar si hay token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar y decodificar token
    const { profile, decoded } = await authService.verifyToken(token);
    
    // Añadir información del usuario a la solicitud
    req.user = {
      profileId: profile.id,
      email: profile.email,
      organizationId: profile.organizationId,
      roles: profile.roles,
      sub: profile.sub
    };
    
    next();
  } catch (error) {
    logger.error('Error de autenticación:', error);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Middleware para verificar roles
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const hasRole = req.user.roles.some(role => roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }

    next();
  };
};

module.exports = {
  auth: authMiddleware,
  checkRole
};