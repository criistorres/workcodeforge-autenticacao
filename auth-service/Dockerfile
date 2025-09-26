# Dockerfile para Auth Service
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache \
    dumb-init \
    python3 \
    make \
    g++ \
    sqlite-dev \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci && npm cache clean --force

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Remover e reinstalar dependências nativas para garantir compatibilidade de arquitetura
RUN npm uninstall bcrypt better-sqlite3 && npm install bcrypt better-sqlite3

# Remover dependências de desenvolvimento
RUN npm prune --production

# Mudar propriedade do diretório para o usuário nextjs
RUN chown -R nextjs:nodejs /app

# Criar usuário não-root
USER nextjs

# Expor porta
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicialização
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
