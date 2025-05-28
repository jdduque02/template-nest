# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependencias de construcción
RUN npm ci --only=production

# Copiar código fuente
COPY src ./src
COPY test ./test

# Compilar proyecto
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /usr/src/app

# Configurar variables de entorno para producción
ENV NODE_ENV production
ENV PORT 3000

# Instalar dependencias de producción
COPY --from=builder /usr/src/app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar artefactos de construcción
COPY --from=builder /usr/src/app/dist ./dist

# Exponer puerto y ejecutar aplicación
EXPOSE ${PORT}
CMD ["node", "dist/main.js"]