// src/config/stripe.js
const Stripe = require('stripe');

// Configuración para conectar con stripe-mock en desarrollo
const stripeConfig = {
  apiVersion: '2022-11-15' // Ajustar según versión compatible con stripe-mock
};

// Si estamos en desarrollo o se especifica usar stripe-mock, usar el host/puerto configurado
if (process.env.NODE_ENV === 'development' || process.env.STRIPE_MOCK_ENABLED === 'true') {
  stripeConfig.host = process.env.STRIPE_MOCK_HOST || 'stripe-mock';
  stripeConfig.port = process.env.STRIPE_MOCK_PORT || '12111';
  stripeConfig.protocol = 'http';
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, stripeConfig);

module.exports = { stripe };