# nkripta_admin

Backend para integración de PostgreSQL, Cognito y Stripe

## Configuración del entorno local con Docker

Este proyecto utiliza Docker para simplificar la configuración del entorno de desarrollo local, incluyendo todos los servicios necesarios.

### Prerequisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2 o superior)

### Servicios incluidos

- **PostgreSQL** - Base de datos
- **Cognito Local** - Simulación de AWS Cognito
- **Stripe Mock** - Simulación de Stripe API
- **PgAdmin** - Interfaz para administrar PostgreSQL

### Iniciar el entorno

Puedes usar el script de configuración que automatiza todos los pasos:

```bash
# Ejecutar el script de configuración
./scripts/setup-local-dev.sh
```

O puedes iniciar los contenedores manualmente:

```bash
# Iniciar todos los servicios
docker compose up -d
```

### Acceder a los servicios

- **API principal**: http://localhost:3000/api
- **PgAdmin**: http://localhost:5050 (Email: admin@nkripta.com, Password: admin)
- **Cognito Local**: http://localhost:9229
- **Stripe Mock**: http://localhost:12111

### Detener el entorno

```bash
docker compose down
```

Para eliminar los volúmenes y comenzar desde cero:

```bash
docker compose down -v
```

## Estructura del proyecto

- `src/`
  - `config/` - Configuración de servicios externos
  - `controllers/` - Controladores de API
  - `middleware/` - Middleware Express
  - `models/` - Modelos de Sequelize
  - `routes/` - Rutas de la API
  - `services/` - Lógica de negocio
  - `utils/` - Utilidades (validación, logging, etc.)
- `scripts/` - Scripts de utilidad para desarrollo
- `logs/` - Registros de la aplicación

## Comandos importantes

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo producción
npm start

# Ejecutar pruebas
npm test
```

## Credenciales para pruebas

Para el entorno de desarrollo local:

- **Base de datos**: PostgreSQL (usuario: postgres, contraseña: postgres)
- **Cognito**: Emulado por cognito-local (cualquier email/contraseña válida funcionará)
- **Stripe**: Utiliza [números de tarjeta de prueba](https://stripe.com/docs/testing)