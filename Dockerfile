FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache bash postgresql-client curl netcat-openbsd

# Copiar archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto de archivos del proyecto
COPY . .

# Copiar script de entrada
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Exponer el puerto de la aplicación
EXPOSE 3000

# Usar el script como punto de entrada
ENTRYPOINT ["docker-entrypoint.sh"]

# Comando por defecto
CMD ["npm", "run", "dev"]