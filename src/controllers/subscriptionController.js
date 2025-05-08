// src/controllers/subscriptionController.js
const subscriptionService = require('../services/subscriptionService');
const { stripe } = require('../config/stripe');
const logger = require('../utils/logger');

const createCustomer = async (req, res, next) => {
  try {
    const result = await subscriptionService.createCustomer(req.user.profileId);
    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error al crear cliente en Stripe:', error);
    next(error);
  }
};

const createSubscription = async (req, res, next) => {
  try {
    const { paymentMethodId, planId } = req.body;
    
    const result = await subscriptionService.createSubscription(
      req.user.profileId,
      req.user.organizationId,
      paymentMethodId,
      planId
    );
    
    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error al crear suscripción:', error);
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const result = await subscriptionService.cancelSubscription(subscriptionId);
    return res.json(result);
  } catch (error) {
    logger.error('Error al cancelar suscripción:', error);
    next(error);
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const result = await subscriptionService.getSubscription(subscriptionId);
    return res.json(result);
  } catch (error) {
    logger.error('Error al obtener suscripción:', error);
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, // Asegúrate de tener acceso al body raw
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error('Error al verificar firma del webhook:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    const result = await subscriptionService.handleWebhook(event);
    return res.json(result);
  } catch (error) {
    logger.error('Error al procesar webhook de Stripe:', error);
    next(error);
  }
};

module.exports = {
  createCustomer,
  createSubscription,
  cancelSubscription,
  getSubscription,
  handleWebhook
};