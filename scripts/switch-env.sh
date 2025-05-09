#!/bin/bash
# Script para cambiar entre configuraciones de entorno local y Docker

# Colores para la consola
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

if [ "$1" == "docker" ]; then
    echo -e "${YELLOW}Cambiando a configuración para Docker...${NC}"
    cp .env.docker .env
    echo -e "${GREEN}✅ Configuración para Docker activada${NC}"
    echo -e "${BLUE}Para iniciar los servicios ejecuta:${NC}"
    echo -e "docker compose up -d"
elif [ "$1" == "local" ]; then
    echo -e "${YELLOW}Cambiando a configuración para desarrollo local...${NC}"
    cp .env.local .env
    echo -e "${GREEN}✅ Configuración para desarrollo local activada${NC}"
    echo -e "${BLUE}Para iniciar el servidor ejecuta:${NC}"
    echo -e "npm run dev"
else
    echo -e "${RED}Uso: $0 [docker|local]${NC}"
    echo -e "  docker - Configura para ejecución en Docker"
    echo -e "  local  - Configura para ejecución local sin Docker"
    exit 1
fi