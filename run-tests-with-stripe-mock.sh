#!/bin/bash

# Colores para la consola
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Ejecutando tests con stripe-mock habilitado${NC}"

# Ejecutar tests con variables de entorno específicas
docker compose exec -e STRIPE_MOCK_ENABLED=true -e TEST_MODE=full app npm run test:sequential

# Restaurar salida
echo -e "${GREEN}Ejecución de tests completada${NC}"