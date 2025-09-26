#!/bin/bash

# Script para configurar o ambiente SQLite
echo "🚀 Configurando ambiente SQLite para Auth Service..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado. Por favor, instale npm primeiro."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Criar diretório de dados
echo "📁 Criando diretórios necessários..."
mkdir -p data
mkdir -p logs

# Copiar arquivo de configuração se não existir
if [ ! -f .env ]; then
    echo "⚙️ Copiando arquivo de configuração..."
    cp env.sqlite.example .env
    echo "✅ Arquivo .env criado. Por favor, edite as configurações conforme necessário."
fi

# Executar migrações
echo "🗄️ Executando migrações do banco de dados..."
npm run db:migrate-sqlite

# Executar seeds
echo "🌱 Executando seeds do banco de dados..."
npm run db:seed-sqlite

echo "✅ Configuração do SQLite concluída!"
echo ""
echo "Para iniciar o servidor:"
echo "  npm run dev"
echo ""
echo "Para testar:"
echo "  npm test"
echo ""
echo "Endpoints disponíveis:"
echo "  Health Check: http://localhost:3001/health"
echo "  API Info: http://localhost:3001/api/info"
echo "  Auth: http://localhost:3001/auth/*"
