#!/bin/bash

# Colores para mejor visualización
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Configuración automática de PgAdmin ===${NC}\n"

# Verificar que exista el directorio pgadmin-config
if [ ! -d "pgadmin-config" ]; then
  echo -e "${YELLOW}Creando directorio pgadmin-config...${NC}"
  mkdir -p pgadmin-config
fi

# Crear archivo servers.json
echo -e "${YELLOW}Creando archivo de configuración servers.json...${NC}"
cat > pgadmin-config/servers.json << EOF
{
  "Servers": {
    "1": {
      "Name": "nkripta-postgres",
      "Group": "Servers",
      "Host": "postgres",
      "Port": 5432,
      "MaintenanceDB": "postgres",
      "Username": "postgres",
      "SSLMode": "prefer",
      "PassFile": "/pgpassfile",
      "SavePassword": true,
      "Comment": "PostgreSQL server for nkripta_admin"
    }
  }
}
EOF

# Crear archivo pgpassfile
echo -e "${YELLOW}Creando archivo de contraseñas pgpassfile...${NC}"
cat > pgadmin-config/pgpassfile << EOF
postgres:5432:postgres:postgres:postgres
postgres:5432:*:postgres:postgres
EOF

# Establecer permisos correctos
chmod 600 pgadmin-config/pgpassfile

echo -e "${GREEN}Archivos de configuración creados correctamente.${NC}"
echo -e "\n${YELLOW}Para aplicar esta configuración:${NC}"
echo -e "1. Detén los contenedores: ${BLUE}docker compose down${NC}"
echo -e "2. Inicia los contenedores nuevamente: ${BLUE}docker compose up -d${NC}"
echo -e "3. Accede a PgAdmin en: ${BLUE}http://localhost:5050${NC}"
echo -e "   - Email: ${BLUE}admin@nkripta.com${NC}"
echo -e "   - Password: ${BLUE}admin${NC}"
echo -e "\n${GREEN}Ahora deberías ver el servidor PostgreSQL preconfigurado en el panel izquierdo.${NC}"