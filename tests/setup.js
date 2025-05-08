/**
 * Test setup para nkripta_admin
 * 
 * Este archivo configura el entorno de pruebas e incluye funciones
 * de utilidad comunes para los tests.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno en el siguiente orden:
// 1. .env.test (configuración específica para tests)
// 2. .env (configuración general)
const envTestPath = path.resolve(__dirname, '../.env.test');

if (fs.existsSync(envTestPath)) {
  console.log('Cargando variables de entorno desde .env.test');
  dotenv.config({ path: envTestPath });
} else {
  console.log('Archivo .env.test no encontrado, usando .env');
  dotenv.config();
}

// Estado global para datos de prueba
const TEST_STATE = {
  auth: {
    // Token generado manualmente para pruebas (con fecha de expiración actualizada)
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNjRlNTJlOS1lMGI0LTRhZmEtOTBiMi05YzZiNWJmMWU4Y2QiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicHJvZmlsZUlkIjoiOTAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwib3JnYW5pemF0aW9uSWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE3NDY3MjE5NDYsImV4cCI6MTc0NjgwODM0Nn0.iZL6MgK586rnUxci4zROkUGl_pOfRvu-PZJEv6NvOXg",
    refreshToken: null, // No usamos refresh token en las pruebas
    profileId: "90000000-0000-0000-0000-000000000000"
  },
  organization: {
    id: "00000000-0000-0000-0000-000000000000",
    name: 'Organización de Prueba'
  },
  profile: {
    id: "90000000-0000-0000-0000-000000000000",
    email: "admin@example.com"
  },
  subscription: {
    id: null
  }
};

// Credenciales de prueba
const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@example.com',
    password: 'Password123'
  },
  testUser: {
    firstName: 'Usuario',
    lastName: 'Prueba',
    email: `user.${Date.now()}@example.com`,
    password: 'Password123'
  }
};

// URL base para la API
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Información de diagnóstico en modo verboso
console.log('Configuración de pruebas cargada:');
console.log('- URL API:', API_URL);
console.log('- Usuario de prueba:', TEST_CREDENTIALS.admin.email);
console.log('- Cognito UserPool:', process.env.COGNITO_USER_POOL_ID);
console.log('- Cognito ClientId:', process.env.COGNITO_CLIENT_ID);
console.log('- Cognito Endpoint:', process.env.COGNITO_ENDPOINT);

// Exportar constantes y estado compartido
module.exports = {
  TEST_STATE,
  TEST_CREDENTIALS,
  API_URL
};