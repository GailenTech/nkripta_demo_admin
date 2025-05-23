#!/usr/bin/env node

/**
 * Script para generar datos de demostración realistas para Nkripta
 * 
 * Este script crea:
 * - 3 organizaciones de demostración
 * - 3-4 usuarios por organización
 * - Suscripciones a planes de 9.99€ y 29.99€
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Organization = require('../src/models/organization');
const Profile = require('../src/models/profile');
const { stripe } = require('../src/config/stripe');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Reemplazar chalk con funciones simples de console.log para compatibilidad
const log = {
  blue: (text) => console.log('\x1b[34m%s\x1b[0m', text),
  green: (text) => console.log('\x1b[32m%s\x1b[0m', text),
  yellow: (text) => console.log('\x1b[33m%s\x1b[0m', text),
  red: (text) => console.log('\x1b[31m%s\x1b[0m', text),
  cyan: (text) => console.log('\x1b[36m%s\x1b[0m', text)
};

// Configuración
const PLANS = {
  BASIC: {
    id: 'plan_basic',
    name: 'Plan Básico',
    price: 9.99,
    currency: 'EUR',
    interval: 'month'
  },
  PREMIUM: {
    id: 'plan_premium',
    name: 'Plan Premium',
    price: 29.99,
    currency: 'EUR',
    interval: 'month'
  }
};

// Datos para las organizaciones de ejemplo
const DEMO_ORGANIZATIONS = [
  {
    name: 'TechSolutions Inc.',
    description: 'Empresa líder en soluciones tecnológicas empresariales',
    slug: 'techsolutions',
    website: 'https://techsolutions-demo.com',
    phone: '+34 912 345 678',
    email: 'info@techsolutions-demo.com'
  },
  {
    name: 'InnovaDesign',
    description: 'Estudio de diseño e innovación creativa',
    slug: 'innovadesign',
    website: 'https://innovadesign-demo.com',
    phone: '+34 913 456 789',
    email: 'contacto@innovadesign-demo.com'
  },
  {
    name: 'Global Health Services',
    description: 'Servicios de salud y bienestar corporativo',
    slug: 'globalhealth',
    website: 'https://globalhealth-demo.com',
    phone: '+34 914 567 890',
    email: 'info@globalhealth-demo.com'
  }
];

// Datos para los usuarios de ejemplo
const DEMO_USERS = [
  // TechSolutions Inc.
  [
    {
      firstName: 'Carlos',
      lastName: 'Martínez',
      position: 'CEO',
      email: 'carlos.martinez@techsolutions-demo.com',
      phone: '+34 600 123 456',
      roles: ['ADMIN', 'USER'],
      plan: PLANS.PREMIUM
    },
    {
      firstName: 'Laura',
      lastName: 'García',
      position: 'CTO',
      email: 'laura.garcia@techsolutions-demo.com',
      phone: '+34 600 234 567',
      roles: ['ADMIN', 'USER'],
      plan: PLANS.PREMIUM
    },
    {
      firstName: 'Javier',
      lastName: 'López',
      position: 'Desarrollador Senior',
      email: 'javier.lopez@techsolutions-demo.com',
      phone: '+34 600 345 678',
      roles: ['USER'],
      plan: PLANS.BASIC
    },
    {
      firstName: 'Elena',
      lastName: 'Sánchez',
      position: 'Diseñadora UX/UI',
      email: 'elena.sanchez@techsolutions-demo.com',
      phone: '+34 600 456 789',
      roles: ['USER'],
      plan: PLANS.BASIC
    }
  ],
  // InnovaDesign
  [
    {
      firstName: 'Miguel',
      lastName: 'Fernández',
      position: 'Director Creativo',
      email: 'miguel.fernandez@innovadesign-demo.com',
      phone: '+34 601 234 567',
      roles: ['ADMIN', 'USER'],
      plan: PLANS.PREMIUM
    },
    {
      firstName: 'Ana',
      lastName: 'Rodríguez',
      position: 'Directora de Arte',
      email: 'ana.rodriguez@innovadesign-demo.com',
      phone: '+34 601 345 678',
      roles: ['ADMIN', 'USER'],
      plan: PLANS.PREMIUM
    },
    {
      firstName: 'Pablo',
      lastName: 'Gómez',
      position: 'Diseñador Gráfico',
      email: 'pablo.gomez@innovadesign-demo.com',
      phone: '+34 601 456 789',
      roles: ['USER'],
      plan: PLANS.BASIC
    }
  ],
  // Global Health Services
  [
    {
      firstName: 'Isabel',
      lastName: 'Torres',
      position: 'Directora General',
      email: 'isabel.torres@globalhealth-demo.com',
      phone: '+34 602 123 456',
      roles: ['ADMIN', 'USER'],
      plan: PLANS.PREMIUM
    },
    {
      firstName: 'Daniel',
      lastName: 'Moreno',
      position: 'Director Médico',
      email: 'daniel.moreno@globalhealth-demo.com',
      phone: '+34 602 234 567',
      roles: ['ADMIN', 'USER'],
      plan: PLANS.PREMIUM
    },
    {
      firstName: 'Sara',
      lastName: 'Jiménez',
      position: 'Coordinadora de Servicios',
      email: 'sara.jimenez@globalhealth-demo.com',
      phone: '+34 602 345 678',
      roles: ['USER'],
      plan: PLANS.BASIC
    },
    {
      firstName: 'Rubén',
      lastName: 'Castro',
      position: 'Especialista en Marketing',
      email: 'ruben.castro@globalhealth-demo.com',
      phone: '+34 602 456 789',
      roles: ['USER'],
      plan: PLANS.BASIC
    }
  ]
];

// Función para generar un ID de suscripción de Stripe ficticio
function generateFakeStripeSubscriptionId() {
  return `sub_${Math.random().toString(36).substring(2, 15)}`;
}

// Función para generar un ID de cliente de Stripe ficticio
function generateFakeStripeCustomerId() {
  return `cus_${Math.random().toString(36).substring(2, 15)}`;
}

// Función principal para generar datos
async function generateDemoData() {
  try {
    log.blue('🚀 Iniciando generación de datos de demostración para Nkripta');
    
    // Comprobar conexión a la base de datos
    await sequelize.authenticate();
    log.green('✅ Conexión a la base de datos establecida');
    
    // Sincronizar base de datos para asegurar que existen las tablas
    log.yellow('🔄 Sincronizando modelos con base de datos...');
    try {
      // Forzar recreación de tablas (esto eliminará los datos existentes)
      await sequelize.sync({ force: true });
      
      log.green('✅ Modelos sincronizados con la base de datos');
    } catch (syncError) {
      log.yellow('⚠️ Error al sincronizar algunos modelos: ' + syncError.message);
      console.error(syncError);
    }
    
    // No es necesario limpiar datos ya que sync({ force: true }) recreó las tablas
    log.green('✅ Tablas recreadas correctamente, no es necesario limpiar datos');
    
    // Crear organizaciones
    const organizations = [];
    log.blue('\n📊 Creando organizaciones...');
    
    for (const orgData of DEMO_ORGANIZATIONS) {
      const organization = await Organization.create({
        ...orgData,
        id: uuidv4()
      });
      
      organizations.push(organization);
      log.green(`✅ Organización creada: ${organization.name} (${organization.id})`);
    }
    
    // Crear perfiles y suscripciones
    log.blue('\n👥 Creando perfiles y suscripciones...');
    
    for (let i = 0; i < organizations.length; i++) {
      const organization = organizations[i];
      const usersData = DEMO_USERS[i];
      
      log.yellow(`\n🏢 Organización: ${organization.name}`);
      
      for (const userData of usersData) {
        // Crear perfil
        const profileId = uuidv4();
        const profile = await Profile.create({
          ...userData,
          id: profileId,
          organizationId: organization.id,
          stripeCustomerId: generateFakeStripeCustomerId(),
          cognitoUsername: uuidv4(),
          sub: uuidv4()
        });
        
        log.green(`  ✅ Perfil creado: ${profile.firstName} ${profile.lastName} (${profile.email})`);
        
        // Crear cliente real en Stripe
        let stripeCustomerId;
        try {
          // Intentar crear un cliente real en Stripe
          const customer = await stripe.customers.create({
            email: profile.email,
            name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
            metadata: {
              profileId: profile.id,
              organizationId: profile.organizationId
            }
          });
          
          // Actualizar el perfil con el ID de cliente real
          stripeCustomerId = customer.id;
          profile.stripeCustomerId = stripeCustomerId;
          await profile.save();
          
          log.green(`    ✅ Cliente Stripe creado: ${stripeCustomerId}`);
        } catch (stripeError) {
          log.yellow(`    ⚠️ No se pudo crear cliente en Stripe: ${stripeError.message}`);
          // Mantener el ID ficticio
          stripeCustomerId = profile.stripeCustomerId;
        }
        
        // Crear producto y precio en Stripe
        try {
          // 1. Primero crear un producto
          const product = await stripe.products.create({
            name: userData.plan.name,
            metadata: {
              plan_id: userData.plan.id
            }
          });
          
          // 2. Luego crear un precio para ese producto
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(userData.plan.price * 100),
            currency: 'eur',
            recurring: {
              interval: 'month'
            }
          });
          
          // 3. Finalmente crear la suscripción con ese precio
          const stripeSubscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [
              {
                price: price.id
              }
            ],
            metadata: {
              profileId: profile.id,
              organizationId: organization.id
            }
          });
          
          log.cyan(`    💰 Suscripción Stripe creada: ${userData.plan.name} (${userData.plan.price}€) - ID: ${stripeSubscription.id}`);
        } catch (stripeError) {
          log.yellow(`    ⚠️ No se pudo crear suscripción en Stripe: ${stripeError.message}`);
          log.cyan(`    💰 Simulando suscripción: ${userData.plan.name} (${userData.plan.price}€)`);
        }
      }
    }
    
    // Estadísticas finales
    const organizationCount = await Organization.count();
    const profileCount = await Profile.count();
    
    // Intentar obtener el número de suscripciones desde Stripe
    let subscriptionCount = 0;
    try {
      const subscriptions = await stripe.subscriptions.list({
        limit: 100
      });
      subscriptionCount = subscriptions.data.length;
    } catch (error) {
      log.yellow('⚠️ No se pudo obtener el número de suscripciones desde Stripe');
    }
    
    log.blue('\n📈 Estadísticas de datos generados:');
    log.yellow(`  🏢 Organizaciones: ${organizationCount}`);
    log.yellow(`  👥 Perfiles: ${profileCount}`);
    log.yellow(`  💰 Suscripciones Stripe: ${subscriptionCount}`);
    
    log.green('\n✅ Datos de demostración generados correctamente');
    
    // Cerrar conexión
    await sequelize.close();
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error al generar datos de demostración:');
    console.error(error);
    
    // Cerrar conexión en caso de error
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('\x1b[31m%s\x1b[0m', 'Error adicional al cerrar la conexión:', closeError);
    }
    
    process.exit(1);
  }
}

// Ejecutar la función principal
generateDemoData();