// scripts/cognito-test.js
const AWS = require('aws-sdk');

// Configurar cliente de cognito
const cognitoConfig = {
  region: 'us-east-1',
  endpoint: 'http://localhost:9229',
  accessKeyId: 'LOCAL_FAKE_KEY',
  secretAccessKey: 'LOCAL_FAKE_SECRET'
};

const cognito = new AWS.CognitoIdentityServiceProvider(cognitoConfig);

async function testCognito() {
  try {
    console.log('Probando conexión con Cognito Local...');

    // Listar User Pools existentes
    console.log('Listando User Pools...');
    const listResult = await cognito.listUserPools({
      MaxResults: 10
    }).promise();

    console.log('User Pools:', JSON.stringify(listResult, null, 2));

    // Crear un User Pool de prueba
    console.log('Creando User Pool de prueba...');
    const createResult = await cognito.createUserPool({
      PoolName: 'test-pool',
      AutoVerifiedAttributes: ['email']
    }).promise();

    console.log('User Pool creado:', JSON.stringify(createResult, null, 2));

    // Crear un cliente para el User Pool
    const userPoolId = createResult.UserPool.Id;
    console.log('Creando cliente para el User Pool...');
    
    const clientResult = await cognito.createUserPoolClient({
      UserPoolId: userPoolId,
      ClientName: 'test-client',
      GenerateSecret: false
    }).promise();

    console.log('Cliente creado:', JSON.stringify(clientResult, null, 2));

    console.log('Test completado con éxito!');
  } catch (error) {
    console.error('Error en el test de Cognito:', error);
  }
}

testCognito();