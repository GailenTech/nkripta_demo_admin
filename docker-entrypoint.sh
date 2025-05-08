#!/bin/bash

# Verificar si estamos ejecutando en Docker
if [ -f /.dockerenv ] || [ -f /run/.containerenv ]; then
  echo "Running in Docker environment"
  
  # Copiar .env.docker a .env si no existe
  if [ ! -f .env ]; then
    echo "Copying .env.docker to .env..."
    cp .env.docker .env
  fi
  
  # Esperar a que los servicios estén disponibles usando el script de espera
  if [ "$NODE_ENV" = "development" ]; then
    # Ejecutar script de espera si existe
    if [ -f /app/scripts/wait-for-services.sh ]; then
      echo "Waiting for services..."
      bash /app/scripts/wait-for-services.sh
    else
      # Fallback: esperar solo PostgreSQL
      echo "Waiting for PostgreSQL to be ready..."
      until pg_isready -h postgres -p 5432 -U postgres; do
        echo "PostgreSQL is unavailable - waiting..."
        sleep 1
      done
      echo "PostgreSQL is up!"
    fi
  fi
fi

# Ejecutar el comando pasado como argumento
exec "$@"