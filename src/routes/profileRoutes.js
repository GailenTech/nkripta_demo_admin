// src/routes/profileRoutes.js
const express = require('express');
const profileController = require('../controllers/profileController');
const { auth } = require('../middleware/auth');
const { profileValidationRules, validateRequest } = require('../utils/validators');

const router = express.Router();

router.get('/', auth, profileController.listProfiles);
router.get('/:profileId', auth, profileController.getProfile);
router.put('/:profileId', auth, profileValidationRules, validateRequest, profileController.updateProfile);

module.exports = router;

