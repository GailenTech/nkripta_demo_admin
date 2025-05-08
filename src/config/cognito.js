const AWS = require('aws-sdk');

// Configurar AWS SDK
const awsConfig = {
  region: process.env.COGNITO_REGION
};

// Si estamos en entorno de desarrollo y tenemos un endpoint definido para cognito-local
if (process.env.NODE_ENV === 'development' && process.env.COGNITO_ENDPOINT) {
  console.log('Configurando Cognito para ambiente local en:', process.env.COGNITO_ENDPOINT);
  awsConfig.endpoint = process.env.COGNITO_ENDPOINT;
  // Para cognito-local necesitamos credenciales de prueba
  awsConfig.accessKeyId = 'LOCAL_FAKE_KEY';
  awsConfig.secretAccessKey = 'LOCAL_FAKE_SECRET';
}

AWS.config.update(awsConfig);

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const cognitoConfig = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID
};

module.exports = {
  cognitoIdentityServiceProvider,
  cognitoConfig
};