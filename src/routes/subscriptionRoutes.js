// src/routes/subscriptionRoutes.js
const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { auth, checkRole } = require('../middleware/auth');
const { subscriptionValidationRules, validateRequest } = require('../utils/validators');

const router = express.Router();

// Rutas centrales y consistentes para suscripciones
// ------------------------------------------------

// Ruta principal para compatibilidad con el Admin UI
router.get('/', auth, subscriptionController.getAllSubscriptions);

// Listar y crear suscripciones
router.get('/subscriptions', auth, subscriptionController.getAllSubscriptions);
router.post('/subscriptions', auth, subscriptionValidationRules, validateRequest, subscriptionController.createSubscription);

// Operaciones sobre una suscripción específica
router.get('/subscriptions/:subscriptionId', auth, subscriptionController.getSubscription);
router.post('/subscriptions/:subscriptionId/cancel', auth, subscriptionController.cancelSubscription);

// Suscripciones por perfil
router.get('/profiles/:profileId/subscriptions', auth, subscriptionController.getProfileSubscriptions);

// Gestión de clientes de Stripe
router.post('/customers', auth, subscriptionController.createCustomer);

// Métodos de pago
router.get('/payment-methods/:paymentMethodId', auth, subscriptionController.getPaymentMethod);

// Planes y cupones
router.get('/plans', auth, subscriptionController.getAvailablePlans);
router.get('/coupons', auth, checkRole(['ADMIN']), subscriptionController.getAvailableCoupons);

// Webhooks de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// ------------------------------------------------
// Rutas alternativas para compatibilidad con tests
// ------------------------------------------------

// Compatibilidad con tests existentes - todas redirigen a las rutas principales
router.get('/profiles/:profileId', auth, (req, res) => {
  req.redirectedFrom = 'profiles/:profileId';
  subscriptionController.getProfileSubscriptions(req, res);
});

module.exports = router;