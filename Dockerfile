# Multi-stage build para Nuxt.js
FROM node:lts-alpine AS base

# Instalar dumb-init para proper signal handling
RUN apk add --no-cache dumb-init

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# ========================================
# Dependências e Build Stage
# ========================================
FROM base AS builder

# Copiar arquivos de package
COPY package*.json ./

# Instalar dependências (incluindo dev dependencies para build)
RUN npm ci

# Copiar código fonte
COPY --chown=nodejs:nodejs . .

# Build da aplicação
RUN npm run build

# ========================================
# Production Stage
# ========================================
FROM base AS production

# Copiar apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar build da aplicação do builder stage
COPY --from=builder --chown=nodejs:nodejs /app/.output ./.output

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { \
  if (res.statusCode === 200) process.exit(0); else process.exit(1); \
  }).on('error', () => process.exit(1));"

# Usar dumb-init para proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Comando para executar a aplicação
CMD ["node", ".output/server/index.mjs"]