#!/bin/bash

# Script para ejecutar pruebas completas asegurando que todos los servicios necesarios
# estén iniciados y configurados correctamente (PostgreSQL, Cognito Local, Stripe Mock)

# Colores para la consola
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${GREEN}==================================================${NC}"
echo -e "${BOLD}${GREEN}   NKRIPTA ADMIN - EJECUCIÓN COMPLETA DE PRUEBAS   ${NC}"
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

# Comprobar específicamente los servicios necesarios
echo -e "${BLUE}Comprobando servicios específicos...${NC}"

# PostgreSQL
if ! docker compose ps | grep -q "postgres.*Up"; then
  echo -e "${RED}Error: El servicio PostgreSQL no está en ejecución.${NC}"
  echo -e "${YELLOW}Intentando iniciar el servicio de PostgreSQL...${NC}"
  docker compose up -d postgres
  sleep 5
fi

# Stripe Mock (opcional, ya que podemos usar la variable STRIPE_MOCK_ENABLED)
if ! docker compose ps | grep -q "stripe-mock.*Up"; then
  echo -e "${YELLOW}El servicio Stripe Mock no está en ejecución. Habilitando mock interno...${NC}"
  export STRIPE_MOCK_ENABLED=true
else
  echo -e "${GREEN}Stripe Mock está en ejecución.${NC}"
fi

# Ejecutar un healthcheck de la base de datos
echo -e "${BLUE}Ejecutando healthcheck de PostgreSQL...${NC}"
if ! docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
  echo -e "${RED}Error: PostgreSQL no está respondiendo correctamente.${NC}"
  echo -e "${YELLOW}Intentando reiniciar PostgreSQL...${NC}"
  docker compose restart postgres
  sleep 10
  
  if ! docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${RED}Error: No se pudo conectar a PostgreSQL después de reiniciarlo. Abortando.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}PostgreSQL está operativo.${NC}"
fi

# Generar archivo .env.test si no existe
if [ ! -f .env.test ]; then
  echo -e "${YELLOW}No se encontró archivo .env.test. Generando uno a partir de .env...${NC}"
  
  if [ -f .env ]; then
    cp .env .env.test
    # Modificar .env.test para pruebas
    sed -i.bak 's/NODE_ENV=.*/NODE_ENV=test/' .env.test
    sed -i.bak 's/DB_NAME=.*/DB_NAME=nkripta_test/' .env.test
    # Añadir configuración para pruebas
    echo "STRIPE_MOCK_ENABLED=true" >> .env.test
    echo "TEST_MODE=full" >> .env.test
    rm -f .env.test.bak
  else
    echo -e "${RED}Error: No se encontró archivo .env para copiar. Creando uno básico...${NC}"
    echo "NODE_ENV=test" > .env.test
    echo "DB_HOST=localhost" >> .env.test
    echo "DB_PORT=5432" >> .env.test
    echo "DB_NAME=nkripta_test" >> .env.test
    echo "DB_USER=postgres" >> .env.test
    echo "DB_PASSWORD=postgres" >> .env.test
    echo "STRIPE_MOCK_ENABLED=true" >> .env.test
    echo "TEST_MODE=full" >> .env.test
  fi
  
  echo -e "${GREEN}Archivo .env.test generado.${NC}"
fi

# Preparar el entorno de pruebas
echo -e "${BLUE}Preparando el entorno de pruebas...${NC}"

# Crear el directorio de reportes si no existe
mkdir -p test-reports

# Preguntar al usuario si desea generar informes
read -p "¿Desea generar informes de pruebas? (s/n): " GENERATE_REPORTS
if [[ "$GENERATE_REPORTS" =~ ^[Ss]$ ]]; then
  REPORTS_FLAG="--reports"
  echo -e "${GREEN}Se generarán informes de pruebas en el directorio test-reports/${NC}"
else
  REPORTS_FLAG=""
  echo -e "${YELLOW}No se generarán informes de pruebas.${NC}"
fi

# Mostrar mensaje informativo
echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}Información sobre el entorno de pruebas:${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "${YELLOW}Base de datos:${NC} PostgreSQL (puerto 5432)"
echo -e "${YELLOW}Stripe Mock:${NC} Habilitado (STRIPE_MOCK_ENABLED=true)"
echo -e "${YELLOW}Modo de prueba:${NC} Completo (TEST_MODE=full)"
echo -e "${YELLOW}Informes:${NC} $(if [[ "$REPORTS_FLAG" == "--reports" ]]; then echo "Habilitados"; else echo "Deshabilitados"; fi)"
echo -e "${BLUE}==================================================${NC}"

# Preguntar al usuario si desea continuar
read -p "¿Desea continuar con la ejecución de las pruebas? (s/n): " CONTINUE
if [[ ! "$CONTINUE" =~ ^[Ss]$ ]]; then
  echo -e "${YELLOW}Ejecución de pruebas cancelada.${NC}"
  exit 0
fi

# Ejecutar las pruebas
echo -e "${BOLD}${GREEN}Iniciando ejecución de pruebas...${NC}"

# Establecer variables de entorno para las pruebas
export STRIPE_MOCK_ENABLED=true
export TEST_MODE=full

# Ejecutar pruebas secuencialmente
if [[ "$REPORTS_FLAG" == "--reports" ]]; then
  echo -e "${BLUE}Ejecutando pruebas con generación de informes...${NC}"
  node tests/run-tests.js --reports
  
  # Generar documentación si se solicitaron informes
  echo -e "${BLUE}Generando documentación de pruebas...${NC}"
  node scripts/generate-test-docs.js
else
  echo -e "${BLUE}Ejecutando pruebas sin generación de informes...${NC}"
  node tests/run-tests.js
fi

# Capturar el código de salida
EXIT_CODE=$?

# Mostrar resumen final
echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}Resumen de ejecución de pruebas:${NC}"
echo -e "${BLUE}==================================================${NC}"

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Todas las pruebas pasaron exitosamente.${NC}"
  
  if [[ "$REPORTS_FLAG" == "--reports" ]] && [ -f "test-reports/test-summary.md" ]; then
    echo -e "${BLUE}Resumen del informe:${NC}"
    head -n 15 test-reports/test-summary.md
    echo -e "${YELLOW}Informes completos disponibles en: test-reports/${NC}"
  fi
else
  echo -e "${RED}❌ Algunas pruebas fallaron.${NC}"
  
  if [[ "$REPORTS_FLAG" == "--reports" ]] && [ -f "test-reports/test-summary.md" ]; then
    echo -e "${RED}Detalles de los fallos:${NC}"
    grep -A 20 "## Pruebas Fallidas" test-reports/test-summary.md || echo "No se encontró información detallada de fallos"
    echo -e "${YELLOW}Informes completos disponibles en: test-reports/${NC}"
  fi
fi

echo -e "${BLUE}==================================================${NC}"
echo -e "${BOLD}${GREEN}Ejecución de pruebas finalizada.${NC}"

# Salir con el código apropiado
exit $EXIT_CODE