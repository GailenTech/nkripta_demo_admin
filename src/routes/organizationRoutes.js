// src/routes/organizationRoutes.js
const express = require('express');
const organizationController = require('../controllers/organizationController');
const { auth, checkRole } = require('../middleware/auth');
const { organizationValidationRules, validateRequest } = require('../utils/validators');

const router = express.Router();

router.post('/', auth, checkRole(['ADMIN']), organizationValidationRules, validateRequest, organizationController.createOrganization);
router.get('/:organizationId', auth, organizationController.getOrganization);
router.put('/:organizationId', auth, checkRole(['ADMIN']), organizationValidationRules, validateRequest, organizationController.updateOrganization);
router.get('/:organizationId/members', auth, organizationController.getOrganizationMembers);

module.exports = router;
