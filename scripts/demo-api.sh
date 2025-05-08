#!/bin/bash

# Script de demostración para la API de nkripta_admin
# Este script muestra ejemplos de uso de la API mediante curl

# Colores para mejor visualización
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL para la API
API_URL="http://localhost:3000/api"

# Variable para almacenar el token JWT
TOKEN=""

# Función para imprimir encabezados
print_header() {
    echo -e "\n${BLUE}===========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===========================================${NC}\n"
}

# Función para imprimir respuestas
print_response() {
    echo -e "${YELLOW}Respuesta:${NC}"
    echo $1 | jq . 2>/dev/null || echo $1
    echo -e "\n"
}

# Función para ejecutar comandos curl
run_curl() {
    echo -e "${GREEN}Ejecutando:${NC} $1\n"
    eval $1
}

# Verificar que jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Por favor instala jq para mejor visualización de resultados:${NC}"
    echo -e "Puedes instalarlo con: brew install jq (macOS) o apt-get install jq (Linux)"
fi

# Verificar que la API está en ejecución
print_header "0. Verificando que la API está en funcionamiento"
run_curl "curl -s $API_URL"
response=$(curl -s $API_URL)
print_response "$response"

# 1. Autenticación - Login
print_header "1. Autenticación - Iniciar sesión con el usuario admin"
login_cmd="curl -s -X POST $API_URL/auth/login \\
  -H \"Content-Type: application/json\" \\
  -d '{\"email\":\"admin@example.com\",\"password\":\"Password123\"}'"
run_curl "$login_cmd"

login_response=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123"}')

print_response "$login_response"

# Extraer el token JWT
TOKEN=$(echo $login_response | jq -r '.token')
echo -e "${GREEN}Token JWT extraído:${NC} ${TOKEN:0:30}...\n"

# 2. Obtener perfil del usuario
print_header "2. Verificar perfil del usuario autenticado"
profile_cmd="curl -s $API_URL/auth/me \\
  -H \"Authorization: Bearer $TOKEN\""
run_curl "$profile_cmd"

profile_response=$(curl -s $API_URL/auth/me \
  -H "Authorization: Bearer $TOKEN")

print_response "$profile_response"

# 3. Obtener detalles de la organización
print_header "3. Obtener detalles de la organización"
org_id="00000000-0000-0000-0000-000000000000"
org_cmd="curl -s $API_URL/organizations/$org_id \\
  -H \"Authorization: Bearer $TOKEN\""
run_curl "$org_cmd"

org_response=$(curl -s $API_URL/organizations/$org_id \
  -H "Authorization: Bearer $TOKEN")

print_response "$org_response"

# 4. Obtener miembros de la organización
print_header "4. Obtener miembros de la organización"
members_cmd="curl -s \"$API_URL/organizations/$org_id/members?page=1&limit=10\" \\
  -H \"Authorization: Bearer $TOKEN\""
run_curl "$members_cmd"

members_response=$(curl -s "$API_URL/organizations/$org_id/members?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

print_response "$members_response"

# 5. Intentar acceder sin token (debería fallar)
print_header "5. Intentar acceder sin token de autenticación (debería fallar)"
no_token_cmd="curl -s $API_URL/organizations/$org_id"
run_curl "$no_token_cmd"

no_token_response=$(curl -s $API_URL/organizations/$org_id)

print_response "$no_token_response"

# 6. Crear una nueva organización
print_header "6. Crear una nueva organización"
create_org_cmd="curl -s -X POST $API_URL/organizations \\
  -H \"Authorization: Bearer $TOKEN\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"name\": \"Organización de Prueba\",
    \"description\": \"Esta es una organización creada para probar la API\",
    \"slug\": \"test-org\",
    \"website\": \"https://test-org.example.com\",
    \"email\": \"info@test-org.example.com\",
    \"phone\": \"+123456789\"
  }'"
run_curl "$create_org_cmd"

create_org_response=$(curl -s -X POST $API_URL/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organización de Prueba",
    "description": "Esta es una organización creada para probar la API",
    "slug": "test-org",
    "website": "https://test-org.example.com",
    "email": "info@test-org.example.com",
    "phone": "+123456789"
  }')

print_response "$create_org_response"

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}Demostración de API completada${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "\n${GREEN}Credenciales para uso manual:${NC}"
echo -e "Email: admin@example.com"
echo -e "Password: Password123"
echo -e "Token: ${TOKEN:0:30}...\n"