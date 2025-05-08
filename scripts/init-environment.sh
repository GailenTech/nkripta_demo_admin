#!/bin/bash
# Script para inicializar y configurar todo el entorno de desarrollo

set -e

echo -e "\033[1;33mInicializando entorno completo...\033[0m"

# 1. Esperar a que todos los servicios estén listos
echo -e "\033[1;33mEsperando a que los servicios estén listos...\033[0m"
bash scripts/wait-for-services.sh

# 2. Crear recursos de Cognito
echo -e "\033[1;33mCreando recursos de Cognito...\033[0m"
node scripts/create-cognito-resources.js > cognito_info.tmp

# 3. Actualizar variables de entorno
echo -e "\033[1;33mActualizando variables de entorno...\033[0m"
USER_POOL_ID=$(grep "COGNITO_USER_POOL_ID" cognito_info.tmp | cut -d'=' -f2)
CLIENT_ID=$(grep "COGNITO_CLIENT_ID" cognito_info.tmp | cut -d'=' -f2)

# Escribe un archivo .env.new temporal para no sobreescribir el archivo original por completo
cat .env | sed "s/^COGNITO_USER_POOL_ID=.*$/COGNITO_USER_POOL_ID=$USER_POOL_ID/" | sed "s/^COGNITO_CLIENT_ID=.*$/COGNITO_CLIENT_ID=$CLIENT_ID/" > .env.new
mv .env.new .env

# Limpieza del archivo temporal
rm -f cognito_info.tmp

# 4. Reiniciar la aplicación
echo -e "\033[1;33mReiniciando la aplicación...\033[0m"
docker compose restart app

# 5. Esperar a que la aplicación esté lista
echo -e "\033[1;33mEsperando a que la aplicación esté lista...\033[0m"
sleep 5

# 6. Crear datos iniciales
echo -e "\033[1;33mCreando datos iniciales en la base de datos...\033[0m"
docker compose exec -T app node scripts/create-test-data.js

# 7. Registrar usuario admin
echo -e "\033[1;33mRegistrando usuario administrador...\033[0m"
docker compose exec -T app node scripts/register-user.js

echo -e "\033[0;32mEntorno inicializado correctamente!\033[0m"
echo -e "\033[0;32mPuedes acceder a la API en http://localhost:3000/api\033[0m"
echo -e "\033[0;32mCredenciales de prueba:\033[0m"
echo -e "\033[0;32m- Email: admin@example.com\033[0m"
echo -e "\033[0;32m- Password: Password123\033[0m"