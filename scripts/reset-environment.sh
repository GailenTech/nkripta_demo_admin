#!/bin/bash

# Script para reiniciar completamente el entorno de desarrollo
# Reinicia todos los servicios y carga datos de demostración sin errores

# Colores para la consola
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}${BLUE}==================================================${NC}"
echo -e "${BOLD}${BLUE}      NKRIPTA - REINICIO DE ENTORNO               ${NC}"
echo -e "${BOLD}${BLUE}==================================================${NC}"

# Detener todos los servicios
echo -e "${YELLOW}Deteniendo todos los servicios...${NC}"
docker compose down

# Eliminar volúmenes para limpiar la base de datos
echo -e "${YELLOW}Eliminando volúmenes (base de datos)...${NC}"
docker compose down -v

# Iniciar los servicios
echo -e "${YELLOW}Iniciando servicios...${NC}"
docker compose up -d

# Esperar a que los servicios estén disponibles
echo -e "${YELLOW}Esperando a que los servicios estén disponibles...${NC}"
sleep 10

# Copiar archivo de configuración para Docker
echo -e "${YELLOW}Copiando configuración para Docker...${NC}"
cp .env.docker .env

# Generar datos de demostración
echo -e "${YELLOW}Generando datos de demostración...${NC}"
./scripts/init-demo-db.sh

# Desactivar temporalmente el uso de Stripe Mock
echo -e "${YELLOW}Configurando para usar la base de datos local (sin Stripe Mock)...${NC}"
if grep -q "USE_STRIPE_MOCK" .env; then
  sed -i.bak 's/USE_STRIPE_MOCK=.*/USE_STRIPE_MOCK=false/' .env
else
  echo "USE_STRIPE_MOCK=false" >> .env
fi

# Eliminar archivo de respaldo si existe
rm -f .env.bak

# Restaurar configuración local para desarrollo fuera de Docker
echo -e "${YELLOW}Restaurando configuración local para desarrollo...${NC}"
cp .env.local .env

echo -e "${GREEN}✅ Entorno reiniciado correctamente${NC}"
echo -e "${YELLOW}Ahora puedes:${NC}"
echo -e "  1. Iniciar el backend: ${GREEN}npm run dev${NC}"
echo -e "  2. Iniciar la interfaz admin: ${GREEN}cd nkripta-admin-ui && npm start${NC}"
echo -e ""
echo -e "${YELLOW}Cuando todo funcione correctamente, puedes activar Stripe Mock:${NC}"
echo -e "  ${GREEN}./scripts/init-stripe-mock.sh${NC}"
echo -e ""