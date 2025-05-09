// src/routes/profileRoutes.js
const express = require('express');
const profileController = require('../controllers/profileController');
const { auth, checkRole } = require('../middleware/auth');
const { profileValidationRules, createProfileValidationRules, validateRequest } = require('../utils/validators');

const router = express.Router();

router.get('/', auth, profileController.listProfiles);
router.post('/', auth, checkRole(['ADMIN']), createProfileValidationRules, validateRequest, profileController.createProfile);
router.get('/:profileId', auth, profileController.getProfile);
router.put('/:profileId', auth, profileValidationRules, validateRequest, profileController.updateProfile);

module.exports = router;

