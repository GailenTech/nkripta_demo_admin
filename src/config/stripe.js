// src/config/stripe.js
const Stripe = require('stripe');

// Configuración para conectar con stripe-mock en desarrollo
const stripeConfig = {
  apiVersion: '2022-11-15' // Ajustar según versión compatible con stripe-mock
};

// Si estamos en desarrollo, usa el host de stripe-mock
if (process.env.NODE_ENV === 'development') {
  stripeConfig.host = 'stripe-mock';
  stripeConfig.port = '12111';
  stripeConfig.protocol = 'http';
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, stripeConfig);

module.exports = { stripe };