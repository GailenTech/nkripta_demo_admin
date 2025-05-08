// src/services/subscriptionService.js
const { stripe } = require('../config/stripe');
const { Subscription, Profile } = require('../models');
const logger = require('../utils/logger');

class SubscriptionService {
  async createCustomer(profileId) {
    try {
      const profile = await Profile.findByPk(profileId);
      
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }
      
      // Verificar si ya tiene un ID de cliente en Stripe
      if (profile.stripeCustomerId) {
        return { customerId: profile.stripeCustomerId };
      }
      
      // Crear cliente en Stripe
      const customer = await stripe.customers.create({
        email: profile.email,
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        metadata: {
          profileId: profile.id,
          organizationId: profile.organizationId
        }
      });
      
      // Actualizar perfil con el ID de cliente
      profile.stripeCustomerId = customer.id;
      await profile.save();
      
      return { customerId: customer.id };
    } catch (error) {
      logger.error('Error al crear cliente en Stripe:', error);
      throw error;
    }
  }

  async createSubscription(profileId, organizationId, paymentMethodId, planId) {
    try {
      const profile = await Profile.findByPk(profileId);
      
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }
      
      // Obtener o crear cliente en Stripe
      if (!profile.stripeCustomerId) {
        await this.createCustomer(profileId);
        // Refrescar el perfil para obtener el ID de cliente actualizado
        await profile.reload();
      }
      
      // Asociar método de pago al cliente
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: profile.stripeCustomerId,
      });
      
      // Establecer como método de pago predeterminado
      await stripe.customers.update(profile.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      // Crear suscripción en Stripe
      const subscription = await stripe.subscriptions.create({
        customer: profile.stripeCustomerId,
        items: [{ price: planId }],
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Guardar la suscripción en la base de datos
      await Subscription.create({
        stripeSubscriptionId: subscription.id,
        profileId,
        organizationId,
        planType: planId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
      
      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      };
    } catch (error) {
      logger.error('Error al crear suscripción:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      // Cancelar en Stripe
      const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      
      // Actualizar en la base de datos
      const subscription = await Subscription.findOne({
        where: { stripeSubscriptionId: subscriptionId }
      });
      
      if (subscription) {
        subscription.status = 'canceled';
        subscription.updatedAt = new Date();
        await subscription.save();
      }
      
      return { status: canceledSubscription.status };
    } catch (error) {
      logger.error('Error al cancelar suscripción:', error);
      throw error;
    }
  }

  async getSubscription(subscriptionId) {
    try {
      const subscription = await Subscription.findOne({
        where: { stripeSubscriptionId: subscriptionId }
      });
      
      if (!subscription) {
        throw new Error('Suscripción no encontrada');
      }
      
      // Obtener detalles actualizados de Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Actualizar el estado en la base de datos si ha cambiado
      if (subscription.status !== stripeSubscription.status) {
        subscription.status = stripeSubscription.status;
        subscription.updatedAt = new Date();
        await subscription.save();
      }
      
      return {
        id: subscription.id,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        profileId: subscription.profileId,
        organizationId: subscription.organizationId,
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      };
    } catch (error) {
      logger.error('Error al obtener suscripción:', error);
      throw error;
    }
  }

  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
      }
      
      return { received: true };
    } catch (error) {
      logger.error('Error al procesar webhook de Stripe:', error);
      throw error;
    }
  }

  async handlePaymentSucceeded(invoice) {
    if (invoice.subscription) {
      const subscription = await Subscription.findOne({
        where: { stripeSubscriptionId: invoice.subscription }
      });
      
      if (subscription) {
        const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
        
        subscription.status = stripeSubscription.status;
        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        subscription.updatedAt = new Date();
        await subscription.save();
      }
    }
  }

  async handlePaymentFailed(invoice) {
    if (invoice.subscription) {
      const subscription = await Subscription.findOne({
        where: { stripeSubscriptionId: invoice.subscription }
      });
      
      if (subscription) {
        const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
        
        subscription.status = stripeSubscription.status;
        subscription.updatedAt = new Date();
        await subscription.save();
      }
    }
  }

  async handleSubscriptionUpdated(subscription) {
    const dbSubscription = await Subscription.findOne({
      where: { stripeSubscriptionId: subscription.id }
    });
    
    if (dbSubscription) {
      dbSubscription.status = subscription.status;
      dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      dbSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
      dbSubscription.updatedAt = new Date();
      await dbSubscription.save();
    }
  }

  async handleSubscriptionDeleted(subscription) {
    const dbSubscription = await Subscription.findOne({
      where: { stripeSubscriptionId: subscription.id }
    });
    
    if (dbSubscription) {
      dbSubscription.status = 'canceled';
      dbSubscription.updatedAt = new Date();
      await dbSubscription.save();
    }
  }
}

module.exports = new SubscriptionService();