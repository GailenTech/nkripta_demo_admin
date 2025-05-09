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
    
    // Verificar si el usuario tiene permiso para cancelar esta suscripción
    // Solo se permite cancelar suscripciones propias o de la organización si es admin
    const canCancel = await subscriptionService.canManageSubscription(
      subscriptionId,
      req.user.profileId,
      req.user.organizationId,
      req.user.roles || []
    );
    
    if (!canCancel) {
      return res.status(403).json({ message: 'No autorizado para cancelar esta suscripción' });
    }
    
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
    
    // Verificar si el usuario tiene permiso para ver esta suscripción
    const canView = await subscriptionService.canManageSubscription(
      subscriptionId,
      req.user.profileId,
      req.user.organizationId,
      req.user.roles || []
    );
    
    if (!canView) {
      return res.status(403).json({ message: 'No autorizado para ver esta suscripción' });
    }
    
    const result = await subscriptionService.getSubscription(subscriptionId);
    return res.json(result);
  } catch (error) {
    logger.error('Error al obtener suscripción:', error);
    next(error);
  }
};

const getProfileSubscriptions = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    
    // Solo se puede acceder a las suscripciones propias o de la organización si es admin
    const isOwnProfile = req.user.profileId === profileId;
    const isAdmin = (req.user.roles || []).includes('ADMIN');
    
    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ message: 'No autorizado para ver suscripciones de este perfil' });
    }
    
    const subscriptions = await subscriptionService.getProfileSubscriptions(profileId);
    
    return res.json({
      count: subscriptions.length,
      items: subscriptions
    });
  } catch (error) {
    logger.error('Error al obtener suscripciones del perfil:', error);
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

// Método para listar todas las suscripciones (sólo disponible para administradores)
const getAllSubscriptions = async (req, res, next) => {
  try {
    // Extraer parámetros de filtrado
    const { profileId } = req.query;
    
    // Si hay un profileId en la query, redirigir a getProfileSubscriptions
    if (profileId) {
      req.params.profileId = profileId;
      return getProfileSubscriptions(req, res, next);
    }
    
    // Solo los administradores pueden ver todas las suscripciones
    const isAdmin = (req.user.roles || []).includes('ADMIN');
    if (!isAdmin) {
      return res.status(403).json({ message: 'Solo los administradores pueden ver todas las suscripciones' });
    }
    
    try {
      const subscriptions = await subscriptionService.getAllSubscriptions();
      
      return res.json({
        count: subscriptions.length,
        items: subscriptions
      });
    } catch (error) {
      logger.error('Error al obtener suscripciones en el controlador:', error);
      // Devolver un array vacío en caso de error
      return res.json({
        count: 0,
        items: [],
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error al obtener suscripciones'
      });
    }
  } catch (error) {
    logger.error('Error al obtener lista de suscripciones:', error);
    next(error);
  }
};

module.exports = {
  createCustomer,
  createSubscription,
  cancelSubscription,
  getSubscription,
  getProfileSubscriptions,
  getAllSubscriptions,
  handleWebhook
};