# Usar Node.js 18 Alpine como base
FROM node:18-alpine AS builder

# Instalar dependencias del sistema necesarias para Prisma
# Agregar al Dockerfile en la etapa builder
RUN apk add --no-cache \
    ca-certificates \
    dumb-init \
    libc6-compat \
    openssl \
    openssl-dev \
    && rm -rf /var/cache/apk/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Configurar variables de entorno para Prisma
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl"
ENV OPENSSL_CONF=/etc/ssl/

# Instalar dependencias (incluyendo dev para build)
RUN npm ci && npm cache clean --force

# Generar cliente Prisma
RUN npx prisma generate

# Copiar código fuente y configuración
COPY src ./src
COPY tsconfig.json ./

# Compilar TypeScript
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS runner

# Instalar dependencias del sistema necesarias para Prisma
RUN apk add --no-cache \
        ca-certificates \
        dumb-init \
        libc6-compat \
        openssl \
        openssl-dev \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodeuser

WORKDIR /app

# Copiar artefactos de build
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/package*.json ./
COPY --from=builder --chown=nodeuser:nodejs /app/prisma ./prisma

# Crear directorio de logs
RUN mkdir -p logs && chown -R nodeuser:nodejs logs

# Cambiar a usuario no-root
USER nodeuser

# Exponer puerto
EXPOSE 3000

# Health check mejorado
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Usar dumb-init como PID 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]