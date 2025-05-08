// scripts/register-user.js
// Script para registrar un usuario de prueba

const AWS = require('aws-sdk');
require('dotenv').config();

// Configurar cliente de cognito
const cognitoConfig = {
  region: process.env.COGNITO_REGION,
  endpoint: process.env.COGNITO_ENDPOINT || 'http://localhost:9229',
  accessKeyId: 'LOCAL_FAKE_KEY',
  secretAccessKey: 'LOCAL_FAKE_SECRET'
};

const cognito = new AWS.CognitoIdentityServiceProvider(cognitoConfig);

async function registerUser() {
  try {
    const email = 'admin@example.com';
    const password = 'Password123';
    
    console.log(`Registrando usuario: ${email}`);

    // Registrar usuario en Cognito
    const signUpParams = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'custom:organizationId',
          Value: '00000000-0000-0000-0000-000000000000'
        }
      ]
    };

    const signUpResult = await cognito.signUp(signUpParams).promise();
    console.log('Usuario registrado en Cognito:', JSON.stringify(signUpResult, null, 2));

    // Auto-confirmar el email del usuario
    const confirmParams = {
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email
    };
    
    const confirmResult = await cognito.adminConfirmSignUp(confirmParams).promise();
    console.log('Usuario confirmado:', JSON.stringify(confirmResult, null, 2));

    console.log('\n===== CREDENCIALES DE PRUEBA =====');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('===================================\n');

    return signUpResult;
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    throw error;
  }
}

if (require.main === module) {
  registerUser()
    .then(() => console.log('Script completado con éxito.'))
    .catch(err => {
      console.error('Error en el script:', err);
      process.exit(1);
    });
}

module.exports = { registerUser };