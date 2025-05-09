#!/bin/bash

# Script para ejecutar pruebas completas dentro del contenedor Docker
# Asegurando que todos los servicios necesarios están disponibles

# Colores para la consola
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${GREEN}==================================================${NC}"
echo -e "${BOLD}${GREEN}   NKRIPTA ADMIN - TESTS DENTRO DE DOCKER   ${NC}"
echo -e "${BOLD}${GREEN}==================================================${NC}"

# Verificar si Docker está en ejecución
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker no está en ejecución. Por favor, inicie Docker y vuelva a intentarlo.${NC}"
  exit 1
fi

# Verificar si los servicios necesarios están en ejecución
echo -e "${BLUE}Verificando si los servicios Docker están ejecutándose...${NC}"

if ! docker compose ps | grep -q "Up"; then
  echo -e "${YELLOW}Los servicios no están iniciados. Iniciando servicios Docker...${NC}"
  docker compose up -d
  
  # Esperar a que los servicios estén disponibles
  echo -e "${YELLOW}Esperando a que los servicios estén disponibles...${NC}"
  ./scripts/wait-for-services.sh
else
  echo -e "${GREEN}Los servicios ya están en ejecución.${NC}"
fi

# Preguntar al usuario qué tipo de prueba quiere ejecutar
echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}Opciones de ejecución de pruebas:${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "1) ${YELLOW}Ejecutar todas las pruebas secuencialmente${NC}"
echo -e "2) ${YELLOW}Ejecutar todas las pruebas con generación de informes${NC}"
echo -e "3) ${YELLOW}Ejecutar pruebas específicas${NC}"
echo -e "4) ${YELLOW}Ejecutar pruebas con configuración personalizada${NC}"
echo -e "${BLUE}==================================================${NC}"

read -p "Seleccione una opción (1-4): " TEST_OPTION

# Configurar comando según la opción seleccionada
case $TEST_OPTION in
  1)
    echo -e "${GREEN}Ejecutando todas las pruebas secuencialmente...${NC}"
    DOCKER_CMD="npm run test:sequential"
    ;;
  2)
    echo -e "${GREEN}Ejecutando todas las pruebas con generación de informes...${NC}"
    DOCKER_CMD="npm run test:sequential-with-reports"
    ;;
  3)
    echo -e "${BLUE}Seleccione el tipo de prueba específica:${NC}"
    echo -e "1) ${YELLOW}Pruebas de autenticación${NC}"
    echo -e "2) ${YELLOW}Pruebas de organizaciones${NC}"
    echo -e "3) ${YELLOW}Pruebas de perfiles${NC}"
    echo -e "4) ${YELLOW}Pruebas de suscripciones${NC}"
    echo -e "5) ${YELLOW}Pruebas de integración${NC}"
    
    read -p "Seleccione una opción (1-5): " SPECIFIC_TEST
    
    case $SPECIFIC_TEST in
      1)
        echo -e "${GREEN}Ejecutando pruebas de autenticación...${NC}"
        DOCKER_CMD="npm run test:auth"
        ;;
      2)
        echo -e "${GREEN}Ejecutando pruebas de organizaciones...${NC}"
        DOCKER_CMD="npm run test:organizations"
        ;;
      3)
        echo -e "${GREEN}Ejecutando pruebas de perfiles...${NC}"
        DOCKER_CMD="npm run test:profiles"
        ;;
      4)
        echo -e "${GREEN}Ejecutando pruebas de suscripciones...${NC}"
        DOCKER_CMD="npm run test:subscriptions"
        ;;
      5)
        echo -e "${GREEN}Ejecutando pruebas de integración...${NC}"
        DOCKER_CMD="npm run test:integration"
        ;;
      *)
        echo -e "${RED}Opción no válida.${NC}"
        exit 1
        ;;
    esac
    ;;
  4)
    echo -e "${BLUE}Configuración personalizada:${NC}"
    echo -e "${YELLOW}Ingrese comando a ejecutar dentro del contenedor (sin 'docker compose exec app'):${NC}"
    read -p "> " CUSTOM_CMD
    DOCKER_CMD="$CUSTOM_CMD"
    ;;
  *)
    echo -e "${RED}Opción no válida.${NC}"
    exit 1
    ;;
esac

# Mostrar resumen de la ejecución
echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}Resumen de la ejecución:${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "${YELLOW}Comando a ejecutar:${NC} $DOCKER_CMD"
echo -e "${YELLOW}Contenedor:${NC} app (nkripta_admin)"
echo -e "${BLUE}==================================================${NC}"

# Confirmar ejecución
read -p "¿Desea continuar? (s/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
  echo -e "${YELLOW}Ejecución cancelada.${NC}"
  exit 0
fi

# Ejecutar el comando en el contenedor
echo -e "${BOLD}${GREEN}Ejecutando pruebas dentro del contenedor Docker...${NC}"

# Añadir variables de entorno para pruebas
docker compose exec -e STRIPE_MOCK_ENABLED=true -e TEST_MODE=full app bash -c "$DOCKER_CMD"

# Capturar el código de salida
EXIT_CODE=$?

# Verificar si se generaron informes
if [[ $DOCKER_CMD == *"with-reports"* ]] || [[ $DOCKER_CMD == *"all-reports"* ]]; then
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${BLUE}Informes generados:${NC}"
  echo -e "${BLUE}==================================================${NC}"
  
  # Listar informes generados dentro del contenedor
  docker compose exec app ls -la test-reports/
  
  # Preguntar si se desea copiar los informes al sistema local
  read -p "¿Desea copiar los informes al sistema local? (s/n): " COPY_REPORTS
  if [[ "$COPY_REPORTS" =~ ^[Ss]$ ]]; then
    echo -e "${GREEN}Copiando informes al sistema local...${NC}"
    
    # Crear directorio local si no existe
    mkdir -p ./test-reports
    
    # Copiar informes desde el contenedor al sistema local
    docker cp $(docker compose ps -q app):/app/test-reports/. ./test-reports/
    
    echo -e "${GREEN}Informes copiados al directorio ./test-reports/${NC}"
    ls -la ./test-reports/
  fi
fi

# Mostrar mensaje final
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${BOLD}${GREEN}✅ Ejecución exitosa de las pruebas.${NC}"
else
  echo -e "${BOLD}${RED}❌ Las pruebas fallaron con código de salida $EXIT_CODE.${NC}"
fi

exit $EXIT_CODE