// src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { registerValidationRules, loginValidationRules, validateRequest } = require('../utils/validators');

const router = express.Router();

router.post('/register', registerValidationRules, validateRequest, authController.register);
router.post('/login', loginValidationRules, validateRequest, authController.login);
router.post('/refresh', authController.refresh);
router.get('/me', auth, authController.me);

module.exports = router;
