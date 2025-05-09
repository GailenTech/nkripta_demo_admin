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
# Cambiar a configuración Docker
./scripts/switch-env.sh docker

# Iniciar todos los servicios
docker compose up -d
```

### Cambiar entre entornos Docker y Local

El proyecto incluye un script para facilitar el cambio entre configuraciones de Docker y desarrollo local:

```bash
# Para desarrollo con Docker
./scripts/switch-env.sh docker

# Para desarrollo local (sin Docker)
./scripts/switch-env.sh local
```

Este script copia el archivo de configuración adecuado (.env.docker o .env.local) a .env, asegurando que los valores de conexión a la base de datos y otros servicios sean correctos para cada entorno.

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

## Interfaz de Administración

El proyecto incluye un script para generar una interfaz de administración de demostración basada en React Admin:

```bash
# Crear la interfaz de administración
./scripts/create-admin-ui.sh
```

### Iniciar la interfaz de administración

```bash
# Navegar al directorio de la interfaz
cd nkripta-admin-ui

# Instalar dependencias
npm install

# Iniciar la interfaz (se abrirá en http://localhost:3001)
npm start
```

### Características de la interfaz

- **Dashboard** con información general
- **Gestión de organizaciones** - Visualización y edición
- **Gestión de perfiles** - Visualización y edición de usuarios
- **Gestión de suscripciones** - Visualización y edición de planes

Para más detalles sobre la arquitectura propuesta, consulte [docs/admin-ui-proposal.md](docs/admin-ui-proposal.md).

## Credenciales para pruebas

Para el entorno de desarrollo local:

- **Base de datos**: PostgreSQL (usuario: postgres, contraseña: postgres)
- **Cognito**: Emulado por cognito-local (cualquier email/contraseña válida funcionará)
- **Stripe**: Utiliza [números de tarjeta de prueba](https://stripe.com/docs/testing)

## Datos de demostración

El proyecto incluye scripts para generar datos de demostración realistas para el entorno de desarrollo:

### Inicializar base de datos de demostración

Para configurar una base de datos con datos de demostración completos, ejecuta:

```bash
# Inicializar la base de datos con datos de demostración
./scripts/init-demo-db.sh
```

Este script:
1. Verifica que los servicios Docker estén en ejecución
2. Crea la base de datos si no existe
3. Configura las variables de entorno necesarias
4. Corrige problemas de tipos ENUM en PostgreSQL (ver nota abajo)
5. Genera datos de demostración realistas

### Nota sobre tipos ENUM en PostgreSQL

Este proyecto incluye un script `fix-enum-types.js` que soluciona un problema conocido con los tipos ENUM array en PostgreSQL. El problema ocurre específicamente con el campo `roles` en el modelo `Profile`, que utiliza un array de ENUMs. 

El script:
- Detecta si hay problemas con el tipo ENUM en la columna `roles`
- Migra los datos a un array de strings con validación
- Se ejecuta automáticamente durante la inicialización de la base de datos

Si encuentras errores como `cannot cast type "enum_Profile_roles"[] to "enum_Profile_roles"` o `column "roles" is of type "enum_Profile_roles"[] but default expression is of type character varying[]`, puedes ejecutar manualmente:

```bash
# Corregir problemas con tipos ENUM en PostgreSQL
node scripts/fix-enum-types.js
```

### Datos de demostración incluidos

Los datos de demostración incluyen:

**Organizaciones**:
- TechSolutions Inc. - Empresa de tecnología
- InnovaDesign - Estudio de diseño
- Global Health Services - Servicios de salud

**Usuarios**:
- Cada organización tiene 3-4 usuarios
- Al menos un usuario administrador por organización
- Cada usuario tiene un perfil completo con datos de contacto

**Planes de suscripción**:
- Plan Básico (9.99€/mes)
- Plan Premium (29.99€/mes)

**Credenciales de ejemplo**:
- carlos.martinez@techsolutions-demo.com (Admin - TechSolutions)
- miguel.fernandez@innovadesign-demo.com (Admin - InnovaDesign)
- isabel.torres@globalhealth-demo.com (Admin - Global Health Services)

**Tarjetas de prueba de Stripe**:
- Tarjetas específicas para probar diferentes escenarios de pago
- Ver [STRIPE_TEST_CARDS.md](STRIPE_TEST_CARDS.md) para detalles completos

Para información más detallada, consulte [DEMO_DATA.md](DEMO_DATA.md).

### Generar solo datos de demostración

Si solo deseas regenerar los datos de demostración sin reiniciar toda la base de datos:

```bash
# Generar datos de demostración
docker compose exec app node scripts/generate-demo-data.js
```

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