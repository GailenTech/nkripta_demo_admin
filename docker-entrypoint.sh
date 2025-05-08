#!/bin/bash
set -e

echo "Running in Docker environment"

# Esperar a que PostgreSQL esté listo
echo "Waiting for PostgreSQL to be ready..."
/app/scripts/wait-for-services.sh postgres:5432 -t 60

echo "PostgreSQL is up!"

# Ejecutar migraciones de la base de datos
echo "Running database migrations..."

# Ignorar el aviso de AWS SDK deprecado
export NODE_OPTIONS="--no-warnings"

# Iniciar la aplicación
exec "$@"