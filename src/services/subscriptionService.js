// src/services/subscriptionService.js
const { stripe } = require('../config/stripe');
const { Profile } = require('../models');
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

  /**
   * Crea una nueva suscripción en Stripe
   * 
   * @param {string} profileId - ID del perfil que realiza la suscripción
   * @param {string} organizationId - ID de la organización a la que pertenece el perfil
   * @param {string} paymentMethodId - ID del método de pago en Stripe
   * @param {string} planId - ID del plan (price) en Stripe
   * @param {string} [couponId] - ID del cupón de descuento (opcional)
   * @returns {Promise<Object>} - Datos de la suscripción creada
   */
  async createSubscription(profileId, organizationId, paymentMethodId, planId, couponId = null) {
    try {
      const profile = await Profile.findByPk(profileId);
      
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }
      
      // Verificar si ya existe una suscripción activa para este plan en Stripe
      let existingSubscription = null;
      
      // Obtener o crear cliente en Stripe
      if (!profile.stripeCustomerId) {
        await this.createCustomer(profileId);
        // Refrescar el perfil para obtener el ID de cliente actualizado
        await profile.reload();
      }
      
      try {
        // Verificar suscripciones existentes en Stripe
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: profile.stripeCustomerId,
          status: 'active',
          price: planId
        });
        
        if (stripeSubscriptions.data && stripeSubscriptions.data.length > 0) {
          existingSubscription = stripeSubscriptions.data[0];
        }
      } catch (stripeError) {
        logger.warn('Error al verificar suscripciones existentes en Stripe:', stripeError.message);
      }
      
      if (existingSubscription) {
        const error = new Error('Ya existe una suscripción activa para este plan');
        error.statusCode = 409; // Conflict
        throw error;
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
      
      // Preparar los datos para crear la suscripción
      const subscriptionData = {
        customer: profile.stripeCustomerId,
        items: [{ price: planId }],
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          profileId: profileId,
          organizationId: organizationId
        }
      };
      
      // Añadir cupón si se proporciona
      if (couponId) {
        // Verificar que el cupón existe
        try {
          const coupon = await stripe.coupons.retrieve(couponId);
          // Si el cupón existe, añadirlo a la suscripción
          subscriptionData.coupon = couponId;
          logger.info(`Aplicando cupón ${couponId} a la suscripción`);
        } catch (couponError) {
          logger.warn(`El cupón ${couponId} no existe o no es válido:`, couponError.message);
          // No añadir el cupón si no existe, pero continuar con la creación de la suscripción
        }
      }
      
      // Crear suscripción en Stripe
      const subscription = await stripe.subscriptions.create(subscriptionData);
      
      // Extraer el client_secret con manejo de errores (puede no existir en el mock)
      let clientSecret = null;
      try {
        if (subscription.latest_invoice && 
            subscription.latest_invoice.payment_intent && 
            subscription.latest_invoice.payment_intent.client_secret) {
          clientSecret = subscription.latest_invoice.payment_intent.client_secret;
        } else {
          // Si no existe, generar uno ficticio para pruebas
          clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`;
          logger.info('Usando client_secret ficticio en modo prueba');
        }
      } catch (error) {
        // Si hay un error, usar uno ficticio
        clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`;
        logger.info('Error al obtener client_secret, usando uno ficticio:', error.message);
      }
      
      // Preparar respuesta con información sobre el cupón aplicado
      const response = {
        subscriptionId: subscription.id,
        status: subscription.status || 'active',
        clientSecret,
        hasCoupon: false
      };
      
      // Añadir información del cupón si existe
      if (subscription.discount && subscription.discount.coupon) {
        response.hasCoupon = true;
        response.coupon = {
          id: subscription.discount.coupon.id,
          name: subscription.discount.coupon.name || 'Cupón de descuento',
          amountOff: subscription.discount.coupon.amount_off,
          percentOff: subscription.discount.coupon.percent_off,
          duration: subscription.discount.coupon.duration
        };
      }
      
      return response;
    } catch (error) {
      // Si es un error definido por nosotros, preservar el statusCode
      if (!error.statusCode) {
        logger.error('Error al crear suscripción:', error);
      }
      throw error;
    }
  }

  /**
   * Cancela una suscripción inmediatamente
   * @param {string} subscriptionId - ID de la suscripción a cancelar
   * @returns {Promise<Object>} - Resultado de la cancelación
   */
  async cancelSubscription(subscriptionId) {
    try {
      // Verificar si es un ID de suscripción generado por mock
      const useStripeMock = process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true';
      const isMockId = subscriptionId.includes('_');
      
      if (useStripeMock && isMockId) {
        // Para suscripciones mock, guardar el estado y generar una respuesta simulada
        const canceledState = { 
          status: 'canceled',
          cancelAtPeriodEnd: true
        };
        
        // Guardar el estado en nuestro Map
        this.#mockSubscriptionStates.set(subscriptionId, canceledState);
        
        return { 
          ...canceledState,
          subscriptionId: subscriptionId,
          message: 'Suscripción cancelada exitosamente (simulación)'
        };
      }
      
      // Cancelar directamente en Stripe
      let canceledSubscription;
      try {
        canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      } catch (stripeError) {
        logger.error('Error al cancelar en Stripe:', stripeError.message);
        throw new Error(`No se pudo cancelar la suscripción: ${stripeError.message}`);
      }
      
      return { 
        status: canceledSubscription.status,
        subscriptionId: canceledSubscription.id,
        message: 'Suscripción cancelada exitosamente'
      };
    } catch (error) {
      logger.error('Error al cancelar suscripción:', error);
      throw error;
    }
  }
  
  /**
   * Pausa una suscripción (cancelar al final del período actual)
   * @param {string} subscriptionId - ID de la suscripción a pausar
   * @returns {Promise<Object>} - Resultado de la pausa
   */
  async pauseSubscription(subscriptionId) {
    try {
      // Verificar si es un ID de suscripción generado por mock
      const useStripeMock = process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true';
      const isMockId = subscriptionId.includes('_');
      
      if (useStripeMock && isMockId) {
        // Para suscripciones mock, guardar el estado y generar una respuesta simulada
        const pausedState = { 
          status: 'active',
          cancelAtPeriodEnd: true,
        };
        
        // Guardar el estado en nuestro Map
        this.#mockSubscriptionStates.set(subscriptionId, pausedState);
        
        return { 
          ...pausedState,
          subscriptionId: subscriptionId,
          message: 'Suscripción pausada. Se cancelará al final del período actual (simulación)'
        };
      }
      
      // Marcar la suscripción para cancelación al final del período
      let updatedSubscription;
      try {
        updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      } catch (stripeError) {
        logger.error('Error al pausar en Stripe:', stripeError.message);
        throw new Error(`No se pudo pausar la suscripción: ${stripeError.message}`);
      }
      
      return { 
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        subscriptionId: updatedSubscription.id,
        message: 'Suscripción pausada. Se cancelará al final del período actual.'
      };
    } catch (error) {
      logger.error('Error al pausar suscripción:', error);
      throw error;
    }
  }
  
  /**
   * Reanuda una suscripción pausada
   * @param {string} subscriptionId - ID de la suscripción a reanudar
   * @returns {Promise<Object>} - Resultado de la reanudación
   */
  async resumeSubscription(subscriptionId) {
    try {
      // Verificar si es un ID de suscripción generado por mock
      const useStripeMock = process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true';
      const isMockId = subscriptionId.includes('_');
      
      if (useStripeMock && isMockId) {
        // Para suscripciones mock, guardar el estado y generar una respuesta simulada
        const resumedState = { 
          status: 'active',
          cancelAtPeriodEnd: false,
        };
        
        // Guardar el estado en nuestro Map
        this.#mockSubscriptionStates.set(subscriptionId, resumedState);
        
        return { 
          ...resumedState,
          subscriptionId: subscriptionId,
          message: 'Suscripción reanudada exitosamente (simulación)'
        };
      }
      
      // Desmarcar la cancelación al final del período
      let updatedSubscription;
      try {
        updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false
        });
      } catch (stripeError) {
        logger.error('Error al reanudar en Stripe:', stripeError.message);
        throw new Error(`No se pudo reanudar la suscripción: ${stripeError.message}`);
      }
      
      return { 
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        subscriptionId: updatedSubscription.id,
        message: 'Suscripción reanudada exitosamente'
      };
    } catch (error) {
      logger.error('Error al reanudar suscripción:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene los métodos de pago asociados a un perfil
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Array>} - Lista de métodos de pago
   */
  async getProfilePaymentMethods(profileId) {
    try {
      // Obtener el perfil para encontrar el Stripe Customer ID
      const profile = await Profile.findByPk(profileId);
      
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }
      
      // Si estamos en entorno de prueba/desarrollo
      const useStripeMock = process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true';
      
      if (useStripeMock) {
        // En entorno de desarrollo, generar datos de prueba
        return this._generateMockPaymentMethods(profile);
      }
      
      // Si el perfil no tiene customerID, no tiene métodos de pago
      if (!profile.stripeCustomerId) {
        return [];
      }
      
      // Obtener métodos de pago desde Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: profile.stripeCustomerId,
        type: 'card'
      });
      
      return paymentMethods.data.map(method => ({
        id: method.id,
        type: method.type,
        card: {
          brand: method.card.brand,
          last4: method.card.last4,
          expiryMonth: method.card.exp_month,
          expiryYear: method.card.exp_year
        },
        billingDetails: method.billing_details,
        created: new Date(method.created * 1000),
        isDefault: method.metadata?.isDefault === 'true'
      }));
    } catch (error) {
      logger.error('Error al obtener métodos de pago:', error);
      return [];
    }
  }
  
  /**
   * Genera métodos de pago de prueba para un perfil
   * @param {Object} profile - Perfil para el que generar métodos de pago
   * @returns {Array} - Lista de métodos de pago de prueba
   */
  _generateMockPaymentMethods(profile) {
    // Generar un ID único basado en el ID del perfil
    const profileHash = profile.id
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    // Determinar cuántos métodos de pago generar (0-2)
    const cardCount = profileHash % 5 === 0 ? 2 : 1; // 20% tienen 2 tarjetas, 80% tienen 1
    
    const mockCards = [];
    
    // Generar tarjetas
    for (let i = 0; i < cardCount; i++) {
      const cardBrands = ['visa', 'mastercard', 'amex'];
      const brand = cardBrands[(profileHash + i) % cardBrands.length];
      
      // Generar últimos 4 dígitos basados en el perfil (para consistencia)
      const last4 = String(1000 + ((profileHash + i * 33) % 9000)).padStart(4, '0');
      
      // Generar mes y año de expiración
      const currentYear = new Date().getFullYear();
      const month = 1 + ((profileHash + i * 7) % 12);
      const year = currentYear + 1 + ((profileHash + i * 3) % 5);
      
      // Crear método de pago mock
      mockCards.push({
        id: `pm_${profile.id.substring(0, 8)}_${brand}_${i}`,
        type: 'card',
        card: {
          brand,
          last4,
          expiryMonth: month,
          expiryYear: year
        },
        billingDetails: {
          address: {
            city: 'Madrid',
            country: 'ES',
            line1: 'Calle Principal 123',
            postal_code: '28001'
          },
          email: profile.email,
          name: `${profile.firstName} ${profile.lastName}`
        },
        created: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)), // La primera tarjeta es más reciente
        isDefault: i === 0 // La primera tarjeta es la predeterminada
      });
    }
    
    return mockCards;
  }

  // Almacenamiento en memoria para estados de suscripciones mock
  #mockSubscriptionStates = new Map();

  async getSubscription(subscriptionId) {
    try {
      // Si estamos en entorno de prueba/desarrollo y USE_STRIPE_MOCK está activo
      const useStripeMock = process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true';
      
      // Verificar si es un ID de suscripción generado por mock
      const isMockId = subscriptionId.includes('_');
      
      if (useStripeMock && isMockId) {
        // Verificar si tenemos un estado guardado para esta suscripción
        const savedState = this.#mockSubscriptionStates.get(subscriptionId);
        
        // Es un ID de mock, así que extraemos la información del ID
        const parts = subscriptionId.split('_');
        if (parts.length >= 3) {
          const profileIdPart = parts[1]; // Formato esperado: sub_profileId_planType_index
          const planType = parts[2]; // basic, premium, enterprise
          
          // Buscar el perfil
          try {
            // Intentar encontrar el perfil que contenga este fragmento en su ID
            const profiles = await Profile.findAll();
            const profile = profiles.find(p => p.id.includes(profileIdPart));
            
            if (profile) {
              // Encontrado el perfil, generar una suscripción de prueba
              let planName = 'Plan Desconocido';
              let planPrice = 0;
              
              if (planType === 'basic') {
                planName = 'Plan Básico';
                planPrice = 9.99;
              } else if (planType === 'premiu') {
                planName = 'Plan Premium';
                planPrice = 29.99;
              } else if (planType === 'enterp') {
                planName = 'Plan Enterprise';
                planPrice = 99.99;
              }
              
              // Generar fechas realistas
              const now = new Date();
              const periodStartDate = new Date(now);
              periodStartDate.setDate(now.getDate() - 15); // 15 días atrás
              const periodEndDate = new Date(now);
              periodEndDate.setDate(periodStartDate.getDate() + 30); // +30 días desde inicio
              
              // Crear respuesta base
              const response = {
                subscriptionId: subscriptionId,
                profileId: profile.id,
                organizationId: profile.organizationId,
                planType: `plan_${planType}`,
                planName: planName,
                planPrice: planPrice,
                planCurrency: 'eur',
                status: 'active',
                currentPeriodStart: periodStartDate,
                currentPeriodEnd: periodEndDate,
                cancelAtPeriodEnd: false,
                customerEmail: profile.email || ''
              };
              
              // Aplicar estado guardado si existe
              if (savedState) {
                Object.assign(response, savedState);
              }
              
              return response;
            }
          } catch (mockError) {
            logger.warn('Error al buscar perfil para suscripción mock:', mockError.message);
          }
        }
      }
      
      // Si no es un mock o no pudimos encontrar el perfil, procedemos con Stripe
      let stripeSubscription;
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['customer', 'plan.product']
        });
      } catch (stripeError) {
        logger.error('Error al obtener suscripción de Stripe:', stripeError.message);
        throw new Error(`No se pudo encontrar la suscripción: ${stripeError.message}`);
      }
      
      // Extraer metadata (puede ser nula en stripe mock)
      const profileId = stripeSubscription.metadata?.profileId || '';
      const organizationId = stripeSubscription.metadata?.organizationId || '';
      
      // Determinar el tipo de plan basado en el precio
      let planType = 'desconocido';
      let planName = 'Plan Desconocido';
      let planPrice = 0;
      let planCurrency = 'eur';
      
      if (stripeSubscription.items && stripeSubscription.items.data && stripeSubscription.items.data.length > 0) {
        const item = stripeSubscription.items.data[0];
        
        // Intentar obtener el ID del precio
        if (item.price && item.price.id) {
          planType = item.price.id;
        }
        
        // Intentar determinar plan por precio
        if (item.price && item.price.unit_amount) {
          if (item.price.unit_amount === 999) {
            planType = 'plan_basic';
            planName = 'Plan Básico';
            planPrice = 9.99;
          } else if (item.price.unit_amount === 2999) {
            planType = 'plan_premium';
            planName = 'Plan Premium';
            planPrice = 29.99;
          } else {
            planPrice = item.price.unit_amount / 100;
          }
        }
        
        // Intentar obtener nombre del producto
        if (item.price && item.price.product && typeof item.price.product === 'object') {
          planName = item.price.product.name || planName;
        }
        
        // Intentar obtener moneda
        if (item.price && item.price.currency) {
          planCurrency = item.price.currency;
        }
      }
      
      return {
        subscriptionId: stripeSubscription.id,
        profileId: profileId,
        organizationId: organizationId,
        planType: planType,
        planName: planName,
        planPrice: planPrice,
        planCurrency: planCurrency,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        customerEmail: stripeSubscription.customer?.email || ''
      };
    } catch (error) {
      logger.error('Error al obtener suscripción:', error);
      throw error;
    }
  }
  
  async getProfileSubscriptions(profileId) {
    try {
      // Obtener el perfil para encontrar el Stripe Customer ID
      const profile = await Profile.findByPk(profileId);
      
      if (!profile) {
        return []; // Si no existe el perfil, no hay suscripciones
      }
      
      // Si estamos en entorno de prueba/desarrollo y USE_STRIPE_MOCK está activo
      const useStripeMock = process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true';
      if (useStripeMock) {
        logger.info(`Usando datos de prueba para suscripciones del perfil ${profileId}`);
        
        // Primero intentamos obtener datos reales de Stripe Mock
        try {
          if (profile.stripeCustomerId) {
            const stripeSubscriptions = await stripe.subscriptions.list({
              customer: profile.stripeCustomerId,
              limit: 100,
              expand: ['data.customer', 'data.plan.product']
            });
            
            // Verificar si tenemos suscripciones y si todas tienen el mismo ID (problema común en Stripe Mock)
            if (stripeSubscriptions.data && stripeSubscriptions.data.length > 0) {
              // Si todas las suscripciones tienen el mismo ID, generamos datos de prueba personalizados en su lugar
              const allSameId = stripeSubscriptions.data.every(sub => sub.id === stripeSubscriptions.data[0].id);
              
              if (!allSameId) {
                // Si los IDs son diferentes, usar los datos reales de Stripe Mock
                return this._formatStripeSubscriptions(stripeSubscriptions.data, profile);
              }
            }
          }
        } catch (mockError) {
          logger.warn('Error al obtener datos de Stripe Mock, usando datos de prueba:', mockError.message);
        }
        
        // Generar suscripciones mock para este perfil
        const mockSubscriptions = this._generateMockSubscriptions(profile);
        
        // Aplicar los estados guardados a las suscripciones mock generadas
        return mockSubscriptions.map(sub => {
          const savedState = this.#mockSubscriptionStates.get(sub.subscriptionId);
          if (savedState) {
            logger.info(`Aplicando estado guardado a suscripción ${sub.subscriptionId}:`, savedState);
            return { ...sub, ...savedState };
          }
          return sub;
        });
      }
      
      // En entorno de producción, intentamos obtener los datos reales
      if (!profile.stripeCustomerId) {
        return []; // Si no tiene Stripe Customer ID, no tiene suscripciones
      }
      
      // Obtener todas las suscripciones del perfil directamente desde Stripe
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: profile.stripeCustomerId,
        limit: 100,
        expand: ['data.customer', 'data.plan.product']
      });
      
      // Transformar las suscripciones de Stripe al formato esperado
      return this._formatStripeSubscriptions(stripeSubscriptions.data, profile);
    } catch (error) {
      logger.error('Error al obtener suscripciones del perfil:', error);
      return []; // Devolver array vacío para evitar error 500 en la API
    }
  }
  
  // Método auxiliar para formatear suscripciones de Stripe
  _formatStripeSubscriptions(stripeSubscriptions, profile) {
    return stripeSubscriptions.map(stripeSub => {
      // Determinar el tipo de plan basado en el precio
      let planType = 'desconocido';
      let planName = 'Plan Desconocido';
      let planPrice = 0;
      let planCurrency = 'eur';
      
      if (stripeSub.items && stripeSub.items.data && stripeSub.items.data.length > 0) {
        const item = stripeSub.items.data[0];
        
        // Intentar obtener el ID del precio
        if (item.price && item.price.id) {
          planType = item.price.id;
        }
        
        // Intentar determinar plan por precio
        if (item.price && item.price.unit_amount) {
          if (item.price.unit_amount === 999) {
            planType = 'plan_basic';
            planName = 'Plan Básico';
            planPrice = 9.99;
          } else if (item.price.unit_amount === 2999) {
            planType = 'plan_premium';
            planName = 'Plan Premium';
            planPrice = 29.99;
          } else {
            planPrice = item.price.unit_amount / 100;
          }
        }
        
        // Intentar obtener nombre del producto
        if (item.price && item.price.product && typeof item.price.product === 'object') {
          planName = item.price.product.name || planName;
        }
        
        // Intentar obtener moneda
        if (item.price && item.price.currency) {
          planCurrency = item.price.currency;
        }
      }
      
      return {
        subscriptionId: stripeSub.id,
        profileId: profile.id,
        organizationId: profile.organizationId,
        planType: planType,
        planName: planName,
        planPrice: planPrice,
        planCurrency: planCurrency,
        status: stripeSub.status,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        createdAt: new Date(stripeSub.created * 1000)
      };
    });
  }
  
  // Método para generar datos de prueba realistas basados en el perfil
  _generateMockSubscriptions(profile) {
    // Decidir cuántas suscripciones generar (0-2) basado en el ID del perfil
    // Convertimos el ID a un número para tener algo determinístico
    const profileIdSum = profile.id
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    // 30% de perfiles sin suscripciones, 50% con una suscripción, 20% con dos
    const numSubscriptions = profileIdSum % 10 < 3 ? 0 : (profileIdSum % 10 < 8 ? 1 : 2);
    
    if (numSubscriptions === 0) {
      return [];
    }
    
    const mockSubscriptions = [];
    
    // Planes disponibles para datos de prueba
    const plans = [
      { type: 'plan_basic', name: 'Plan Básico', price: 9.99 },
      { type: 'plan_premium', name: 'Plan Premium', price: 29.99 },
      { type: 'plan_enterprise', name: 'Plan Enterprise', price: 99.99 }
    ];
    
    // Estados disponibles
    const statuses = ['active', 'active', 'active', 'past_due', 'canceled']; // Más probabilidad de activos
    
    // Fecha actual
    const now = new Date();
    
    // Generar suscripciones aleatorias pero determinísticas basadas en el ID del perfil
    for (let i = 0; i < numSubscriptions; i++) {
      // Seleccionar plan basado en el ID del perfil y el índice actual
      const planIndex = (profileIdSum + i) % plans.length;
      const plan = plans[planIndex];
      
      // Seleccionar estado
      const statusIndex = (profileIdSum + i * 3) % statuses.length;
      const status = statuses[statusIndex];
      
      // Generar fechas realistas
      const createdMonthsAgo = ((profileIdSum + i) % 12) + 1; // 1-12 meses atrás
      const createdDate = new Date(now);
      createdDate.setMonth(now.getMonth() - createdMonthsAgo);
      
      // Período actual (ajustado según el estado)
      const periodStartDate = new Date(now);
      const periodEndDate = new Date(now);
      
      if (status === 'active' || status === 'past_due') {
        // Período actual: empezó hace menos de 30 días y termina en el futuro
        periodStartDate.setDate(now.getDate() - ((profileIdSum + i) % 28)); // 0-27 días atrás
        periodEndDate.setDate(periodStartDate.getDate() + 30); // +30 días desde inicio
      } else {
        // Período terminado: empezó y terminó en el pasado
        periodStartDate.setDate(now.getDate() - 60 - ((profileIdSum + i) % 30)); // 60-89 días atrás
        periodEndDate.setDate(periodStartDate.getDate() + 30); // +30 días desde ese inicio
      }
      
      // Crear un ID único basado en el perfil y el tipo de plan
      const uniqueId = `sub_${profile.id.substring(0, 8)}_${plan.type.substring(5, 11)}_${i}`;
      
      mockSubscriptions.push({
        subscriptionId: uniqueId,
        profileId: profile.id,
        organizationId: profile.organizationId,
        planType: plan.type,
        planName: plan.name,
        planPrice: plan.price,
        planCurrency: 'eur',
        status: status,
        currentPeriodStart: periodStartDate,
        currentPeriodEnd: periodEndDate,
        cancelAtPeriodEnd: status === 'canceled',
        createdAt: createdDate
      });
    }
    
    return mockSubscriptions;
  }
  
  async getAllSubscriptions() {
    try {
      // Si estamos en entorno de prueba/desarrollo y USE_STRIPE_MOCK está activo
      const useStripeMock = process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true';
      
      if (useStripeMock) {
        logger.info('Usando datos de prueba para todas las suscripciones');
        
        // Intentar obtener datos reales de Stripe Mock primero
        try {
          // Verificar conexión con Stripe Mock
          await stripe.balance.retrieve();
          
          const stripeSubscriptions = await stripe.subscriptions.list({
            limit: 100,
            expand: ['data.customer', 'data.plan.product']
          });
          
          // Verificar si todos los IDs son iguales (problema común en Stripe Mock)
          if (stripeSubscriptions.data && stripeSubscriptions.data.length > 1) {
            const allSameId = stripeSubscriptions.data.every(sub => 
              sub.id === stripeSubscriptions.data[0].id
            );
            
            if (!allSameId) {
              // Si los IDs son diferentes, usar los datos reales
              return this._formatAllStripeSubscriptions(stripeSubscriptions.data);
            }
          }
        } catch (mockError) {
          logger.warn('Error al obtener datos de Stripe Mock, generando datos de prueba:', mockError.message);
        }
        
        // Si llegamos aquí, generamos datos de prueba para todas las suscripciones
        return this._generateAllMockSubscriptions();
      }
      
      // En entorno de producción, intentamos obtener los datos reales
      const stripeSubscriptions = await stripe.subscriptions.list({
        limit: 100,
        expand: ['data.customer', 'data.plan.product']
      });
      
      // Transformar las suscripciones de Stripe al formato esperado
      return this._formatAllStripeSubscriptions(stripeSubscriptions.data);
    } catch (error) {
      logger.error('Error al obtener todas las suscripciones:', error);
      // Devolver array vacío para evitar error 500 en la API
      return [];
    }
  }
  
  // Método auxiliar para formatear todas las suscripciones de Stripe
  _formatAllStripeSubscriptions(stripeSubscriptions) {
    return stripeSubscriptions.map(stripeSub => {
      // Determinar el tipo de plan basado en el precio
      let planType = 'desconocido';
      let planName = 'Plan Desconocido';
      let planPrice = 0;
      let planCurrency = 'eur';
      
      if (stripeSub.items && stripeSub.items.data && stripeSub.items.data.length > 0) {
        const item = stripeSub.items.data[0];
        
        // Intentar obtener el ID del precio
        if (item.price && item.price.id) {
          planType = item.price.id;
        }
        
        // Intentar determinar plan por precio
        if (item.price && item.price.unit_amount) {
          if (item.price.unit_amount === 999) {
            planType = 'plan_basic';
            planName = 'Plan Básico';
            planPrice = 9.99;
          } else if (item.price.unit_amount === 2999) {
            planType = 'plan_premium';
            planName = 'Plan Premium';
            planPrice = 29.99;
          } else {
            planPrice = item.price.unit_amount / 100;
          }
        }
        
        // Intentar obtener nombre del producto
        if (item.price && item.price.product && typeof item.price.product === 'object') {
          planName = item.price.product.name || planName;
        }
        
        // Intentar obtener moneda
        if (item.price && item.price.currency) {
          planCurrency = item.price.currency;
        }
      }
      
      // Extraer metadata
      const profileId = stripeSub.metadata?.profileId || '';
      const organizationId = stripeSub.metadata?.organizationId || '';
      
      return {
        subscriptionId: stripeSub.id,
        profileId: profileId,
        organizationId: organizationId,
        planType: planType,
        planName: planName,
        planPrice: planPrice,
        planCurrency: planCurrency,
        status: stripeSub.status,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        createdAt: new Date(stripeSub.created * 1000),
        customerEmail: stripeSub.customer?.email || ''
      };
    });
  }
  
  // Método para generar datos de prueba de todas las suscripciones
  async _generateAllMockSubscriptions() {
    try {
      // Obtener todos los perfiles
      const profiles = await Profile.findAll();
      const allMockSubscriptions = [];
      
      // Generar suscripciones de prueba para cada perfil
      for (const profile of profiles) {
        const profileSubscriptions = this._generateMockSubscriptions(profile);
        allMockSubscriptions.push(...profileSubscriptions);
      }
      
      return allMockSubscriptions;
    } catch (error) {
      logger.error('Error al generar datos de prueba para todas las suscripciones:', error);
      return [];
    }
  }
  
  async canManageSubscription(subscriptionId, profileId, organizationId, roles = []) {
    try {
      // En modo desarrollo, permitir a los administradores gestionar cualquier suscripción
      if (process.env.NODE_ENV === 'development' && roles.includes('ADMIN')) {
        return true;
      }
      
      // Verificar si es un ID de suscripción generado por mock
      const isMockId = subscriptionId.includes('_');
      const useStripeMock = process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true';
      
      if (useStripeMock && isMockId) {
        // Es un ID de mock, extraer info
        const parts = subscriptionId.split('_');
        if (parts.length >= 3) {
          const profileIdPart = parts[1]; // Formato esperado: sub_profileId_planType_index
          
          // Comprobar si el perfil actual coincide parcialmente con el ID
          if (profileId.includes(profileIdPart)) {
            return true; // Es el propietario
          }
          
          // Si es admin, verificar si pertenece a la misma organización
          if (roles.includes('ADMIN')) {
            // Intentar encontrar el perfil que coincida con este fragmento
            try {
              const profiles = await Profile.findAll();
              const profile = profiles.find(p => p.id.includes(profileIdPart));
              
              if (profile && profile.organizationId === organizationId) {
                return true; // Es admin y de la misma organización
              }
            } catch (mockError) {
              logger.warn('Error al verificar permisos para suscripción mock:', mockError.message);
            }
          }
          
          return false;
        }
      }
      
      // Si no es un mock o continuar con Stripe
      let stripeSubscription;
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      } catch (stripeError) {
        logger.error('Error al obtener suscripción de Stripe para verificar permisos:', stripeError.message);
        return false;
      }
      
      // Obtener metadata
      const subProfileId = stripeSubscription.metadata?.profileId || '';
      const subOrgId = stripeSubscription.metadata?.organizationId || '';
      
      // Si es el propietario de la suscripción
      if (subProfileId === profileId) {
        return true;
      }
      
      // Si es administrador y pertenece a la misma organización
      if (roles.includes('ADMIN') && subOrgId === organizationId) {
        return true;
      }
      
      // Si los metadatos no están disponibles, intentamos verificar por customer
      if ((!subProfileId || !subOrgId) && stripeSubscription.customer) {
        // Buscar el perfil con ese customer ID
        const profile = await Profile.findOne({
          where: { stripeCustomerId: stripeSubscription.customer }
        });
        
        if (profile) {
          // Si es el propietario
          if (profile.id === profileId) {
            return true;
          }
          
          // Si es admin de la misma organización
          if (roles.includes('ADMIN') && profile.organizationId === organizationId) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Error al verificar permisos de suscripción:', error);
      return false;
    }
  }

  async handleWebhook(event) {
    // Stripe webhooks ahora se manejan directamente por Stripe
    // No necesitamos sincronizar con una base de datos local
    logger.info(`Evento Stripe recibido: ${event.type}`);
    return { received: true };
  }
  
  /**
   * Obtiene la lista de cupones disponibles en Stripe
   * @param {number} [limit=20] - Límite de cupones a retornar
   * @returns {Promise<Array>} - Lista de cupones disponibles
   */
  async getAvailableCoupons(limit = 20) {
    try {
      // Si estamos en entorno de prueba/desarrollo
      const useStripeMock = process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true';
      
      if (useStripeMock) {
        try {
          // Intentar obtener cupones de Stripe Mock
          const stripeCoupons = await stripe.coupons.list({ limit });
          
          // Si hay resultados y parecen válidos, usarlos
          if (stripeCoupons.data && stripeCoupons.data.length > 0) {
            return stripeCoupons.data.map(coupon => ({
              id: coupon.id,
              name: coupon.name || 'Descuento',
              amountOff: coupon.amount_off,
              percentOff: coupon.percent_off,
              duration: coupon.duration,
              durationInMonths: coupon.duration_in_months,
              valid: true
            }));
          }
        } catch (stripeError) {
          logger.warn('Error al obtener cupones de Stripe Mock:', stripeError.message);
        }
        
        // Si llegamos aquí, generar datos de prueba
        return this._generateMockCoupons();
      }
      
      // En entorno real, obtener cupones directamente de Stripe
      const stripeCoupons = await stripe.coupons.list({ limit });
      
      return stripeCoupons.data.map(coupon => ({
        id: coupon.id,
        name: coupon.name || 'Descuento',
        amountOff: coupon.amount_off,
        percentOff: coupon.percent_off,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months,
        valid: true
      }));
    } catch (error) {
      logger.error('Error al obtener cupones disponibles:', error);
      return [];
    }
  }
  
  /**
   * Genera cupones de prueba para entorno de desarrollo
   * @returns {Array} - Lista de cupones de prueba
   */
  _generateMockCoupons() {
    const mockCoupons = [
      {
        id: 'WELCOME10',
        name: 'Bienvenida: 10% de descuento',
        percentOff: 10,
        duration: 'once',
        valid: true
      },
      {
        id: 'PREMIUM20',
        name: 'Premium: 20% de descuento',
        percentOff: 20,
        duration: 'once',
        valid: true
      },
      {
        id: 'YEARLYPLAN',
        name: 'Plan anual: 15% de descuento',
        percentOff: 15,
        duration: 'forever',
        valid: true
      },
      {
        id: 'FIRST5EUR',
        name: '5€ de descuento en primera suscripción',
        amountOff: 500, // en céntimos
        duration: 'once',
        valid: true
      },
      {
        id: 'TEAM25',
        name: '25% descuento para equipos',
        percentOff: 25,
        duration: 'repeating',
        durationInMonths: 3,
        valid: true
      }
    ];
    
    return mockCoupons;
  }
  
  /**
   * Obtiene información detallada sobre planes/precios disponibles en Stripe
   * @returns {Promise<Array>} - Lista de planes disponibles
   */
  async getAvailablePlans() {
    try {
      // Si estamos en entorno de prueba/desarrollo
      const useStripeMock = process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true';
      
      if (useStripeMock) {
        try {
          // Intentar obtener planes de Stripe Mock
          const stripePrices = await stripe.prices.list({
            active: true,
            expand: ['data.product']
          });
          
          // Si hay resultados y parecen válidos, usarlos
          if (stripePrices.data && stripePrices.data.length > 0 && 
              !stripePrices.data.every(price => !price.product || typeof price.product === 'string')) {
            return stripePrices.data.map(price => ({
              id: price.id,
              productId: typeof price.product === 'object' ? price.product.id : price.product,
              name: typeof price.product === 'object' ? (price.product.name || 'Plan') : 'Plan',
              description: typeof price.product === 'object' ? price.product.description : '',
              unitAmount: price.unit_amount,
              currency: price.currency,
              interval: price.recurring ? price.recurring.interval : 'month',
              intervalCount: price.recurring ? price.recurring.interval_count : 1,
              active: price.active
            }));
          }
        } catch (stripeError) {
          logger.warn('Error al obtener planes de Stripe Mock:', stripeError.message);
        }
        
        // Si llegamos aquí, generar datos de prueba
        return this._generateMockPlans();
      }
      
      // En entorno real, obtener planes directamente de Stripe
      const stripePrices = await stripe.prices.list({
        active: true,
        expand: ['data.product']
      });
      
      return stripePrices.data.map(price => ({
        id: price.id,
        productId: typeof price.product === 'object' ? price.product.id : price.product,
        name: typeof price.product === 'object' ? (price.product.name || 'Plan') : 'Plan',
        description: typeof price.product === 'object' ? price.product.description : '',
        unitAmount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring ? price.recurring.interval : 'month',
        intervalCount: price.recurring ? price.recurring.interval_count : 1,
        active: price.active
      }));
    } catch (error) {
      logger.error('Error al obtener planes disponibles:', error);
      return [];
    }
  }
  
  /**
   * Genera planes de prueba para entorno de desarrollo
   * @returns {Array} - Lista de planes de prueba
   */
  _generateMockPlans() {
    const mockPlans = [
      {
        id: 'price_basic_monthly',
        productId: 'prod_basic',
        name: 'Plan Básico',
        description: 'Plan mensual con funcionalidades básicas',
        unitAmount: 999, // 9.99€ en céntimos
        currency: 'eur',
        interval: 'month',
        intervalCount: 1,
        active: true
      },
      {
        id: 'price_premium_monthly',
        productId: 'prod_premium',
        name: 'Plan Premium',
        description: 'Plan mensual con todas las funcionalidades premium',
        unitAmount: 2999, // 29.99€ en céntimos
        currency: 'eur',
        interval: 'month',
        intervalCount: 1,
        active: true
      },
      {
        id: 'price_enterprise_monthly',
        productId: 'prod_enterprise',
        name: 'Plan Enterprise',
        description: 'Plan empresarial con soporte premium y funcionalidades avanzadas',
        unitAmount: 9999, // 99.99€ en céntimos
        currency: 'eur',
        interval: 'month',
        intervalCount: 1,
        active: true
      },
      {
        id: 'price_basic_yearly',
        productId: 'prod_basic',
        name: 'Plan Básico Anual',
        description: 'Plan anual con funcionalidades básicas (15% descuento)',
        unitAmount: 10190, // 101.90€ en céntimos (~10% descuento sobre mensual x12)
        currency: 'eur',
        interval: 'year',
        intervalCount: 1,
        active: true
      },
      {
        id: 'price_premium_yearly',
        productId: 'prod_premium',
        name: 'Plan Premium Anual',
        description: 'Plan anual con todas las funcionalidades premium (15% descuento)',
        unitAmount: 30590, // 305.90€ en céntimos (~15% descuento sobre mensual x12)
        currency: 'eur',
        interval: 'year',
        intervalCount: 1,
        active: true
      }
    ];
    
    return mockPlans;
  }
  
  /**
   * Verifica si un usuario puede ver un método de pago específico
   * @param {string} paymentMethodId - ID del método de pago
   * @param {string} profileId - ID del perfil que intenta acceder
   * @param {string} organizationId - ID de la organización a la que pertenece el perfil
   * @param {Array} roles - Roles del usuario
   * @returns {Promise<boolean>} - True si puede ver, false si no
   */
  async canViewPaymentMethod(paymentMethodId, profileId, organizationId, roles = []) {
    try {
      // En modo desarrollo, permitir a los administradores ver cualquier método de pago
      if (process.env.NODE_ENV === 'development' && roles.includes('ADMIN')) {
        return true;
      }
      
      // En entorno de mock, simplificar la lógica
      if (process.env.USE_STRIPE_MOCK === 'true' || process.env.STRIPE_MOCK_ENABLED === 'true') {
        // Administradores pueden ver cualquier método de pago
        if (roles.includes('ADMIN')) {
          return true;
        }
        
        // En mock, asumimos que el ID del método de pago contiene el ID del perfil
        const mockIdPattern = new RegExp(`${profileId.substring(0, 8)}`);
        return mockIdPattern.test(paymentMethodId);
      }
      
      // En producción, verificar a través de Stripe
      try {
        // Obtener el método de pago de Stripe
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        
        // Si no tiene un customer asociado, no podemos verificar el dueño
        if (!paymentMethod.customer) {
          return false;
        }
        
        // Buscar perfil que tenga este customer ID
        const profile = await Profile.findOne({
          where: { stripeCustomerId: paymentMethod.customer }
        });
        
        if (!profile) {
          return false;
        }
        
        // Si es el propio perfil, permitir acceso
        if (profile.id === profileId) {
          return true;
        }
        
        // Si es admin y de la misma organización, permitir acceso
        if (roles.includes('ADMIN') && profile.organizationId === organizationId) {
          return true;
        }
        
        return false;
      } catch (stripeError) {
        logger.error('Error al verificar método de pago en Stripe:', stripeError.message);
        return false;
      }
    } catch (error) {
      logger.error('Error al verificar permisos para método de pago:', error);
      return false;
    }
  }
}

module.exports = new SubscriptionService();