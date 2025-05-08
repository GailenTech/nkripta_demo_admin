// src/routes/subscriptionRoutes.js
const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { auth } = require('../middleware/auth');
const { subscriptionValidationRules, validateRequest } = require('../utils/validators');

const router = express.Router();

router.post('/customers', auth, subscriptionController.createCustomer);
router.post('/subscriptions', auth, subscriptionValidationRules, validateRequest, subscriptionController.createSubscription);
router.get('/subscriptions/:subscriptionId', auth, subscriptionController.getSubscription);
router.delete('/subscriptions/:subscriptionId', auth, subscriptionController.cancelSubscription);
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

module.exports = router;