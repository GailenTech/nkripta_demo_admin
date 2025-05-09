#!/usr/bin/env node

/**
 * Script para inicializar datos en Stripe Mock
 * 
 * Este script crea:
 * - Productos y planes en Stripe que coinciden con los de demostración
 * - Clientes de Stripe para cada perfil
 * - Suscripciones en Stripe que conectan clientes con planes
 */

require('dotenv').config();
const { stripe } = require('../src/config/stripe');
const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

// Solo importamos los modelos después de verificar la conexión
let Profile, Subscription;

// Planes de suscripción para inicializar
const PLANS = {
  BASIC: {
    id: 'plan_basic',
    name: 'Plan Básico',
    price: 999, // En centavos
    currency: 'eur',
    interval: 'month'
  },
  PREMIUM: {
    id: 'plan_premium',
    name: 'Plan Premium',
    price: 2999, // En centavos
    currency: 'eur',
    interval: 'month'
  }
};

// Función principal
async function initializeStripeMockData() {
  try {
    console.log('🚀 Inicializando datos en Stripe Mock');
    
    // Intentar conectar a la base de datos
    try {
      console.log('🔄 Conectando a la base de datos...');
      await sequelize.authenticate();
      console.log('✅ Conexión a base de datos exitosa');
      
      // Cargar modelos después de verificar conexión
      const models = require('../src/models');
      Profile = models.Profile;
      Subscription = models.Subscription;
    } catch (dbError) {
      console.error('❌ Error al conectar a la base de datos:', dbError.message);
      console.log('⚠️ Continuando solo con operaciones de Stripe. No se sincronizarán datos a la base de datos.');
    }
    
    // 1. Crear productos y planes
    console.log('\n📦 Creando productos y precios en Stripe...');
    
    // Producto para Plan Básico
    const basicProduct = await stripe.products.create({
      name: 'Nkripta Básico',
      description: 'Plan básico de Nkripta - Acceso a funcionalidades esenciales'
    });
    console.log(`✅ Producto creado: ${basicProduct.name} (${basicProduct.id})`);
    
    // Precio para Plan Básico
    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: PLANS.BASIC.price,
      currency: PLANS.BASIC.currency,
      recurring: { interval: PLANS.BASIC.interval }
    });
    console.log(`✅ Precio creado: ${PLANS.BASIC.name} - ${PLANS.BASIC.price/100}€/${PLANS.BASIC.interval}`);
    
    // Producto para Plan Premium
    const premiumProduct = await stripe.products.create({
      name: 'Nkripta Premium',
      description: 'Plan premium de Nkripta - Acceso a todas las funcionalidades'
    });
    console.log(`✅ Producto creado: ${premiumProduct.name} (${premiumProduct.id})`);
    
    // Precio para Plan Premium
    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: PLANS.PREMIUM.price,
      currency: PLANS.PREMIUM.currency,
      recurring: { interval: PLANS.PREMIUM.interval }
    });
    console.log(`✅ Precio creado: ${PLANS.PREMIUM.name} - ${PLANS.PREMIUM.price/100}€/${PLANS.PREMIUM.interval}`);
    
    // 2. Crear clientes y suscripciones para los perfiles existentes
    console.log('\n👥 Creando clientes y suscripciones para perfiles existentes...');
    
    // Verificar si pudimos conectar a la base de datos
    if (!Profile || !Subscription) {
      console.log('⚠️ No se pudo conectar a la base de datos. No se crearán clientes ni suscripciones.');
      console.log('✅ Los productos y planes de precios se crearon correctamente en Stripe.');
      return;
    }
    
    // Obtener todos los perfiles
    const profiles = await Profile.findAll();
    
    for (const profile of profiles) {
      // Crear cliente en Stripe si no tiene uno
      let customerId = profile.stripeCustomerId;
      
      if (!customerId || !customerId.startsWith('cus_')) {
        const customer = await stripe.customers.create({
          email: profile.email,
          name: `${profile.firstName} ${profile.lastName}`,
          metadata: {
            profileId: profile.id,
            organizationId: profile.organizationId
          }
        });
        customerId = customer.id;
        
        // Actualizar el perfil con el nuevo customer ID
        await profile.update({ stripeCustomerId: customerId });
        console.log(`✅ Cliente Stripe creado para ${profile.firstName} ${profile.lastName} (${customerId})`);
      } else {
        console.log(`ℹ️ Cliente Stripe ya existente para ${profile.firstName} ${profile.lastName} (${customerId})`);
      }
      
      // Buscar suscripción en la base de datos para este perfil
      const subscription = await Subscription.findOne({ where: { profileId: profile.id } });
      
      if (subscription) {
        // Verificar si ya existe en Stripe
        if (subscription.stripeSubscriptionId && subscription.stripeSubscriptionId.startsWith('sub_')) {
          console.log(`ℹ️ Suscripción Stripe ya existente para ${profile.firstName} ${profile.lastName} (${subscription.stripeSubscriptionId})`);
          continue;
        }
        
        // Crear suscripción en Stripe
        const priceId = subscription.planType === 'plan_basic' ? basicPrice.id : premiumPrice.id;
        
        const stripeSub = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          metadata: {
            profileId: profile.id,
            organizationId: profile.organizationId
          }
        });
        
        // Determinar tipo de plan para actualizar en la base de datos
        let dbPlanType = subscription.planType;
        if (subscription.planType === 'plan_basic' && basicPrice) {
          dbPlanType = basicPrice.id;  // Usar el ID del precio generado por Stripe
        } else if (subscription.planType === 'plan_premium' && premiumPrice) {
          dbPlanType = premiumPrice.id;  // Usar el ID del precio generado por Stripe
        }
        
        // Actualizar suscripción en la base de datos
        await subscription.update({ 
          stripeSubscriptionId: stripeSub.id,
          planType: dbPlanType,  // Actualizar al ID generado por Stripe
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          status: stripeSub.status
        });
        
        console.log(`✅ Suscripción Stripe creada para ${profile.firstName} ${profile.lastName} - ${priceId} (${stripeSub.id})`);
      }
    }
    
    console.log('\n✅ Datos inicializados correctamente en Stripe Mock');
    
  } catch (error) {
    console.error('❌ Error al inicializar datos en Stripe Mock:', error);
    process.exit(1);
  }
}

// Ejecutar función principal
initializeStripeMockData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error inesperado:', err);
    process.exit(1);
  });