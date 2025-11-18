#!/bin/bash
# ===========================================
# WorkCodeForge - Gerador de Secrets para Produção
# ===========================================
# Este script gera secrets fortes e aleatórios para usar
# nas variáveis de ambiente de produção.
#
# Uso:
#   bash scripts/generate-secrets.sh
#   bash scripts/generate-secrets.sh --auto-update  # Atualiza .env.production automaticamente
# ===========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "=================================================="
echo "  WorkCodeForge - Gerador de Secrets"
echo "=================================================="
echo -e "${NC}"

# Verificar se openssl está disponível
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ Erro: openssl não está instalado${NC}"
    echo "Instale com: sudo apt install openssl (Ubuntu/Debian) ou brew install openssl (macOS)"
    exit 1
fi

# Função para gerar secret forte
generate_secret() {
    openssl rand -base64 32 | tr -d '\n'
}

echo -e "${YELLOW}📝 Gerando secrets fortes...${NC}\n"

# Gerar todos os secrets
OPENID_CLIENT_SECRET=$(generate_secret)
SECRET_KEY=$(generate_secret)
POSTGRES_PASSWORD=$(generate_secret)
ROOM_API_SECRET_KEY=$(generate_secret)
ADMIN_API_TOKEN=$(generate_secret)
PROMETHEUS_AUTHORIZATION_TOKEN=$(generate_secret)
LIVEKIT_API_KEY=$(generate_secret | cut -c1-20)  # 20 caracteres
LIVEKIT_API_SECRET=$(generate_secret)

echo -e "${GREEN}✅ Secrets gerados com sucesso!${NC}\n"

# Verificar se deve atualizar automaticamente
AUTO_UPDATE=false
if [[ "$1" == "--auto-update" ]]; then
    AUTO_UPDATE=true
fi

# Mostrar secrets gerados
echo "=================================================="
echo "SECRETS GERADOS:"
echo "=================================================="
echo ""
echo -e "${BLUE}1. OPENID_CLIENT_SECRET:${NC}"
echo "   $OPENID_CLIENT_SECRET"
echo ""
echo -e "${BLUE}2. SECRET_KEY (JWT):${NC}"
echo "   $SECRET_KEY"
echo ""
echo -e "${BLUE}3. POSTGRES_PASSWORD:${NC}"
echo "   $POSTGRES_PASSWORD"
echo ""
echo -e "${BLUE}4. ROOM_API_SECRET_KEY:${NC}"
echo "   $ROOM_API_SECRET_KEY"
echo ""
echo -e "${BLUE}5. ADMIN_API_TOKEN:${NC}"
echo "   $ADMIN_API_TOKEN"
echo ""
echo -e "${BLUE}6. PROMETHEUS_AUTHORIZATION_TOKEN:${NC}"
echo "   $PROMETHEUS_AUTHORIZATION_TOKEN"
echo ""
echo -e "${BLUE}7. LIVEKIT_API_KEY:${NC}"
echo "   $LIVEKIT_API_KEY"
echo ""
echo -e "${BLUE}8. LIVEKIT_API_SECRET:${NC}"
echo "   $LIVEKIT_API_SECRET"
echo ""
echo "=================================================="

# Salvar em arquivo temporário
SECRETS_FILE="/tmp/workcodeforge-secrets-$(date +%Y%m%d_%H%M%S).txt"
cat > "$SECRETS_FILE" <<EOF
# WorkCodeForge Production Secrets
# Gerado em: $(date)
# ⚠️  ATENÇÃO: Este arquivo contém informações sensíveis!
# ⚠️  Apague após copiar os valores para .env.production

OPENID_CLIENT_SECRET=$OPENID_CLIENT_SECRET
SECRET_KEY=$SECRET_KEY
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ROOM_API_SECRET_KEY=$ROOM_API_SECRET_KEY
ADMIN_API_TOKEN=$ADMIN_API_TOKEN
PROMETHEUS_AUTHORIZATION_TOKEN=$PROMETHEUS_AUTHORIZATION_TOKEN
LIVEKIT_API_KEY=$LIVEKIT_API_KEY
LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET
EOF

echo ""
echo -e "${GREEN}✅ Secrets salvos em: ${SECRETS_FILE}${NC}"
echo -e "${YELLOW}⚠️  Copie os valores acima e apague o arquivo temporário depois!${NC}"
echo ""

