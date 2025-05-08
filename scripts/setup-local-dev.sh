#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configurando entorno de desarrollo local para nkripta_admin ===${NC}"

# Verificar docker y docker-compose
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Docker no está instalado. Por favor instálalo primero.${NC}"
  exit 1
fi

if ! command -v docker compose &> /dev/null; then
  echo -e "${YELLOW}Docker Compose no está instalado o no es la versión 2.0+. Por favor instálalo primero.${NC}"
  exit 1
fi

# Verificar archivo .env
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creando archivo .env desde .env.example...${NC}"
  cp .env.example .env
fi

echo -e "${GREEN}Iniciando contenedores...${NC}"
docker compose down
docker compose up -d

echo -e "${GREEN}Esperando a que los servicios estén disponibles (esto puede tomar un minuto)...${NC}"
sleep 10

echo -e "${GREEN}Verificando estado de los contenedores:${NC}"
docker compose ps

echo -e "${GREEN}Puedes acceder a:${NC}"
echo -e "- API: http://localhost:3000/api"
echo -e "- PgAdmin: http://localhost:5050 (Email: admin@nkripta.com, Password: admin)"
echo -e "- Cognito Local: http://localhost:9229"
echo -e "- Stripe Mock: http://localhost:12111"
echo
echo -e "${YELLOW}Para verificar que todo funciona correctamente, intenta:${NC}"
echo -e "  curl http://localhost:3000/api"
echo
echo -e "${YELLOW}Para ver los logs:${NC}"
echo -e "  docker compose logs -f app"
echo
echo -e "${GREEN}¡Configuración completada!${NC}"