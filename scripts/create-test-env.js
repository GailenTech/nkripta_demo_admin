/**
 * Crea un archivo .env.test para configurar el entorno de pruebas
 * sin depender de servicios externos
 */

const fs = require('fs');
const path = require('path');

const envContent = `
# Configuración para pruebas
NODE_ENV=test
PORT=3000

# Modo de pruebas (mock, local, real)
TEST_MODE=skip_external

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nkripta_test
DB_USER=postgres
DB_PASSWORD=postgres

# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_testpoolid
COGNITO_CLIENT_ID=testclientid
COGNITO_REGION=us-east-1
COGNITO_ENDPOINT=http://localhost:9229

# Stripe
STRIPE_SECRET_KEY=sk_test_yoursecretkey
STRIPE_WEBHOOK_SECRET=whsec_yoursecretkey

# JWT
JWT_SECRET=test_secret_key
JWT_EXPIRES_IN=1d
`;

const envPath = path.join(__dirname, '..', '.env.test');
fs.writeFileSync(envPath, envContent);

console.log(`Archivo .env.test creado en ${envPath}`);
console.log('Este archivo configura un entorno de pruebas que omite las llamadas a servicios externos');