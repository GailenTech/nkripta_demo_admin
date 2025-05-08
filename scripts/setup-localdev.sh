#!/bin/bash

# Este script ayuda a configurar el entorno de desarrollo local

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configurando entorno de desarrollo local para nkripta_admin ===${NC}"

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker no está instalado. Por favor, instala Docker antes de continuar:${NC}"
    echo "https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose no está instalado. Por favor, instala Docker Compose antes de continuar:${NC}"
    echo "https://docs.docker.com/compose/install/"
    exit 1
fi

# Copiar .env.example a .env si no existe
if [ ! -f .env ]; then
    echo -e "${GREEN}Creando archivo .env desde .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Recuerda editar el archivo .env con tus credenciales específicas${NC}"
fi

# Iniciar los servicios
echo -e "${GREEN}Iniciando servicios con Docker Compose...${NC}"
docker-compose up -d postgres localstack stripe-mock pgadmin

# Esperar a que los servicios estén listos
echo -e "${GREEN}Esperando a que LocalStack esté listo...${NC}"
echo "Esto puede tomar unos minutos..."
until curl -s http://localhost:4566/_localstack/health | grep -q "\"cognito\": \"running\""; do
    echo -n "."
    sleep 2
done
echo -e "\n${GREEN}LocalStack está listo!${NC}"

# Ejecutar el script para configurar Cognito
echo -e "${GREEN}Configurando AWS Cognito en LocalStack...${NC}"
./localstack-init/init-cognito.sh

# Obtener datos de Cognito para actualizar .env
echo -e "${GREEN}Actualizando .env con datos de Cognito...${NC}"
COGNITO_INFO=$(curl -s http://localhost:4566/_localstack/cognito_info.txt 2>/dev/null)

if [ -n "$COGNITO_INFO" ]; then
    # Extraer valores y actualizar .env
    USER_POOL_ID=$(echo "$COGNITO_INFO" | grep COGNITO_USER_POOL_ID | cut -d= -f2)
    CLIENT_ID=$(echo "$COGNITO_INFO" | grep COGNITO_CLIENT_ID | cut -d= -f2)
    REGION=$(echo "$COGNITO_INFO" | grep COGNITO_REGION | cut -d= -f2)
    
    # Actualizar .env
    sed -i.bak "s/COGNITO_USER_POOL_ID=.*/COGNITO_USER_POOL_ID=$USER_POOL_ID/" .env
    sed -i.bak "s/COGNITO_CLIENT_ID=.*/COGNITO_CLIENT_ID=$CLIENT_ID/" .env
    sed -i.bak "s/COGNITO_REGION=.*/COGNITO_REGION=$REGION/" .env
    
    rm .env.bak
    
    echo -e "${GREEN}Archivo .env actualizado con credenciales de Cognito${NC}"
else
    echo -e "${YELLOW}No se pudieron obtener los datos de Cognito. Por favor, actualiza manualmente el archivo .env${NC}"
fi

# Iniciar la aplicación
echo -e "${GREEN}Iniciando la aplicación...${NC}"
docker-compose up -d app

echo -e "${GREEN}=== Configuración completada ===${NC}"
echo -e "API disponible en: ${YELLOW}http://localhost:3000${NC}"
echo -e "PgAdmin disponible en: ${YELLOW}http://localhost:5050${NC}"
echo -e "  - Email: admin@nkripta.com"
echo -e "  - Password: admin"
echo ""
echo -e "${YELLOW}Para detener todos los servicios:${NC} docker-compose down"
echo -e "${YELLOW}Para ver logs de la aplicación:${NC} docker-compose logs -f app"