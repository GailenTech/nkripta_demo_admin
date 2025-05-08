// src/controllers/authController.js
const authService = require('../services/authService');
const logger = require('../utils/logger');

const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error en registro:', error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return res.json(result);
  } catch (error) {
    logger.error('Error en login:', error);
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token es requerido' });
    }
    
    const result = await authService.refreshToken(refreshToken);
    return res.json(result);
  } catch (error) {
    logger.error('Error en refresh token:', error);
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    // La información del usuario ya está en req.user gracias al middleware de autenticación
    return res.json({ user: req.user });
  } catch (error) {
    logger.error('Error en obtener usuario actual:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  me
};