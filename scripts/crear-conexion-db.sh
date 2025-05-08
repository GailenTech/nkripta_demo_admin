#!/bin/bash

# Colores para mejor visualización
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Crear base de datos y usuario en PostgreSQL de forma manual ===${NC}\n"

# Verificar que los contenedores estén en ejecución
if ! docker ps | grep -q nkripta-postgres; then
  echo -e "${RED}Error: El contenedor PostgreSQL no está en ejecución.${NC}"
  echo -e "Ejecuta primero: docker compose up -d"
  exit 1
fi

# Verificar que nkripta existe
DB_EXISTS=$(docker exec nkripta-postgres psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='nkripta';" | xargs)
if [ "$DB_EXISTS" != "1" ]; then
  echo -e "${YELLOW}Creando base de datos nkripta...${NC}"
  docker exec nkripta-postgres psql -U postgres -c "CREATE DATABASE nkripta;"
else
  echo -e "${GREEN}La base de datos nkripta ya existe.${NC}"
fi

# Mostrar información para conectar manualmente
echo -e "\n${GREEN}======================= CONEXIÓN MANUAL A POSTGRESQL =======================${NC}"
echo -e "${YELLOW}Para conectar a PostgreSQL desde PgAdmin, sigue estos pasos:${NC}"
echo -e ""
echo -e "1. Accede a PgAdmin en ${BLUE}http://localhost:5050${NC}"
echo -e "2. Usuario: ${BLUE}admin@nkripta.com${NC} / Contraseña: ${BLUE}admin${NC}"
echo -e "3. Haz clic derecho en 'Servers' y selecciona 'Create' > 'Server...'"
echo -e ""
echo -e "4. En la pestaña ${GREEN}General${NC}:"
echo -e "   - Name: ${BLUE}nkripta-postgres${NC}"
echo -e ""
echo -e "5. En la pestaña ${GREEN}Connection${NC}:"
echo -e "   - Host name/address: ${BLUE}postgres${NC}"
echo -e "   - Port: ${BLUE}5432${NC}"
echo -e "   - Maintenance database: ${BLUE}postgres${NC}"
echo -e "   - Username: ${BLUE}postgres${NC}"
echo -e "   - Password: ${BLUE}postgres${NC}"
echo -e "   - Guardar contraseña: ${BLUE}Activado${NC}"
echo -e ""
echo -e "6. Haz clic en 'Save'"
echo -e "${GREEN}=========================================================================${NC}"
echo -e ""

# Verificar tablas en la base de datos nkripta
echo -e "${YELLOW}Verificando tablas en la base de datos nkripta...${NC}"
TABLES=$(docker exec nkripta-postgres psql -U postgres -d nkripta -c "\dt public.*" -t | wc -l)
echo -e "${GREEN}Número de tablas en la base de datos nkripta: ${NC}$(echo $TABLES | xargs)"

# Mostrar las tablas
echo -e "${YELLOW}Listado de tablas:${NC}"
docker exec nkripta-postgres psql -U postgres -d nkripta -c "\dt public.*"