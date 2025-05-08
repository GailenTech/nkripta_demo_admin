#!/bin/bash

# Colores para la salida
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Esperar a que PostgreSQL esté listo
wait_for_postgres() {
  echo -e "${YELLOW}Esperando a que PostgreSQL esté listo...${NC}"
  
  # Usar un enfoque de conexión TCP en lugar de pg_isready
  host="postgres"
  port="5432"
  
  while ! timeout 1 bash -c "cat < /dev/null > /dev/tcp/$host/$port"; do
    echo -e "${YELLOW}PostgreSQL no está disponible en $host:$port - esperando...${NC}"
    sleep 1
  done
  
  # Esperar un poco más para que PostgreSQL termine de inicializar
  sleep 2
  
  echo -e "${GREEN}PostgreSQL está listo!${NC}"
}

# Esperar a que Cognito Local esté listo
wait_for_cognito() {
  echo -e "${YELLOW}Esperando a que Cognito Local esté listo...${NC}"
  
  until curl -s http://cognito-local:9229/status > /dev/null; do
    echo -e "${YELLOW}Cognito Local no está disponible - esperando...${NC}"
    sleep 1
  done
  
  echo -e "${GREEN}Cognito Local está listo!${NC}"
}

# Esperar a que Stripe Mock esté listo
wait_for_stripe() {
  echo -e "${YELLOW}Esperando a que Stripe Mock esté listo...${NC}"
  
  until curl -s http://stripe-mock:12111/v1/customers > /dev/null; do
    echo -e "${YELLOW}Stripe Mock no está disponible - esperando...${NC}"
    sleep 1
  done
  
  echo -e "${GREEN}Stripe Mock está listo!${NC}"
}

# Inicializar Cognito
initialize_cognito() {
  echo -e "${YELLOW}Inicializando recursos de Cognito...${NC}"
  node /app/scripts/create-cognito-resources.js
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Recursos de Cognito inicializados correctamente.${NC}"
  else
    echo -e "${RED}Error al inicializar recursos de Cognito.${NC}"
    exit 1
  fi
}

# Esperar a todos los servicios
wait_for_all_services() {
  wait_for_postgres
  wait_for_cognito
  wait_for_stripe
  initialize_cognito
  echo -e "${GREEN}Todos los servicios están listos!${NC}"
}

# Si el script se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  wait_for_all_services
fi