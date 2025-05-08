/**
 * Script para configurar el entorno de pruebas
 * Este script prepara Cognito Local y los datos necesarios para las pruebas
 */

const AWS = require('aws-sdk');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Configurar cliente de cognito
const cognitoConfig = {
  region: process.env.COGNITO_REGION || 'us-east-1',
  endpoint: process.env.COGNITO_ENDPOINT || 'http://localhost:9229',
  accessKeyId: 'LOCAL_FAKE_KEY',
  secretAccessKey: 'LOCAL_FAKE_SECRET'
};

console.log('Usando configuración de Cognito:', {
  region: cognitoConfig.region,
  endpoint: cognitoConfig.endpoint
});

const cognito = new AWS.CognitoIdentityServiceProvider(cognitoConfig);

// Configuraciones
const USER_POOL_NAME = 'nkripta-test-pool';
const CLIENT_NAME = 'nkripta-test-client';
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'Password123';
const ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000';

async function setupTestEnvironment() {
  try {
    console.log('Configurando entorno de pruebas...');
    
    // 1. Crear User Pool para pruebas
    console.log('Creando User Pool para pruebas...');
    let userPoolId;
    
    try {
      const listUserPoolsResponse = await cognito.listUserPools({
        MaxResults: 60
      }).promise();
      
      // Buscar si ya existe un pool con el mismo nombre
      const existingPool = listUserPoolsResponse.UserPools.find(
        pool => pool.Name === USER_POOL_NAME
      );
      
      if (existingPool) {
        userPoolId = existingPool.Id;
        console.log(`User Pool existente encontrado: ${userPoolId}`);
      } else {
        // Crear nuevo pool
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

        userPoolId = userPoolResult.UserPool.Id;
        console.log(`User Pool creado con ID: ${userPoolId}`);
      }
    } catch (error) {
      console.warn('Error al obtener/crear User Pool:', error.message);
      console.log('Usando User Pool ID de .env como fallback');
      userPoolId = process.env.COGNITO_USER_POOL_ID;
    }

    // 2. Crear/buscar App Client
    console.log('Creando App Client para pruebas...');
    let clientId;
    
    try {
      const listClientsResponse = await cognito.listUserPoolClients({
        UserPoolId: userPoolId,
        MaxResults: 60
      }).promise();
      
      // Buscar si ya existe un client con el mismo nombre
      const existingClient = listClientsResponse.UserPoolClients.find(
        client => client.ClientName === CLIENT_NAME
      );
      
      if (existingClient) {
        clientId = existingClient.ClientId;
        console.log(`App Client existente encontrado: ${clientId}`);
      } else {
        // Crear nuevo client
        const clientResult = await cognito.createUserPoolClient({
          UserPoolId: userPoolId,
          ClientName: CLIENT_NAME,
          GenerateSecret: false,
          ExplicitAuthFlows: [
            'ALLOW_USER_PASSWORD_AUTH',
            'ALLOW_REFRESH_TOKEN_AUTH'
          ]
        }).promise();

        clientId = clientResult.UserPoolClient.ClientId;
        console.log(`App Client creado con ID: ${clientId}`);
      }
    } catch (error) {
      console.warn('Error al obtener/crear App Client:', error.message);
      console.log('Usando Client ID de .env como fallback');
      clientId = process.env.COGNITO_CLIENT_ID;
    }

    // 3. Registrar usuario de prueba
    console.log(`Registrando usuario de prueba: ${TEST_EMAIL}`);
    try {
      // Primero intentamos listar usuarios para ver si ya existe
      const listUsersResponse = await cognito.listUsers({
        UserPoolId: userPoolId,
        Filter: `email = "${TEST_EMAIL}"`
      }).promise();
      
      if (listUsersResponse.Users && listUsersResponse.Users.length > 0) {
        console.log('Usuario de prueba ya existente');
      } else {
        // Registrar usuario
        const signUpParams = {
          ClientId: clientId,
          Username: TEST_EMAIL,
          Password: TEST_PASSWORD,
          UserAttributes: [
            {
              Name: 'email',
              Value: TEST_EMAIL
            },
            {
              Name: 'custom:organizationId',
              Value: ORGANIZATION_ID
            }
          ]
        };

        await cognito.signUp(signUpParams).promise();
        console.log('Usuario registrado en Cognito');

        // Auto-confirmar el email del usuario
        const confirmParams = {
          UserPoolId: userPoolId,
          Username: TEST_EMAIL
        };
        
        await cognito.adminConfirmSignUp(confirmParams).promise();
        console.log('Usuario confirmado');
      }
    } catch (error) {
      console.warn('Error al registrar/confirmar usuario:', error.message);
      console.log('Continuando con las pruebas de todos modos');
    }

    // 4. Actualizar archivo .env.test con estos valores
    const envTestContent = `
# Configuración para pruebas
NODE_ENV=test
PORT=3000

# PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=nkripta_test
DB_USER=postgres
DB_PASSWORD=postgres

# AWS Cognito
COGNITO_USER_POOL_ID=${userPoolId}
COGNITO_CLIENT_ID=${clientId}
COGNITO_REGION=${cognitoConfig.region}
COGNITO_ENDPOINT=${cognitoConfig.endpoint}

# Stripe
STRIPE_SECRET_KEY=sk_test_yoursecretkey
STRIPE_WEBHOOK_SECRET=whsec_yoursecretkey

# JWT
JWT_SECRET=test_secret_key
JWT_EXPIRES_IN=1d
`;

    fs.writeFileSync(path.join(__dirname, '..', '.env.test'), envTestContent);
    console.log('Archivo .env.test creado/actualizado');

    // 5. Actualizar el archivo setup.js de tests para usar estos valores
    console.log('\n===== CREDENCIALES DE PRUEBA ACTUALIZADAS =====');
    console.log(`UserPoolId: ${userPoolId}`);
    console.log(`ClientId: ${clientId}`);
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    console.log('============================================\n');

    return {
      userPoolId,
      clientId,
      testEmail: TEST_EMAIL,
      testPassword: TEST_PASSWORD
    };
  } catch (error) {
    console.error('Error general al configurar entorno de pruebas:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupTestEnvironment()
    .then(() => {
      console.log('Configuración del entorno de pruebas completada con éxito.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error en la configuración del entorno de pruebas:', err);
      process.exit(1);
    });
}

module.exports = { setupTestEnvironment };