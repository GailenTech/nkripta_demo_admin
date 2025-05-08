// src/utils/validators.js
const { body, param, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerValidationRules = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('firstName').notEmpty().withMessage('El nombre es requerido'),
  body('lastName').notEmpty().withMessage('El apellido es requerido'),
  body('organizationId').isUUID().withMessage('ID de organización inválido')
];

const loginValidationRules = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
];

const organizationValidationRules = [
  body('name').notEmpty().withMessage('El nombre es requerido').isLength({ max: 100 }),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('phone').optional().isLength({ max: 15 }).withMessage('Teléfono demasiado largo')
];

const profileValidationRules = [
  body('firstName').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('lastName').optional().notEmpty().withMessage('El apellido no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Email inválido')
];

const subscriptionValidationRules = [
  body('paymentMethodId').notEmpty().withMessage('El método de pago es requerido'),
  body('planId').notEmpty().withMessage('El plan es requerido')
];

module.exports = {
  validateRequest,
  registerValidationRules,
  loginValidationRules,
  organizationValidationRules,
  profileValidationRules,
  subscriptionValidationRules
};