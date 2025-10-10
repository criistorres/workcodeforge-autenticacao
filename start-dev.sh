#!/bin/bash
# ===========================================
# WorkCodeForge - Start Development Environment
# ===========================================

set -e

echo "🚀 Starting WorkCodeForge in DEVELOPMENT mode..."
echo ""

# Verificar se .env.development existe
if [ ! -f ".env.development" ]; then
    echo "❌ Error: .env.development file not found!"
    echo "Please create it from .env.template"
    exit 1
fi

# Verificar se as chaves RSA existem
if [ ! -f "workadventure-auth/backend/keys/private.key" ]; then
    echo "⚠️  Warning: RSA keys not found. Generating them now..."
    mkdir -p workadventure-auth/backend/keys
    openssl genrsa -out workadventure-auth/backend/keys/private.key 2048
    openssl rsa -in workadventure-auth/backend/keys/private.key -pubout -out workadventure-auth/backend/keys/public.key
    echo "✅ RSA keys generated successfully!"
fi

echo "📦 Building and starting containers..."
echo ""

# Exportar variáveis do .env.development
export $(grep -v '^#' .env.development | xargs)

# Iniciar com docker-compose (usa automaticamente docker-compose.override.yml)
docker-compose up --build

echo ""
echo "✅ Development environment is running!"
echo ""
echo "📍 Available URLs:"
echo "   - Play: http://play.workadventure.localhost"
echo "   - Auth: http://auth.workadventure.localhost"
echo "   - Maps: http://maps.workadventure.localhost"
echo "   - Map Storage: http://map-storage.workadventure.localhost"
echo "   - Traefik Dashboard: http://traefik.workadventure.localhost"
echo "   - PgAdmin: http://pgadmin.workadventure.localhost"
echo ""
echo "To stop: Press Ctrl+C or run ./stop-dev.sh"
