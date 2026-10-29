# --- ETAPA 1: Construir el Frontend (Next.js) ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- ETAPA 2: Entorno de Producción (Express + Estáticos) ---
FROM node:20-alpine AS runner
WORKDIR /app

# Instalar dependencias del backend
COPY backend/package*.json ./
RUN npm install --production

# Copiar el código del backend
COPY backend/ ./

# Copiar los archivos compilados de Next.js al directorio que Express gestionará
COPY --from=frontend-builder /app/frontend/.next ./public/.next
COPY --from=frontend-builder /app/frontend/public ./public/public

ENV PORT=4000
EXPOSE 4000

CMD ["node", "server.js"]