# Interfaz de Administración de Nkripta

Esta interfaz proporciona funcionalidades para visualizar y gestionar organizaciones, perfiles de usuario y suscripciones en el sistema Nkripta.

## Requisitos

- Node.js y npm instalados
- API de Nkripta ejecutándose en http://localhost:3000
- Datos de demostración cargados (opcional)

## Instalación

```bash
# Desde el directorio nkripta-admin-ui
npm install
```

## Ejecución

```bash
# Desde el directorio nkripta-admin-ui
npm start
```

La aplicación se iniciará en http://localhost:3000 o el siguiente puerto disponible.

## Funcionalidades

- **Organizaciones**: Visualización y gestión de compañías
- **Perfiles**: Visualización y gestión de usuarios 
- **Suscripciones**: Visualización y gestión del estado de suscripciones
  - Pausar suscripciones (cancelar al final del período)
  - Reanudar suscripciones pausadas
  - Cancelar suscripciones inmediatamente
  - Ver historial de pagos y facturas

## Estructura de la Aplicación

- `/src/App.js`: Componente principal con la estructura general
- `/src/components/`: Componentes de React para cada sección
  - `/organizations/`: Componentes para gestión de organizaciones
  - `/profiles/`: Componentes para gestión de perfiles
  - `/subscriptions/`: Componentes para gestión de suscripciones
  - `CreateSubscriptionDialog.js`: Diálogo para crear suscripciones
  - `SubscriptionDetailDialog.js`: Diálogo con detalles y acciones sobre suscripciones
- `/src/config/auth.js`: Configuración de autenticación para entorno de desarrollo

## Autenticación

Para el entorno de desarrollo, se utiliza un token JWT estático que se incluye en todas las peticiones a la API. Este token está configurado en `src/config/auth.js` y proporciona acceso administrativo completo.

```javascript
// En src/config/auth.js
export const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  };
};
```

Este token se utiliza en todas las llamadas a la API mediante la función `getAuthHeaders()`.

> ⚠️ **IMPORTANTE**: Esta solución es solo para entorno de desarrollo. En producción, se debe implementar autenticación real con Cognito o un sistema similar.

## Gestión de Suscripciones

La interfaz permite gestionar el ciclo de vida completo de las suscripciones:

1. **Ver detalles**: El componente `SubscriptionDetailDialog.js` muestra toda la información de una suscripción
2. **Pausar**: Marca la suscripción para cancelarse al final del período actual
3. **Reanudar**: Revierte una pausa, continuando la suscripción
4. **Cancelar**: Cancela inmediatamente la suscripción

En entorno de desarrollo, se utiliza un sistema de estado en memoria en el backend para simular estas operaciones sin necesidad de Stripe.

## Datos de Demostración

Para poblar la base de datos con datos de demostración, ejecuta desde el directorio raíz:

```bash
./scripts/init-demo-db.sh
```

## Solución de Problemas

### Errores de autenticación

Si recibes errores 401 o 403:

1. Verifica que el backend tenga habilitada la autenticación de desarrollo:
   ```javascript
   // En el backend, middleware/auth.js debe contener:
   if (process.env.NODE_ENV === 'development') {
     // Set a default admin user for demo purposes
     req.user = {
       profileId: '00000000-0000-0000-0000-000000000000',
       roles: ['ADMIN', 'USER'],
       // ...
     };
     return next();
   }
   ```

2. Asegúrate de que el token en `src/config/auth.js` coincide con el aceptado por el backend

### La UI no se inicia

1. Verifica dependencias:
   ```bash
   npm install
   ```

2. Comprueba que no hay otro servicio en el mismo puerto:
   ```bash
   lsof -i :3000
   ```

## Notas sobre el Control de Versiones

Esta interfaz ahora está bajo control de versiones en git. Anteriormente se excluía del repositorio, pero desde mayo de 2025 se ha incluido directamente para facilitar la colaboración.

El script original `create-admin-ui.sh` que generaba esta UI se mantiene por referencia histórica, pero ya no es necesario usarlo para reconstruir la interfaz.