# Tests para nkripta_admin

Este directorio contiene pruebas automatizadas para verificar el funcionamiento correcto del backend.

## Estructura de tests

Los tests están organizados por módulos:

- **auth.test.js**: Autenticación (login, registro, token)
- **organizations.test.js**: Gestión de organizaciones
- **profiles.test.js**: Gestión de perfiles de usuario
- **subscriptions.test.js**: Gestión de suscripciones
- **integration.test.js**: Pruebas end-to-end entre módulos

## Ejecución de tests

### Preparación

Los tests requieren que el entorno Docker esté en ejecución:

```bash
docker compose up -d
```

Instalar las dependencias de desarrollo:

```bash
npm install
```

### Ejecución secuencial

Para ejecutar todos los tests en el orden correcto:

```bash
node tests/run-tests.js
```

Este script ejecuta las pruebas secuencialmente, asegurando que los datos generados por un test estén disponibles para los siguientes.

### Ejecución individual

Para ejecutar un test específico:

```bash
npx jest tests/auth.test.js
```

## Estado compartido

Los tests utilizan un estado compartido a través del archivo `setup.js`. Esto permite que los tests dependan de datos creados por tests anteriores, por ejemplo:

1. `auth.test.js` genera un token de autenticación
2. `organizations.test.js` usa ese token para crear y manipular organizaciones
3. `profiles.test.js` usa el ID de organización creado previamente

## Mocking

Los tests están diseñados para interactuar con el entorno de desarrollo completo, incluyendo:

- Base de datos PostgreSQL real
- Simulador de Cognito
- Simulador de Stripe

No utilizan mocks para probar la funcionalidad real e integraciones.

## Añadir nuevos tests

Para añadir nuevos tests:

1. Crear un nuevo archivo `nombre.test.js`
2. Importar el estado compartido desde `setup.js`
3. Seguir las convenciones existentes

Ejemplo:

```javascript
const { TEST_STATE, API_URL } = require('./setup');

describe('Mi nuevo test', () => {
  // Configurar header con token de autenticación
  const headers = () => ({ 
    Authorization: `Bearer ${TEST_STATE.auth.token}` 
  });
  
  test('Mi caso de prueba', async () => {
    const response = await axios.get(
      `${API_URL}/mi-endpoint`, 
      { headers: headers() }
    );
    
    expect(response.status).toBe(200);
  });
});
```