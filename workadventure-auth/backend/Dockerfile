FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar TODAS as dependências (incluindo dev)
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Estágio de produção
FROM node:18-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar arquivos compilados do estágio anterior
COPY --from=builder /app/dist ./dist

# Copiar chaves RSA
COPY keys ./keys

# Expor porta
EXPOSE 3000

# Iniciar aplicação
CMD ["node", "dist/main.js"]
