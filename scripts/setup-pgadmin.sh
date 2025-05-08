#!/bin/bash

# Colores para mejor visualización
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Configuración de PgAdmin para nkripta_admin ===${NC}\n"

# Verificar que los contenedores estén en ejecución
if ! docker ps | grep -q nkripta-postgres; then
  echo -e "${RED}Error: El contenedor PostgreSQL no está en ejecución.${NC}"
  echo -e "Ejecuta primero: docker compose up -d"
  exit 1
fi

if ! docker ps | grep -q nkripta-pgadmin; then
  echo -e "${RED}Error: El contenedor PgAdmin no está en ejecución.${NC}"
  echo -e "Ejecuta primero: docker compose up -d"
  exit 1
fi

echo -e "${YELLOW}Creando archivo de configuración para PgAdmin...${NC}"

# Directorio temporal para crear el archivo de configuración
TEMP_DIR=$(mktemp -d)
CONFIG_FILE="$TEMP_DIR/servers.json"

# Crear el archivo de configuración de servidores
cat > "$CONFIG_FILE" << EOF
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
      "PassFile": "/pgpass",
      "Comment": "Servidor PostgreSQL para nkripta_admin"
    }
  }
}
EOF

# Crear archivo pgpass con la contraseña
PGPASS_FILE="$TEMP_DIR/pgpass"
echo "*:*:*:postgres:postgres" > "$PGPASS_FILE"
chmod 600 "$PGPASS_FILE"

echo -e "${GREEN}Configuración creada correctamente.${NC}"

# Copiar los archivos al contenedor de PgAdmin
echo -e "${YELLOW}Copiando archivos de configuración al contenedor...${NC}"
docker cp "$CONFIG_FILE" nkripta-pgadmin:/pgadmin4/servers.json
echo -e "${YELLOW}Nota: La contraseña se configurará manualmente en PgAdmin${NC}"

# Reiniciar el contenedor de PgAdmin para aplicar la configuración
echo -e "${YELLOW}Reiniciando PgAdmin...${NC}"
docker restart nkripta-pgadmin

# Limpiar archivos temporales
rm -rf "$TEMP_DIR"

echo -e "\n${GREEN}¡Configuración completada!${NC}"
echo -e "${GREEN}Ahora puedes acceder a PgAdmin en:${NC}"
echo -e "${BLUE}http://localhost:5050${NC}"
echo -e "${GREEN}Credenciales:${NC}"
echo -e "- Email: ${BLUE}admin@nkripta.com${NC}"
echo -e "- Password: ${BLUE}admin${NC}"
echo -e "\n${YELLOW}La configuración del servidor PostgreSQL se ha creado automáticamente.${NC}"
echo -e "${YELLOW}Solo necesitas iniciar sesión en PgAdmin y el servidor ya estará disponible.${NC}"