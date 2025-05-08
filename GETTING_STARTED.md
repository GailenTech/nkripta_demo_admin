# Guía de Inicio Rápido para nkripta_admin

Esta guía proporciona instrucciones paso a paso para configurar y probar el proyecto nkripta_admin después de clonarlo.

## 1. Requisitos Previos

- Docker y Docker Compose instalados
- Git instalado
- Node.js (opcional, para ejecutar herramientas localmente)

## 2. Clonar el Repositorio

```bash
git clone <URL-DEL-REPOSITORIO> nkripta_admin
cd nkripta_admin
```

## 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

No es necesario modificar el archivo `.env` para un entorno de desarrollo local, ya que está preconfigurado para funcionar con los servicios Docker.

## 4. Iniciar los Servicios con Docker Compose

Este paso levantará todos los servicios necesarios (PostgreSQL, LocalStack para Cognito, Stripe-mock, y la aplicación).

```bash
# Levantar todos los servicios
docker compose up -d
```

Este comando pondrá en marcha:
- PostgreSQL en el puerto 5432
- Cognito-local en el puerto 9229 
- Stripe-mock en el puerto 12111
- PgAdmin en el puerto 5050
- La aplicación en el puerto 3000

## 5. Inicializar el Entorno (Recomendado)

Para configurar todo de una sola vez, usa el script de inicialización:

```bash
# Inicializar todo el entorno (recomendado)
./scripts/init-environment.sh
```

Este script automatiza todos estos pasos:
- Espera a que los servicios estén listos
- Crea los recursos necesarios en Cognito
- Actualiza las variables de entorno
- Crea los datos iniciales en la base de datos
- Registra el usuario administrador

## 6. Verificar que los Servicios están Funcionando

```bash
# Comprobar que todos los contenedores están en estado "Up"
docker compose ps
```

## 7. Configuración Manual (Alternativa)

Si prefieres configurar el entorno paso a paso manualmente, puedes seguir estas instrucciones:

```bash
# Esperar a que los servicios estén listos
docker compose exec app bash scripts/wait-for-services.sh

# Crear recursos en Cognito
docker compose exec app node scripts/create-cognito-resources.js

# Crear datos iniciales
docker compose exec app node scripts/create-test-data.js

# Registrar usuario administrador
docker compose exec app node scripts/register-user.js
```

## 8. Probar la API con el Script de Demostración

```bash
# Entrar en el contenedor de la aplicación
docker compose exec app bash

# Ejecutar el script de demostración
node scripts/demo-api.js

# O si prefieres la versión bash
bash scripts/demo-api.sh

# Salir del contenedor
exit
```

Si estos scripts se ejecutan correctamente, es una buena señal de que la API está funcionando.

## 9. Ejecutar las Pruebas Automatizadas

Las pruebas automáticas pueden ejecutarse de tres maneras:

### a) Pruebas con servicios reales (recomendado para desarrollo)

```bash
# Entrar en el contenedor de la aplicación
docker compose exec app bash

# Configurar el entorno de pruebas y ejecutar los tests
npm run test:with-setup

# Salir del contenedor
exit
```

### b) Pruebas sin dependencias externas (más rápido, pero menos completo)

```bash
# Entrar en el contenedor de la aplicación
docker compose exec app bash

# Ejecutar tests en modo skip_external
npm run test:skip-external

# Salir del contenedor
exit
```

### c) Ejecutar un test específico (para depuración)

```bash
# Entrar en el contenedor de la aplicación
docker compose exec app bash

# Por ejemplo, para ejecutar solo las pruebas de autenticación
npm run test:auth

# Salir del contenedor
exit
```

## 10. Usar PgAdmin para Explorar la Base de Datos

PgAdmin debe estar configurado automáticamente para conectarse a la base de datos PostgreSQL.

1. Abre un navegador y ve a `http://localhost:5050`
2. Inicia sesión con:
   - Email: `admin@admin.com` 
   - Password: `admin`
3. En el panel izquierdo, despliega "Servers" → "PostgreSQL" para ver la base de datos `nkripta`

## 11. Usar Postman para Probar Manualmente la API

1. Importa la colección Postman desde `scripts/postman-collection.json`
2. Configura la variable de entorno `base_url` como `http://localhost:3000/api`
3. Ejecuta la solicitud "Login" para obtener un token JWT
4. Explora el resto de endpoints

## Solución de Problemas Comunes

### La API no responde en http://localhost:3000

Verifica:
```bash
# Ver logs de la aplicación
docker-compose logs app
```

### Problemas con Cognito-local

Si hay problemas con la autenticación:
```bash
# Ver logs de cognito-local
docker compose logs cognito-local

# Reiniciar el servicio
docker compose restart cognito-local

# Ejecutar nuevamente la configuración de cognito 
docker compose exec app node scripts/create-cognito-resources.js
```

### Problemas con la Base de Datos

```bash
# Ver logs de PostgreSQL
docker compose logs postgres

# Verificar la conexión
docker compose exec postgres psql -U postgres -c "\l"
```

### Reconstruir Todo desde Cero

Si necesitas empezar de nuevo:
```bash
# Detener todos los servicios y eliminar volúmenes
docker compose down -v

# Reconstruir e iniciar
docker compose up -d --build

# Inicializar el entorno nuevamente
./scripts/init-environment.sh
```

## Estructura del Proyecto

- `/src`: Código fuente de la aplicación
  - `/config`: Configuración para servicios externos
  - `/controllers`: Controladores para manejar las solicitudes HTTP
  - `/middleware`: Middleware para autenticación y manejo de errores
  - `/models`: Modelos de datos (Sequelize)
  - `/routes`: Definición de rutas de la API
  - `/services`: Servicios para lógica de negocio
  - `/utils`: Utilidades (logging, validaciones, etc.)
- `/tests`: Pruebas automatizadas
- `/scripts`: Scripts de utilidad para configuración y demostración
- `/docker-compose.yml` y `Dockerfile`: Configuración de Docker

## Credenciales por Defecto

- **Usuario Admin**: 
  - Email: `admin@example.com`
  - Password: `Password123`
- **Organización por defecto**: 
  - ID: `00000000-0000-0000-0000-000000000000`
  - Nombre: `Organización de Prueba`

## Notas Importantes

- **Puerto de la API**: La aplicación está disponible en `http://localhost:3000/api`
- **Entorno de prueba**: Las pruebas utilizan una base de datos separada llamada `nkripta_test`
- **Cambios en el código**: El código fuente está montado como un volumen en el contenedor de la aplicación, por lo que los cambios que hagas en los archivos se reflejarán inmediatamente (la aplicación se reinicia automáticamente gracias a nodemon)
- **Documentación adicional**: Consulta los archivos README.md, PGADMIN.md y otros archivos de documentación específicos para más detalles