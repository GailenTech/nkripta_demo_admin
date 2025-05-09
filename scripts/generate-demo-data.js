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
const Subscription = require('../src/models/subscription');
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
      // Sincronizar todo el esquema
      await sequelize.sync({ alter: true });
      
      // Sincronizar cada modelo individualmente para asegurar
      await Organization.sync({ alter: true });
      await Profile.sync({ alter: true });
      await Subscription.sync({ alter: true });
      
      log.green('✅ Modelos sincronizados con la base de datos');
    } catch (syncError) {
      log.yellow('⚠️ Error al sincronizar algunos modelos: ' + syncError.message);
      console.error(syncError);
    }
    
    // Limpiar datos existentes
    log.yellow('🧹 Limpiando datos existentes...');
    try {
      await Subscription.destroy({ where: {} });
      await Profile.destroy({ where: {} });
      await Organization.destroy({ where: {} });
      log.green('✅ Datos existentes eliminados correctamente');
    } catch (cleanError) {
      log.yellow('⚠️ Error al limpiar datos existentes, continuando con la creación...');
      console.error(cleanError);
    }
    
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
        
        // Crear suscripción
        const now = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        
        const subscription = await Subscription.create({
          id: uuidv4(),
          stripeSubscriptionId: generateFakeStripeSubscriptionId(),
          profileId: profile.id,
          organizationId: organization.id,
          planType: userData.plan.id,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: false,
          createdAt: now,
          updatedAt: now
        });
        
        log.cyan(`    💰 Suscripción creada: ${userData.plan.name} (${userData.plan.price}€)`);
      }
    }
    
    // Estadísticas finales
    const organizationCount = await Organization.count();
    const profileCount = await Profile.count();
    const subscriptionCount = await Subscription.count();
    
    log.blue('\n📈 Estadísticas de datos generados:');
    log.yellow(`  🏢 Organizaciones: ${organizationCount}`);
    log.yellow(`  👥 Perfiles: ${profileCount}`);
    log.yellow(`  💰 Suscripciones: ${subscriptionCount}`);
    
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