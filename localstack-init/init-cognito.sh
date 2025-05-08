#!/bin/bash

# Esperar a que LocalStack esté listo
echo "Waiting for LocalStack to be ready..."
# No esperamos por cognito específicamente ya que no aparece en la respuesta de health
curl -s http://localhost:4566/_localstack/health
echo "Assuming LocalStack is ready..."

# Variables de configuración
REGION="us-east-1"
USER_POOL_NAME="nkripta-user-pool"
CLIENT_NAME="nkripta-client"

# Crear User Pool para Cognito
echo "Creating Cognito User Pool..."
USER_POOL_ID=$(awslocal cognito-idp create-user-pool \
  --pool-name $USER_POOL_NAME \
  --auto-verified-attributes email \
  --schema Name=email,Required=true Name=custom:organizationId,Required=false \
  --query "UserPool.Id" \
  --output text)

echo "User Pool created with ID: $USER_POOL_ID"

# Crear App Client para el User Pool
echo "Creating Cognito App Client..."
CLIENT_ID=$(awslocal cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name $CLIENT_NAME \
  --no-generate-secret \
  --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" \
  --query "UserPoolClient.ClientId" \
  --output text)

echo "App Client created with ID: $CLIENT_ID"

# Mostrar información para actualizar el archivo .env
echo ""
echo "------------------------------------------------"
echo "Add to .env:"
echo "COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo "COGNITO_CLIENT_ID=$CLIENT_ID"
echo "COGNITO_REGION=$REGION"
echo "------------------------------------------------"

# Guardar la información en un archivo para futuras referencias
echo "COGNITO_USER_POOL_ID=$USER_POOL_ID" > /tmp/localstack/cognito_info.txt
echo "COGNITO_CLIENT_ID=$CLIENT_ID" >> /tmp/localstack/cognito_info.txt
echo "COGNITO_REGION=$REGION" >> /tmp/localstack/cognito_info.txt

echo "Setup completed!"