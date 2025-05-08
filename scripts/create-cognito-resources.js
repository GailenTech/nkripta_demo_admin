// scripts/create-cognito-resources.js
// Script para crear recursos en cognito-local al iniciar

const AWS = require('aws-sdk');
require('dotenv').config();

// Configurar cliente de cognito
const cognitoConfig = {
  region: process.env.COGNITO_REGION,
  endpoint: process.env.COGNITO_ENDPOINT || 'http://localhost:9229',  // Usar variable de entorno o localhost como fallback
  accessKeyId: 'LOCAL_FAKE_KEY',
  secretAccessKey: 'LOCAL_FAKE_SECRET'
};

const cognito = new AWS.CognitoIdentityServiceProvider(cognitoConfig);

// Configuraciones
const USER_POOL_NAME = 'nkripta-user-pool';
const CLIENT_NAME = 'nkripta-client';

async function createResources() {
  try {
    console.log('Creando recursos en Cognito Local...');

    // Crear UserPool
    console.log('Creando User Pool...');
    const userPoolResult = await cognito.createUserPool({
      PoolName: USER_POOL_NAME,
      AutoVerifiedAttributes: ['email'],
      Schema: [
        {
          Name: 'email',
          Required: true
        },
        {
          Name: 'custom:organizationId',
          Required: false
        }
      ]
    }).promise();

    const userPoolId = userPoolResult.UserPool.Id;
    console.log(`User Pool creado con ID: ${userPoolId}`);

    // Crear App Client
    console.log('Creando App Client...');
    const clientResult = await cognito.createUserPoolClient({
      UserPoolId: userPoolId,
      ClientName: CLIENT_NAME,
      GenerateSecret: false,
      ExplicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH'
      ]
    }).promise();

    const clientId = clientResult.UserPoolClient.ClientId;
    console.log(`App Client creado con ID: ${clientId}`);

    console.log('\n=== Información para actualizar .env ===');
    console.log(`COGNITO_USER_POOL_ID=${userPoolId}`);
    console.log(`COGNITO_CLIENT_ID=${clientId}`);
    console.log(`COGNITO_REGION=${process.env.COGNITO_REGION}`);
    console.log('=========================================\n');

    return {
      userPoolId,
      clientId
    };
  } catch (error) {
    console.error('Error al crear recursos en Cognito:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createResources()
    .then(() => {
      console.log('Configuración completada correctamente.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error en la configuración:', err);
      process.exit(1);
    });
}

module.exports = { createResources };