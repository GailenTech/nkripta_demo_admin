# Gestión de Datos en Entorno Docker

Este documento explica cómo gestionar la persistencia de datos en el entorno Docker de nkripta_admin y cómo reiniciar con datos limpios cuando sea necesario.

## Cómo Funcionan los Datos Persistentes

Por defecto, el entorno utiliza volúmenes Docker para mantener los datos persistentes entre reinicios. Esto significa que:

1. Los datos de PostgreSQL se almacenan en el volumen `postgres-data`
2. Los datos de Cognito-local se almacenan en el volumen `cognito-data`
3. La configuración de PgAdmin se almacena en el volumen `pgadmin-data`

Estos volúmenes se definen en el archivo `docker-compose.yml`:

```yaml
volumes:
  postgres-data:
  cognito-data:
  pgadmin-data:
```

## Opciones para Gestionar la Persistencia

### 1. Mantener los Datos (Comportamiento por Defecto)

Cuando ejecutas:

```bash
docker-compose down
docker-compose up -d
```

Los datos se mantienen porque los volúmenes no se eliminan.

### 2. Reiniciar con Datos Limpios (Eliminar Volúmenes)

Para reiniciar completamente con datos limpios:

```bash
# Detener los contenedores y eliminar volúmenes
docker-compose down -v

# Iniciar de nuevo
docker-compose up -d
```

La opción `-v` es crucial ya que indica a Docker que elimine los volúmenes, lo que resulta en un entorno limpio.

### 3. Eliminar Datos de un Servicio Específico

Si solo necesitas limpiar los datos de un servicio específico:

```bash
# 1. Detener los contenedores
docker-compose down

# 2. Eliminar solo el volumen que deseas reiniciar
docker volume rm nkripta_admin_postgres-data  # Para la base de datos
# O
docker volume rm nkripta_admin_cognito-data  # Para Cognito
# O
docker volume rm nkripta_admin_pgadmin-data  # Para PgAdmin

# 3. Iniciar de nuevo
docker-compose up -d
```

### 4. Mantener los Datos Pero Restaurar un Estado Inicial

Si deseas mantener la estructura pero restaurar los datos iniciales:

```bash
# Entrar en el contenedor de la aplicación
docker-compose exec app bash

# Ejecutar el script para registrar el usuario administrador inicial
node scripts/register-user.js

# Salir del contenedor
exit
```

## Casos de Uso Comunes

### 1. Desarrollo Diario

Para desarrollo cotidiano, lo mejor es mantener los datos persistentes:

```bash
docker-compose stop   # Detiene pero no elimina
docker-compose start  # Inicia de nuevo
```

O si necesitas reconstruir:

```bash
docker-compose down
docker-compose up -d  # Los datos se mantienen
```

### 2. Pruebas Desde Cero

Cuando deseas probar la inicialización completa o tienes un estado inconsistente:

```bash
docker-compose down -v
docker-compose up -d
```

### 3. Actualización de Esquema de Base de Datos

Después de cambiar modelos o migraciones:

```bash
# Opción 1: Conservar datos (podría fallar si hay cambios incompatibles)
docker-compose restart app

# Opción 2: Reiniciar con esquema limpio
docker-compose down -v
docker-compose up -d
```

## Cómo Verificar el Estado de los Volúmenes

Para ver los volúmenes existentes:

```bash
docker volume ls | grep nkripta
```

Para inspeccionar un volumen específico:

```bash
docker volume inspect nkripta_admin_postgres-data
```

## Cómo Hacer Copias de Seguridad

### Backup de la Base de Datos

```bash
# Exportar la base de datos a un archivo local
docker-compose exec postgres pg_dump -U postgres nkripta > backup.sql

# Restaurar desde un backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres nkripta
```

## Notas Importantes

- Los volúmenes Docker se almacenan en el sistema de archivos del host en una ubicación gestionada por Docker
- Si eliminas todos los contenedores y volúmenes con `docker system prune -a --volumes`, perderás todos tus datos
- Las pruebas automatizadas utilizan una base de datos diferente (`nkripta_test`), por lo que no afectan a tus datos de desarrollo
- Los cambios en el esquema de base de datos pueden requerir una reconstrucción completa con `-v` para aplicarse correctamente

## Entornos Personalizados

Si deseas tener múltiples entornos con diferentes datos, puedes usar perfiles de docker-compose:

```bash
# Crear un perfil alternativo
docker-compose -p nkripta_testing up -d

# Trabajar con ese perfil
docker-compose -p nkripta_testing down -v
```

Esto creará un conjunto separado de volúmenes para cada perfil.