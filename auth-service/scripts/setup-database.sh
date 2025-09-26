#!/bin/bash

# Script para configurar o banco de dados local
# Executa migrações e seeds

echo "🚀 Configurando banco de dados para Auth Service..."

# Verificar se o PostgreSQL está rodando
echo "📊 Verificando conexão com PostgreSQL..."
pg_isready -h localhost -p 5432 -U postgres -d workcode

if [ $? -ne 0 ]; then
    echo "❌ PostgreSQL não está rodando ou não está acessível"
    echo "   Certifique-se de que o PostgreSQL está rodando na porta 5432"
    echo "   Usuário: postgres, Banco: workcode"
    exit 1
fi

echo "✅ PostgreSQL está acessível"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Executar migrações
echo "🗄️ Executando migrações..."
npm run db:migrate

if [ $? -eq 0 ]; then
    echo "✅ Migrações executadas com sucesso"
else
    echo "❌ Erro ao executar migrações"
    exit 1
fi

# Executar seeds
echo "🌱 Executando seeds..."
npm run db:seed

if [ $? -eq 0 ]; then
    echo "✅ Seeds executados com sucesso"
else
    echo "❌ Erro ao executar seeds"
    exit 1
fi

echo "🎉 Banco de dados configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute: npm run dev"
echo "   2. Acesse: http://localhost:3001/health"
echo "   3. Teste a API: http://localhost:3001/api/info"
echo ""
echo "🔧 Usuários de teste criados:"
echo "   - admin@workadventure.localhost (senha: Test123!@#)"
echo "   - test@workadventure.localhost (senha: Test123!@#)"
echo "   - demo@workadventure.localhost (senha: Test123!@#)"
