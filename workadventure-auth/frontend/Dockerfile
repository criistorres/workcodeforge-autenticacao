FROM node:18-alpine AS builder

WORKDIR /app

# Build arguments para variáveis Vite
ARG VITE_PLAY_REDIRECT_URI=https://play.workcodeforge.com.br/openid-callback
ARG VITE_MATRIX_REDIRECT_URI=https://matrix.workcodeforge.com.br/_synapse/client/oidc/callback

# Exportar como ENV para o build
ENV VITE_PLAY_REDIRECT_URI=${VITE_PLAY_REDIRECT_URI}
ENV VITE_MATRIX_REDIRECT_URI=${VITE_MATRIX_REDIRECT_URI}

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build para produção
RUN npm run build

# Imagem final com servidor estático
FROM node:18-alpine

WORKDIR /app

# Instalar serve para servir arquivos estáticos
RUN npm install -g serve

# Copiar build do stage anterior
COPY --from=builder /app/dist ./dist

# Expor porta
EXPOSE 5173

# Servir arquivos estáticos
CMD ["serve", "-s", "dist", "-l", "5173"]
