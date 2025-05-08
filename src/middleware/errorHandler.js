// src/middleware/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  
  // Errores específicos de Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: err.errors.map(e => e.message)
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Conflicto de datos',
      details: 'Ya existe un registro con esa información'
    });
  }
  
  // Errores de Cognito
  if (err.code === 'UsernameExistsException') {
    return res.status(409).json({
      error: 'El usuario ya existe'
    });
  }
  
  if (err.code === 'NotAuthorizedException') {
    return res.status(401).json({
      error: 'Credenciales incorrectas'
    });
  }
  
  // Errores de Stripe
  if (err.type === 'StripeCardError') {
    return res.status(400).json({
      error: 'Error en el pago',
      details: err.message
    });
  }
  
  // Error genérico
  return res.status(err.statusCode || 500).json({
    error: err.message || 'Error interno del servidor'
  });
};

module.exports = errorHandler;