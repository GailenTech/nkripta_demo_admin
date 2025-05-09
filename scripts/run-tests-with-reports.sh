#!/bin/bash

# Script para ejecutar pruebas y generar reportes para CI/CD

# Colores para la consola
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando ejecución de pruebas con generación de reportes${NC}"

# Crear directorio para reportes si no existe
mkdir -p test-reports

# Establecer variables de entorno para las pruebas
export STRIPE_MOCK_ENABLED=true
export TEST_MODE=full
export CI=true
export GENERATE_REPORTS=true

# Ejecutar tests secuencialmente con generación de reportes
echo -e "${BLUE}Ejecutando pruebas secuenciales con generación de reportes...${NC}"
node tests/run-tests.js --reports

# Capturar el código de salida
EXIT_CODE=$?

# Generar documentación a partir de los reportes
echo -e "${BLUE}Generando documentación de pruebas...${NC}"
node scripts/generate-test-docs.js

# Mostrar información sobre los reportes generados
echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}Reportes generados:${NC}"
echo -e "${BLUE}===================================${NC}"
echo -e "${YELLOW}Directorio de reportes: $(pwd)/test-reports${NC}"

# Listar los reportes generados
ls -la test-reports/

# Determinar el resultado final
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}Todas las pruebas pasaron exitosamente.${NC}"
  
  # Mostrar un resumen del reporte Markdown
  if [ -f "test-reports/test-summary.md" ]; then
    echo -e "${BLUE}===================================${NC}"
    echo -e "${BLUE}Resumen del informe:${NC}"
    echo -e "${BLUE}===================================${NC}"
    # Mostrar las primeras líneas del resumen
    head -n 15 test-reports/test-summary.md
    echo -e "${YELLOW}Ver el informe completo en: test-reports/test-summary.md${NC}"
  fi
else
  echo -e "${RED}Algunas pruebas fallaron. Revise los reportes para más detalles.${NC}"
  
  # Mostrar un resumen del reporte Markdown con énfasis en los fallos
  if [ -f "test-reports/test-summary.md" ]; then
    echo -e "${BLUE}===================================${NC}"
    echo -e "${RED}Resumen de fallos:${NC}"
    echo -e "${BLUE}===================================${NC}"
    # Buscar la sección de pruebas fallidas en el resumen
    grep -A 20 "## Pruebas Fallidas" test-reports/test-summary.md || echo "No se encontró información detallada de fallos"
    echo -e "${YELLOW}Ver el informe completo en: test-reports/test-summary.md${NC}"
  fi
fi

# Salir con el código apropiado
exit $EXIT_CODE