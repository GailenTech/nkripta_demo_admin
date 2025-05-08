#!/bin/bash

# Colores para mejor visualización
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Creación de servidor en PgAdmin mediante SQL directo ===${NC}\n"

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

echo -e "${YELLOW}Creando servidor directamente en la base de datos de PgAdmin...${NC}"

# SQL para crear el servidor
SQL="
-- Asegurarse de que no existe un servidor con el mismo nombre
DELETE FROM pgadmin.server WHERE name = 'nkripta-postgres';

-- Crear el servidor
INSERT INTO pgadmin.server (
    servergroup_id, name, host, port, maintenance_db, username, 
    ssl_mode, comment, discovery_id, hostaddr, db_res, passfile, 
    sslcert, sslkey, sslrootcert, sslcrl, sslcompression, 
    bgcolor, fgcolor, service, use_ssh_tunnel, tunnel_host, 
    tunnel_port, tunnel_username, tunnel_authentication, 
    tunnel_identity_file, tunnel_password, tunnel_keep_alive, 
    connect_timeout, connection_params
)
VALUES (
    1, 'nkripta-postgres', 'postgres', 5432, 'postgres', 'postgres', 
    'prefer', 'PostgreSQL para nkripta-admin', NULL, NULL, NULL, NULL, 
    NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 
    22, NULL, 0, NULL, NULL, 0, 0, '{}'
);
"

# Ejecutar SQL en la base de datos de PgAdmin
echo -e "${YELLOW}Ejecutando SQL en la base de datos de PgAdmin...${NC}"
docker exec nkripta-pgadmin psql -U pgadmin4@pgadmin.org -d pgadmin4 -c "$SQL"

# Reiniciar PgAdmin
echo -e "${YELLOW}Reiniciando PgAdmin...${NC}"
docker restart nkripta-pgadmin

echo -e "\n${GREEN}¡Configuración completada!${NC}"
echo -e "${GREEN}Ahora puedes acceder a PgAdmin en:${NC}"
echo -e "${BLUE}http://localhost:5050${NC}"
echo -e "${GREEN}Credenciales:${NC}"
echo -e "- Email: ${BLUE}admin@nkripta.com${NC}"
echo -e "- Password: ${BLUE}admin${NC}"
echo -e "\n${YELLOW}El servidor PostgreSQL ha sido creado directamente en la base de datos de PgAdmin.${NC}"
echo -e "${YELLOW}Al iniciar sesión deberías ver el servidor en el panel izquierdo. Al hacer clic en él es posible que necesites ingresar la contraseña 'postgres'.${NC}"