// src/config/auth.js
// Configuración para autenticación (solución temporal)

// Token JWT estático para desarrollo
// IMPORTANTE: Esto es solo una solución temporal, en producción debe implementarse una autenticación real
// Este token ha sido generado con la clave secreta 'jwt_local_secret_key_for_development' (igual que en el backend)
// Los valores profileId y organizationId corresponden a un perfil real con rol ADMIN
export const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi11c2VyLWlkIiwiZW1haWwiOiJhZG1pbkBua3JpcHRhLmNvbSIsInByb2ZpbGVJZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMSIsIm9yZ2FuaXphdGlvbklkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwicm9sZXMiOlsiQURNSU4iLCJVU0VSIl0sImlhdCI6MTY5NjE3Mzc2OSwiZXhwIjo0MTAyNDQ0ODAwfQ.kXaXsOWQQDTsZbkK9Cg7QZ8Q7dhYiRmXfm0RXNtZmKI';

// Función para obtener los headers de autenticación
export const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  };
};

export default {
  AUTH_TOKEN,
  getAuthHeaders
};