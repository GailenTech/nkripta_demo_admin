#!/bin/bash

# Script para inicializar stripe-mock y cargar datos de demostración

# Colores para la consola
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}${BLUE}==================================================${NC}"
echo -e "${BOLD}${BLUE}   NKRIPTA - INICIALIZACIÓN DE STRIPE MOCK        ${NC}"
echo -e "${BOLD}${BLUE}==================================================${NC}"

# Verificar que Docker esté ejecutándose
if ! docker --version > /dev/null 2>&1; then
  echo -e "${RED}Docker no está instalado o no está en ejecución. Por favor, instálalo y asegúrate de que esté en ejecución.${NC}"
  exit 1
fi

# Asegurarse de que stripe-mock esté en ejecución
echo -e "${YELLOW}Verificando que stripe-mock esté activo...${NC}"
if ! docker compose ps | grep -q "stripe-mock.*Up"; then
  echo -e "${YELLOW}El servicio stripe-mock no está iniciado. Iniciando servicio...${NC}"
  docker compose up -d stripe-mock
  echo -e "${YELLOW}Esperando a que stripe-mock esté disponible...${NC}"
  
  # Esperar hasta que stripe-mock esté disponible
  max_attempts=30
  attempt=0
  
  while ! curl -s http://localhost:12111/v1/customers > /dev/null && [ $attempt -lt $max_attempts ]; do
    echo -e "${YELLOW}Esperando a que stripe-mock esté disponible... ($((attempt+1))/$max_attempts)${NC}"
    sleep 2
    ((attempt++))
  done
  
  if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}stripe-mock no pudo iniciarse correctamente. Por favor, revisa los logs.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}El servicio stripe-mock ya está ejecutándose.${NC}"
fi

# Configurar variables de entorno para usar stripe-mock
echo -e "${YELLOW}Configurando variables de entorno para usar stripe-mock...${NC}"

# Crear o modificar el archivo .env
if [ ! -f .env ]; then
  echo -e "${YELLOW}Archivo .env no encontrado. Creando uno a partir de .env.example...${NC}"
  cp .env.example .env 2>/dev/null || touch .env
fi

# Añadir/actualizar variables de Stripe Mock
if grep -q "STRIPE_MOCK_ENABLED" .env; then
  sed -i.bak 's/STRIPE_MOCK_ENABLED=.*/STRIPE_MOCK_ENABLED=true/' .env
else
  echo "STRIPE_MOCK_ENABLED=true" >> .env
fi

if grep -q "USE_STRIPE_MOCK" .env; then
  sed -i.bak 's/USE_STRIPE_MOCK=.*/USE_STRIPE_MOCK=true/' .env
else
  echo "USE_STRIPE_MOCK=true" >> .env
fi

if grep -q "STRIPE_MOCK_HOST" .env; then
  if [ -n "$DOCKER_HOST" ]; then
    # Si estamos ejecutando dentro de Docker, usar stripe-mock
    sed -i.bak 's/STRIPE_MOCK_HOST=.*/STRIPE_MOCK_HOST=stripe-mock/' .env
  else 
    # Si estamos ejecutando en local, usar localhost
    sed -i.bak 's/STRIPE_MOCK_HOST=.*/STRIPE_MOCK_HOST=localhost/' .env
  fi
else
  if [ -n "$DOCKER_HOST" ]; then
    echo "STRIPE_MOCK_HOST=stripe-mock" >> .env
  else
    echo "STRIPE_MOCK_HOST=localhost" >> .env
  fi
fi

if grep -q "STRIPE_MOCK_PORT" .env; then
  sed -i.bak 's/STRIPE_MOCK_PORT=.*/STRIPE_MOCK_PORT=12111/' .env
else
  echo "STRIPE_MOCK_PORT=12111" >> .env
fi

# Eliminar archivo de respaldo si existe
rm -f .env.bak

# Inicializar datos en Stripe Mock
echo -e "${YELLOW}Inicializando datos en Stripe Mock...${NC}"
node scripts/init-stripe-mock-data.js

echo -e ""
echo -e "${GREEN}✅ Stripe Mock inicializado correctamente con los datos de demostración${NC}"
echo -e "${YELLOW}Para usar la API con Stripe Mock:${NC}"
echo -e "  - La API ahora obtendrá los datos de suscripción directamente desde Stripe Mock"
echo -e "  - Los planes de suscripción y clientes han sido creados en Stripe Mock"
echo -e "  - Las suscripciones existentes han sido sincronizadas con Stripe Mock"
echo -e ""
echo -e "${BLUE}Para probar la API:${NC}"
echo -e "  1. Asegúrate de que el backend esté ejecutándose: ${YELLOW}npm run dev${NC}"
echo -e "  2. Accede a la interfaz de administración: ${YELLOW}cd nkripta-admin-ui && npm start${NC}"
echo -e ""