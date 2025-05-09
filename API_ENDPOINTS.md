# API Endpoints de nkripta_admin

Este documento proporciona información sobre los endpoints API disponibles en la aplicación nkripta_admin.

## Estructura Base

Todos los endpoints API están bajo el prefijo base: `/api`

## Autenticación

### Login

- **URL**: `/api/auth/login`
- **Método**: `POST`
- **Descripción**: Inicia sesión con usuario y contraseña
- **Cuerpo**:
  ```json
  {
    "email": "admin@example.com",
    "password": "Password123"
  }
  ```
- **Respuesta Exitosa**:
  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "admin@example.com",
      "roles": ["ADMIN"]
    }
  }
  ```

### Verificar Usuario Actual

- **URL**: `/api/auth/me`
- **Método**: `GET`
- **Autenticación**: Requiere token JWT en el header `Authorization: Bearer {token}`
- **Descripción**: Obtiene información del usuario autenticado
- **Respuesta Exitosa**:
  ```json
  {
    "id": "user_id",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "organizationId": "org_id",
    "roles": ["ADMIN"]
  }
  ```

### Registro (para desarrollo/pruebas)

- **URL**: `/api/auth/register`
- **Método**: `POST`
- **Descripción**: Registra un nuevo usuario con organización
- **Cuerpo**:
  ```json
  {
    "email": "nuevo@example.com",
    "password": "Password123",
    "firstName": "Nuevo",
    "lastName": "Usuario",
    "organizationId": "org_id"
  }
  ```

## Organizaciones

### Listar Organizaciones

- **URL**: `/api/organizations`
- **Método**: `GET`
- **Autenticación**: Requiere token JWT
- **Descripción**: Obtiene una lista paginada de organizaciones
- **Parámetros Query**: `page`, `limit`
- **Respuesta Exitosa**:
  ```json
  {
    "items": [
      {
        "id": "org_id",
        "name": "Organización Ejemplo",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
  ```

### Obtener Organización

- **URL**: `/api/organizations/:organizationId`
- **Método**: `GET`
- **Autenticación**: Requiere token JWT
- **Descripción**: Obtiene detalles de una organización específica
- **Respuesta Exitosa**:
  ```json
  {
    "id": "org_id",
    "name": "Organización Ejemplo",
    "description": "Descripción de la organización",
    "email": "org@example.com",
    "phone": "+1234567890",
    "website": "https://example.com",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
  ```

### Crear Organización

- **URL**: `/api/organizations`
- **Método**: `POST`
- **Autenticación**: Requiere token JWT con rol ADMIN
- **Descripción**: Crea una nueva organización
- **Cuerpo**:
  ```json
  {
    "name": "Nueva Organización",
    "description": "Descripción de la nueva organización",
    "email": "nueva@example.com",
    "phone": "+1234567890",
    "website": "https://nueva.example.com"
  }
  ```

### Actualizar Organización

- **URL**: `/api/organizations/:organizationId`
- **Método**: `PUT`
- **Autenticación**: Requiere token JWT con rol ADMIN
- **Descripción**: Actualiza una organización existente
- **Cuerpo**: Similar al de creación, campos opcionales

### Obtener Miembros de una Organización

- **URL**: `/api/organizations/:organizationId/members`
- **Método**: `GET`
- **Autenticación**: Requiere token JWT con rol ADMIN o pertenencia a la organización
- **Descripción**: Obtiene perfiles de usuarios pertenecientes a una organización
- **Parámetros Query**: `page`, `limit`
- **Respuesta Exitosa**:
  ```json
  {
    "items": [
      {
        "id": "profile_id",
        "email": "usuario@example.com",
        "firstName": "Nombre",
        "lastName": "Apellido",
        "roles": ["USER"],
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
  ```

## Perfiles

### Listar Perfiles

- **URL**: `/api/profiles`
- **Método**: `GET`
- **Autenticación**: Requiere token JWT
- **Descripción**: Obtiene una lista paginada de perfiles (filtrados por organización para usuarios no admin)
- **Parámetros Query**: `page`, `limit`
- **Respuesta Exitosa**: Similar a la de miembros de organización

### Crear Perfil

- **URL**: `/api/profiles`
- **Método**: `POST`
- **Autenticación**: Requiere token JWT con rol ADMIN
- **Descripción**: Crea un nuevo perfil de usuario en Cognito y en la base de datos
- **Cuerpo**:
  ```json
  {
    "email": "nuevo@example.com",
    "firstName": "Nuevo",
    "lastName": "Usuario",
    "organizationId": "org_id",
    "roles": ["USER"]
  }
  ```
- **Respuesta Exitosa**:
  ```json
  {
    "id": "profile_id",
    "email": "nuevo@example.com",
    "firstName": "Nuevo",
    "lastName": "Usuario",
    "organizationId": "org_id",
    "roles": ["USER"],
    "temporaryPassword": "TempXyz123!" // Solo en entorno de desarrollo
  }
  ```

### Obtener Perfil

- **URL**: `/api/profiles/:profileId`
- **Método**: `GET`
- **Autenticación**: Requiere token JWT con rol ADMIN o ser el propio usuario
- **Descripción**: Obtiene información detallada de un perfil
- **Respuesta Exitosa**:
  ```json
  {
    "id": "profile_id",
    "email": "usuario@example.com",
    "firstName": "Nombre",
    "lastName": "Apellido",
    "organizationId": "org_id",
    "roles": ["USER"],
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
  ```

### Actualizar Perfil

- **URL**: `/api/profiles/:profileId`
- **Método**: `PUT`
- **Autenticación**: Requiere token JWT con rol ADMIN o ser el propio usuario
- **Descripción**: Actualiza información de un perfil
- **Cuerpo**:
  ```json
  {
    "firstName": "Nombre Actualizado",
    "lastName": "Apellido Actualizado"
  }
  ```

## Suscripciones

Las suscripciones ahora se gestionan directamente con la API de Stripe.

### Obtener Suscripciones de un Usuario

- **URL**: `/api/billing/subscriptions`
- **Método**: `GET`
- **Autenticación**: Requiere token JWT
- **Descripción**: Obtiene las suscripciones del usuario autenticado desde Stripe

### Crear Suscripción

- **URL**: `/api/billing/subscriptions`
- **Método**: `POST`
- **Autenticación**: Requiere token JWT
- **Descripción**: Crea una nueva suscripción en Stripe
- **Cuerpo**:
  ```json
  {
    "paymentMethodId": "pm_card_visa",
    "planId": "plan_id"
  }
  ```

## Respuestas de Error

Todas las respuestas de error siguen este formato:

```json
{
  "message": "Mensaje descriptivo del error"
}
```

Los códigos de estado HTTP comunes incluyen:
- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (no autorizado)
- `404` - Not Found (recurso no encontrado)
- `409` - Conflict (conflicto, por ejemplo, email duplicado)
- `500` - Internal Server Error (error del servidor)

## Autenticación y Seguridad

Todos los endpoints (excepto `/api/auth/login` y `/api/auth/register`) requieren un token JWT válido en el header de la petición:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Los tokens tienen una duración limitada (1 día por defecto) y contienen información sobre el usuario, su organización y roles.