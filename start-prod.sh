#!/bin/bash
# ===========================================
# WorkCodeForge - Start Production Environment
# ===========================================

set -e

echo "🚀 Starting WorkCodeForge in PRODUCTION mode..."
echo ""

# Verificar se .env.production existe
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create it and configure all secrets before deploying to production."
    exit 1
fi

# Verificar se as chaves RSA existem
if [ ! -f "workadventure-auth/backend/keys/private.key" ]; then
    echo "❌ Error: RSA keys not found!"
    echo "Please generate them with:"
    echo "  mkdir -p workadventure-auth/backend/keys"
    echo "  openssl genrsa -out workadventure-auth/backend/keys/private.key 2048"
    echo "  openssl rsa -in workadventure-auth/backend/keys/private.key -pubout -out workadventure-auth/backend/keys/public.key"
    exit 1
fi

# Verificar se ACME_EMAIL está configurado
source .env.production
if [ -z "$ACME_EMAIL" ]; then
    echo "❌ Error: ACME_EMAIL is not set in .env.production"
    echo "This is required for Let's Encrypt SSL certificates."
    exit 1
fi

# Verificar se secrets foram alterados
if grep -q "CHANGE_ME" .env.production; then
    echo "⚠️  WARNING: Found CHANGE_ME values in .env.production!"
    echo "Please replace all CHANGE_ME values with actual secrets before deploying."
    read -p "Continue anyway? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

echo "📦 Building and starting containers in production mode..."
echo ""

# Exportar variáveis do .env.production
export $(grep -v '^#' .env.production | xargs)

# Iniciar com configuração de produção
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml up --build -d

echo ""
echo "✅ Production environment is running!"
echo ""
echo "📍 Your application should be available at:"
echo "   - Play: https://play.${DOMAIN}"
echo "   - Auth: https://auth.${DOMAIN}"
echo "   - Maps: https://maps.${DOMAIN}"
echo "   - Map Storage: https://map-storage.${DOMAIN}"
echo ""
echo "⏳ Note: SSL certificates may take a few minutes to be issued by Let's Encrypt"
echo ""
echo "📊 To view logs, run:"
echo "   docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 To stop, run: ./stop-prod.sh"
