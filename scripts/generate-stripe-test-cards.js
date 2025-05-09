#!/usr/bin/env node

/**
 * Script para generar tarjetas de prueba de Stripe para usuarios de demostración
 * 
 * Este script genera información detallada sobre tarjetas de prueba que pueden 
 * usarse con los usuarios de demostración para probar flujos de pago.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Definición de tarjetas de prueba de Stripe para diferentes escenarios
const STRIPE_TEST_CARDS = [
  {
    type: 'Visa (Pago exitoso)',
    number: '4242 4242 4242 4242',
    expiry: '12/34',
    cvc: '123',
    zip: '12345',
    description: 'Siempre tiene éxito y autentica sin 3D Secure'
  },
  {
    type: 'Visa (Requiere autenticación)',
    number: '4000 0025 0000 3155',
    expiry: '12/34',
    cvc: '123',
    zip: '12345',
    description: 'Requiere autenticación 3D Secure'
  },
  {
    type: 'Visa (Pagos rechazados)',
    number: '4000 0000 0000 0002',
    expiry: '12/34',
    cvc: '123',
    zip: '12345',
    description: 'El cargo siempre es rechazado'
  },
  {
    type: 'Mastercard (Pago exitoso)',
    number: '5555 5555 5555 4444',
    expiry: '12/34',
    cvc: '123',
    zip: '12345',
    description: 'Siempre tiene éxito y autentica sin 3D Secure'
  },
  {
    type: 'American Express (Pago exitoso)',
    number: '3782 822463 10005',
    expiry: '12/34',
    cvc: '1234',
    zip: '12345',
    description: 'Siempre tiene éxito y autentica sin 3D Secure'
  }
];

// Usuarios de demostración
const DEMO_USERS = [
  {
    name: 'Carlos Martínez',
    email: 'carlos.martinez@techsolutions-demo.com',
    organization: 'TechSolutions Inc.',
    role: 'CEO',
    plan: 'Premium (29.99€)'
  },
  {
    name: 'Miguel Fernández',
    email: 'miguel.fernandez@innovadesign-demo.com',
    organization: 'InnovaDesign',
    role: 'Director Creativo',
    plan: 'Premium (29.99€)'
  },
  {
    name: 'Isabel Torres',
    email: 'isabel.torres@globalhealth-demo.com',
    organization: 'Global Health Services',
    role: 'Directora General',
    plan: 'Premium (29.99€)'
  },
  {
    name: 'Javier López',
    email: 'javier.lopez@techsolutions-demo.com',
    organization: 'TechSolutions Inc.',
    role: 'Desarrollador Senior',
    plan: 'Básico (9.99€)'
  }
];

// Función para generar un archivo markdown con la información
function generateStripeCardsMarkdown() {
  const outputPath = path.join(__dirname, '..', 'STRIPE_TEST_CARDS.md');
  
  let markdown = `# Tarjetas de Prueba de Stripe para Nkripta Demo

Este documento contiene información sobre tarjetas de prueba de Stripe que pueden usarse 
con los usuarios de demostración para probar flujos de pago en Nkripta.

## Tarjetas de Prueba

| Tipo | Número | Expiración | CVC | Código Postal | Descripción |
|------|--------|------------|-----|--------------|-------------|
`;

  // Añadir información de tarjetas
  STRIPE_TEST_CARDS.forEach(card => {
    markdown += `| ${card.type} | \`${card.number}\` | ${card.expiry} | ${card.cvc} | ${card.zip} | ${card.description} |\n`;
  });

  markdown += `
## Usuarios de Demostración

| Nombre | Email | Organización | Cargo | Plan |
|--------|-------|--------------|-------|------|
`;

  // Añadir información de usuarios
  DEMO_USERS.forEach(user => {
    markdown += `| ${user.name} | ${user.email} | ${user.organization} | ${user.role} | ${user.plan} |\n`;
  });

  markdown += `
## Cómo Usar

1. Inicia sesión como uno de los usuarios de demostración
2. Navega a la sección de suscripciones
3. Selecciona el plan deseado
4. Utiliza una de las tarjetas de prueba para simular el pago

## Notas Importantes

- Estas tarjetas solo funcionan en modo de prueba de Stripe
- No se realizan cargos reales a estas tarjetas
- Para probar rechazos, usa la tarjeta \`4000 0000 0000 0002\`
- Para probar autenticación 3D Secure, usa la tarjeta \`4000 0025 0000 3155\`

## Errores Comunes

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| \`card_declined\` | Su tarjeta fue rechazada | Simulación de rechazo de tarjeta |
| \`expired_card\` | Su tarjeta ha expirado | Simulación de tarjeta expirada |
| \`incorrect_cvc\` | El código de seguridad de su tarjeta es incorrecto | Simulación de CVC incorrecto |
| \`processing_error\` | Ocurrió un error procesando su tarjeta | Simulación de error general |

Para más información, consulta la [documentación de Stripe sobre tarjetas de prueba](https://stripe.com/docs/testing).
`;

  // Escribir archivo
  fs.writeFileSync(outputPath, markdown);
  
  console.log(chalk.green(`✅ Archivo de tarjetas de prueba generado en: ${outputPath}`));
}

// Ejecutar generación
try {
  generateStripeCardsMarkdown();
} catch (error) {
  console.error(chalk.red('❌ Error al generar archivo de tarjetas de prueba:'), error);
  process.exit(1);
}