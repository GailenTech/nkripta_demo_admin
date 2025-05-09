#!/bin/bash

# Script para inicializar la base de datos con datos de demostración
# Este script crea una base de datos de demostración y la puebla con datos de ejemplo

# Colores para la consola
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}${BLUE}==================================================${NC}"
echo -e "${BOLD}${BLUE}   NKRIPTA - INICIALIZACIÓN DE DATOS DE DEMO     ${NC}"
echo -e "${BOLD}${BLUE}==================================================${NC}"

# Asegurarse de que todos los servicios estén ejecutándose
echo -e "${YELLOW}Verificando que los servicios Docker estén activos...${NC}"
if ! docker compose ps | grep -q "Up"; then
  echo -e "${RED}¡Los servicios no están iniciados! Iniciando servicios...${NC}"
  docker compose up -d
  echo -e "${YELLOW}Esperando a que los servicios estén disponibles...${NC}"
  sleep 10
else
  echo -e "${GREEN}Los servicios ya están ejecutándose.${NC}"
fi

# Verificar que PostgreSQL esté disponible
echo -e "${YELLOW}Verificando conexión a PostgreSQL...${NC}"
if ! docker compose exec postgres pg_isready -U postgres; then
  echo -e "${RED}¡No se puede conectar a PostgreSQL! Por favor, verifica que el servicio esté ejecutándose.${NC}"
  exit 1
fi

# Crear base de datos si no existe
echo -e "${YELLOW}Verificando si la base de datos existe...${NC}"
DB_EXISTS=$(docker compose exec postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='nkripta'")
if [ -z "$DB_EXISTS" ]; then
  echo -e "${YELLOW}La base de datos 'nkripta' no existe. Creándola...${NC}"
  docker compose exec postgres psql -U postgres -c "CREATE DATABASE nkripta;"
  echo -e "${GREEN}Base de datos 'nkripta' creada.${NC}"
else
  echo -e "${GREEN}La base de datos 'nkripta' ya existe.${NC}"
fi

# Configurar variables de entorno
echo -e "${YELLOW}Configurando variables de entorno...${NC}"
if [ ! -f .env ]; then
  echo -e "${YELLOW}Archivo .env no encontrado. Creando uno a partir de .env.example...${NC}"
  
  cat > .env << EOF
NODE_ENV=development
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nkripta
DB_USER=postgres
DB_PASSWORD=postgres

# AWS Cognito
COGNITO_USER_POOL_ID=local_userPoolId
COGNITO_CLIENT_ID=local_clientId
COGNITO_REGION=us-east-1

# Stripe
STRIPE_SECRET_KEY=sk_test_yoursecretkey
STRIPE_WEBHOOK_SECRET=whsec_yoursecretkey

# JWT
JWT_SECRET=nkripta_demo_secret_key
JWT_EXPIRES_IN=1d
EOF

  echo -e "${GREEN}Archivo .env creado.${NC}"
else
  echo -e "${GREEN}Archivo .env ya existe.${NC}"
fi

# Ejecutar migraciones (si hay alguna)
echo -e "${YELLOW}Ejecutando migraciones de base de datos (si existen)...${NC}"
if [ -d "src/migrations" ]; then
  docker compose exec app npm run migrate
else
  echo -e "${YELLOW}No se encontró carpeta de migraciones. Las tablas se crearán automáticamente.${NC}"
fi

# Ejecutar el script de generación de datos de demostración
echo -e "${YELLOW}Generando datos de demostración...${NC}"
docker compose exec app node scripts/generate-demo-data.js

# Generar tarjetas de prueba de Stripe para la demostración
echo -e "${YELLOW}Generando información de tarjetas de prueba de Stripe...${NC}"
docker compose exec app node scripts/generate-stripe-test-cards.js

echo -e "${BOLD}${GREEN}==================================================${NC}"
echo -e "${BOLD}${GREEN}   DATOS DE DEMOSTRACIÓN GENERADOS CON ÉXITO     ${NC}"
echo -e "${BOLD}${GREEN}==================================================${NC}"
echo -e "${BLUE}Ahora puedes acceder a la API con los siguientes datos:${NC}"
echo -e "${YELLOW}URL de la API: http://localhost:3000/api${NC}"
echo -e "${YELLOW}Organizaciones disponibles: TechSolutions, InnovaDesign, GlobalHealth${NC}"
echo -e "${YELLOW}Usuarios disponibles (ejemplos):${NC}"
echo -e "${YELLOW}  - carlos.martinez@techsolutions-demo.com (ADMIN)${NC}"
echo -e "${YELLOW}  - miguel.fernandez@innovadesign-demo.com (ADMIN)${NC}"
echo -e "${YELLOW}  - isabel.torres@globalhealth-demo.com (ADMIN)${NC}"
echo -e "${YELLOW}Planes de suscripción:${NC}"
echo -e "${YELLOW}  - Plan Básico (9.99€/mes)${NC}"
echo -e "${YELLOW}  - Plan Premium (29.99€/mes)${NC}"