# Perguntar se quer atualizar .env.production automaticamente
if [ "$AUTO_UPDATE" = false ]; then
    echo -e "${YELLOW}Deseja atualizar .env.production automaticamente? (s/N)${NC}"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        AUTO_UPDATE=true
    fi
fi

# Atualizar .env.production se solicitado
if [ "$AUTO_UPDATE" = true ]; then
    ENV_FILE=".env.production"

    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}❌ Erro: $ENV_FILE não encontrado${NC}"
        exit 1
    fi

    echo ""
    echo -e "${YELLOW}📝 Atualizando $ENV_FILE...${NC}"

    # Criar backup
    BACKUP_FILE="${ENV_FILE}.backup-$(date +%Y%m%d_%H%M%S)"
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"

    # Atualizar valores
    # Usando @ como delimitador para evitar conflitos com caracteres especiais
    sed -i.bak "s@OPENID_CLIENT_SECRET=CHANGE_ME_GENERATE_STRONG_SECRET_FOR_PRODUCTION@OPENID_CLIENT_SECRET=${OPENID_CLIENT_SECRET}@g" "$ENV_FILE"
    sed -i.bak "s@SECRET_KEY=CHANGE_ME_GENERATE_STRONG_JWT_SECRET_FOR_PRODUCTION@SECRET_KEY=${SECRET_KEY}@g" "$ENV_FILE"
    sed -i.bak "s@POSTGRES_PASSWORD=CHANGE_ME_GENERATE_STRONG_DB_PASSWORD_FOR_PRODUCTION@POSTGRES_PASSWORD=${POSTGRES_PASSWORD}@g" "$ENV_FILE"
    sed -i.bak "s@ROOM_API_SECRET_KEY=CHANGE_ME_IN_PRODUCTION@ROOM_API_SECRET_KEY=${ROOM_API_SECRET_KEY}@g" "$ENV_FILE"
    sed -i.bak "s@ADMIN_API_TOKEN=CHANGE_ME_IN_PRODUCTION@ADMIN_API_TOKEN=${ADMIN_API_TOKEN}@g" "$ENV_FILE"
    sed -i.bak "s@PROMETHEUS_AUTHORIZATION_TOKEN=CHANGE_ME_IN_PRODUCTION@PROMETHEUS_AUTHORIZATION_TOKEN=${PROMETHEUS_AUTHORIZATION_TOKEN}@g" "$ENV_FILE"
    sed -i.bak "s@LIVEKIT_API_KEY=CHANGE_ME_IN_PRODUCTION@LIVEKIT_API_KEY=${LIVEKIT_API_KEY}@g" "$ENV_FILE"
    sed -i.bak "s@LIVEKIT_API_SECRET=CHANGE_ME_IN_PRODUCTION@LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}@g" "$ENV_FILE"

    # Remover arquivo temporário do sed
    rm -f "${ENV_FILE}.bak"

    echo -e "${GREEN}✅ $ENV_FILE atualizado com sucesso!${NC}"
    echo ""

    # Verificar se ainda há CHANGE_ME
    REMAINING_CHANGES=$(grep -c "CHANGE_ME" "$ENV_FILE" || true)
    if [ "$REMAINING_CHANGES" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Atenção: Ainda existem $REMAINING_CHANGES valor(es) CHANGE_ME no arquivo${NC}"
        echo -e "${YELLOW}   Verifique manualmente:${NC}"
        grep -n "CHANGE_ME" "$ENV_FILE" || true
    else
        echo -e "${GREEN}✅ Todos os secrets foram atualizados!${NC}"
    fi
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Processo concluído!${NC}"
echo "=================================================="
echo ""
echo -e "${YELLOW}PRÓXIMOS PASSOS:${NC}"
echo "1. Verifique os valores em .env.production"
echo "2. Configure ACME_EMAIL com seu email real"
echo "3. Apague o arquivo temporário: rm $SECRETS_FILE"
echo "4. NUNCA commite .env.production no git!"
echo ""
echo -e "${BLUE}Para fazer deploy:${NC}"
echo "  docker compose -f docker-compose.yaml -f docker-compose.prod.yml --env-file .env.production up -d"
echo ""
