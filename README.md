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

# Ejecutar pruebas con generación de reportes (para CI/CD)
npm run test:sequential-with-reports
```

## Credenciales para pruebas

Para el entorno de desarrollo local:

- **Base de datos**: PostgreSQL (usuario: postgres, contraseña: postgres)
- **Cognito**: Emulado por cognito-local (cualquier email/contraseña válida funcionará)
- **Stripe**: Utiliza [números de tarjeta de prueba](https://stripe.com/docs/testing)

## Ejecución de pruebas

Para información detallada sobre la ejecución de pruebas, consulte [TESTING.md](TESTING.md).

### Ejecutar pruebas completas desde el exterior

Para facilitar la ejecución de pruebas con todos los servicios necesarios (PostgreSQL, Cognito Local, Stripe Mock), se incluyen scripts que automatizan este proceso:

```bash
# Ejecutar pruebas completas desde el sistema host (fuera de Docker)
# Este script verifica que los servicios estén en funcionamiento
./scripts/run-full-tests.sh

# Ejecutar pruebas dentro del contenedor Docker
# Proporciona varias opciones para ejecutar diferentes tipos de pruebas
./scripts/docker-run-tests.sh
```

Estos scripts:
1. Comprueban que los servicios necesarios estén en funcionamiento
2. Configuran el entorno adecuadamente
3. Ejecutan las pruebas con las opciones seleccionadas
4. Generan informes si se solicita

### Ejecución de pruebas y reportes para CI/CD

El proyecto está configurado para generar reportes de pruebas compatibles con sistemas CI/CD:

### Tipos de reportes

- **JUnit XML** - Compatible con la mayoría de sistemas CI/CD (Jenkins, GitLab CI, CircleCI, etc.)
- **HTML** - Reportes visuales para revisión humana

### Comandos de pruebas para CI/CD

```bash
# Ejecutar todas las pruebas y generar reportes JUnit y HTML
npm run test:all-reports

# Ejecutar pruebas secuencialmente y generar reportes
npm run test:sequential-with-reports

# Ejecutar solo reportes JUnit (para CI)
npm run test:ci

# Ejecutar solo reportes HTML (para revisión)
npm run test:html-report

# Generar documentación a partir de los reportes existentes
npm run test:docs

# Flujo completo para CI/CD: pruebas + reportes + documentación
npm run test:full-ci
```

### Ubicación de los reportes

Los reportes se generan en el directorio `test-reports/`:

- `test-reports/junit.xml` - Reporte en formato JUnit XML
- `test-reports/test-report.html` - Reporte HTML para revisión humana
- `test-reports/test-summary.md` - Resumen en Markdown para documentación

### Script para CI/CD

Se ha incluido un script listo para usar en pipelines CI/CD:

```bash
./scripts/run-tests-with-reports.sh
```

Este script ejecuta las pruebas secuencialmente, genera todos los reportes y muestra un resumen de los resultados.