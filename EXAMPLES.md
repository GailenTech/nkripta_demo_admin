# Ejemplos de uso de la API

Este archivo contiene ejemplos de cómo utilizar la API de nkripta_admin con fines de demostración e integración.

## Credenciales de prueba

Para el entorno de desarrollo local, puedes usar las siguientes credenciales:

- **Email**: admin@example.com
- **Password**: Password123

## Ejecutar demostraciones automáticas

Se incluye un script que muestra ejemplos de uso de la API y sus respuestas:

```bash
# Ejecutar la demostración automática
./scripts/demo-api.sh
```

El script requiere que tengas `jq` instalado para un mejor formateo de las respuestas JSON:
- En macOS: `brew install jq`
- En Linux: `apt-get install jq`

## Ejemplos manuales con curl

### 1. Verificar el estado de la API

```bash
curl http://localhost:3000/api
```

### 2. Autenticación

#### Iniciar sesión (login)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123"}'
```

La respuesta incluirá:
- accessToken (token de Cognito)
- idToken (token de Cognito con información de usuario)
- refreshToken (para renovar la sesión)
- token (JWT para uso con la API)
- profile (información básica del perfil)

#### Obtener información del perfil autenticado

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token_jwt>"
```

### 3. Organizaciones

#### Obtener una organización específica

```bash
curl http://localhost:3000/api/organizations/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer <token_jwt>"
```

#### Obtener miembros de una organización

```bash
curl "http://localhost:3000/api/organizations/00000000-0000-0000-0000-000000000000/members?page=1&limit=10" \
  -H "Authorization: Bearer <token_jwt>"
```

#### Crear una nueva organización

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Authorization: Bearer <token_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nueva Organización",
    "description": "Descripción de la organización",
    "slug": "nueva-org",
    "website": "https://nueva-org.example.com",
    "email": "info@nueva-org.example.com",
    "phone": "+123456789"
  }'
```

#### Actualizar una organización existente

```bash
curl -X PUT http://localhost:3000/api/organizations/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer <token_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nombre Actualizado",
    "description": "Descripción actualizada"
  }'
```

### 4. Perfiles de usuario

#### Obtener un perfil específico

```bash
curl http://localhost:3000/api/profiles/90000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer <token_jwt>"
```

#### Crear un nuevo perfil

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer <token_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Nuevo",
    "lastName": "Usuario",
    "email": "nuevo@example.com",
    "organizationId": "00000000-0000-0000-0000-000000000000",
    "roles": ["USER"]
  }'
```

### 5. Suscripciones

#### Obtener suscripciones de un perfil

```bash
curl http://localhost:3000/api/billing/profiles/90000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer <token_jwt>"
```

## Ejemplos con Postman

También puedes usar Postman para interactuar con la API. Sigue estos pasos:

1. **Configura una colección en Postman**
2. **Configura una variable de entorno para la URL base**:
   - Nombre: `base_url`
   - Valor: `http://localhost:3000/api`
3. **Configura una variable de entorno para el token**:
   - Nombre: `token`
   - Valor: (déjalo vacío inicialmente)
   
4. **Crea una solicitud de login**:
   - Método: POST
   - URL: `{{base_url}}/auth/login`
   - Body (raw JSON): 
     ```json
     {
       "email": "admin@example.com",
       "password": "Password123"
     }
     ```
   - Tests (para capturar automáticamente el token):
     ```javascript
     var jsonData = pm.response.json();
     pm.environment.set("token", jsonData.token);
     ```

5. **Crea el resto de solicitudes usando la variable del token**:
   - Header de autorización: `Authorization: Bearer {{token}}`

## Notas importantes

- Todos los ejemplos asumen que el servidor está corriendo en `localhost:3000`
- Algunos endpoints requieren permisos específicos de ADMIN
- Reemplaza `<token_jwt>` con el token devuelto por el endpoint de login