# Guia de Deployment - WorkCodeForge VPS

## Visão Geral

Este documento detalha o processo completo de deployment do WorkCodeForge em uma VPS (Virtual Private Server) para produção, usando o domínio `work.codeforgeit.com.br`.

**Data de Criação**: 2025-10-11
**Autor**: Configuração automatizada via Claude Code

---

## 📋 Pré-requisitos

### Infraestrutura

1. **VPS com especificações mínimas:**
   - CPU: 2 cores
   - RAM: 4GB
   - Disco: 40GB SSD
   - Sistema Operacional: Ubuntu 22.04 LTS (recomendado)

2. **Domínio configurado:**
   - Domínio principal: `work.codeforgeit.com.br`
   - Acesso ao painel DNS para criar subdomínios

3. **Software instalado na VPS:**
   - Docker (v24.0+)
   - Docker Compose (v2.20+)
   - Git
   - OpenSSL

### Configuração DNS

Crie os seguintes registros DNS do tipo **A** apontando para o IP da sua VPS:

```
play.work.codeforgeit.com.br    → IP_DA_VPS
api.work.codeforgeit.com.br     → IP_DA_VPS
maps.work.codeforgeit.com.br    → IP_DA_VPS
uploader.work.codeforgeit.com.br → IP_DA_VPS
auth.work.codeforgeit.com.br    → IP_DA_VPS
map-storage.work.codeforgeit.com.br → IP_DA_VPS
```

**Opcional (para ferramentas administrativas):**
```
traefik.work.codeforgeit.com.br → IP_DA_VPS
redis.work.codeforgeit.com.br   → IP_DA_VPS
```

---

## 🔧 Configuração Inicial da VPS

### 1. Conectar à VPS

```bash
ssh usuario@IP_DA_VPS
```

### 2. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Instalar Docker e Docker Compose

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version
```

### 4. Configurar Firewall

```bash
# Instalar UFW (se não estiver instalado)
sudo apt install ufw -y

# Configurar regras
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Ativar firewall
sudo ufw enable
sudo ufw status
```

---

## 📦 Deploy do Projeto

### 1. Clonar Repositório

```bash
cd /home/$USER
git clone https://github.com/seu-usuario/workcodeforge-autenticacao.git
cd workcodeforge-autenticacao
```

### 2. Configurar Arquivo de Produção

Copie o arquivo `.env.production` para a VPS de forma segura:

**Do seu computador local:**
```bash
scp .env.production usuario@IP_DA_VPS:/home/usuario/workcodeforge-autenticacao/
```

**Ou crie diretamente na VPS:**
```bash
nano .env.production
# Cole o conteúdo e ajuste os valores
```

### 3. Configurar Secrets de Produção

Edite o `.env.production` e substitua **todos os valores** marcados com `CHANGE_ME`:

```bash
nano .env.production
```

**Secrets críticos para gerar:**

```bash
# Gerar secrets fortes
openssl rand -base64 32  # Para SECRET_KEY
openssl rand -base64 32  # Para OPENID_CLIENT_SECRET
openssl rand -base64 32  # Para ROOM_API_SECRET_KEY
openssl rand -base64 32  # Para PROMETHEUS_AUTHORIZATION_TOKEN
```

**Valores importantes a configurar:**
- `DOMAIN=work.codeforgeit.com.br`
- `ACME_EMAIL=seu-email@codeforgeit.com.br` (obrigatório para SSL)
- `OPENID_CLIENT_ID=workadventure-production`
- `OPENID_CLIENT_SECRET=<secret gerado>`
- `SECRET_KEY=<secret gerado>`
- `POSTGRES_PASSWORD=<senha forte para banco de dados>`

### 4. Gerar Chaves RSA para JWT

```bash
mkdir -p workadventure-auth/backend/keys
cd workadventure-auth/backend/keys

# Gerar chave privada
openssl genrsa -out private.key 2048

# Gerar chave pública
openssl rsa -in private.key -pubout -out public.key

# Voltar ao diretório raiz
cd ../../../
```

### 5. Configurar Permissões

```bash
# Proteger o arquivo .env.production
chmod 600 .env.production

# Proteger as chaves RSA
chmod 600 workadventure-auth/backend/keys/private.key
chmod 644 workadventure-auth/backend/keys/public.key
```

---

## 🚀 Iniciar Aplicação

### Método 1: Usando Script (Recomendado)

```bash
./start-prod.sh
```

O script irá:
- Verificar se `.env.production` existe
- Verificar se as chaves RSA existem
- Validar se `ACME_EMAIL` está configurado
- Alertar sobre valores `CHANGE_ME` não substituídos
- Iniciar todos os containers em modo produção

### Método 2: Manualmente

```bash
# Exportar variáveis de ambiente
export $(grep -v '^#' .env.production | xargs)

# Iniciar com docker-compose
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml up -d --build
```

---

## 📊 Monitoramento e Logs

### Ver logs de todos os serviços

```bash
./logs-prod.sh
```

### Ver logs de um serviço específico

```bash
./logs-prod.sh play           # Frontend
./logs-prod.sh auth-backend   # Autenticação
./logs-prod.sh back           # Backend
./logs-prod.sh reverse-proxy  # Traefik
```

### Verificar status dos containers

```bash
docker ps
```

### Verificar uso de recursos

```bash
docker stats
```

---

## 🔒 Certificados SSL/TLS

O Traefik está configurado para obter certificados SSL automaticamente via **Let's Encrypt**.

### Processo automático

1. Quando você acessa `https://play.work.codeforgeit.com.br` pela primeira vez
2. Traefik detecta a requisição HTTPS
3. Inicia o desafio TLS do Let's Encrypt
4. Obtém e instala o certificado automaticamente
5. Renova automaticamente antes de expirar

### Verificar certificados

Os certificados são armazenados em:
```bash
docker volume inspect workcodeforge-autenticacao_letsencrypt
```

### Troubleshooting SSL

Se o SSL não funcionar:

1. Verificar DNS: `nslookup play.work.codeforgeit.com.br`
2. Verificar firewall: `sudo ufw status`
3. Verificar logs do Traefik: `./logs-prod.sh reverse-proxy`
4. Testar HTTP primeiro: `http://play.work.codeforgeit.com.br`

---

## 🛠️ Manutenção

### Atualizar aplicação

```bash
# Parar containers
./stop-prod.sh

# Atualizar código
git pull origin main

# Rebuild e restart
./start-prod.sh
```

### Backup do banco de dados

```bash
# Backup do PostgreSQL de autenticação
docker exec -t workcodeforge-autenticacao-auth-postgres-1 \
  pg_dump -U auth_user workadventure_auth > backup_$(date +%Y%m%d).sql

# Backup do Redis
docker exec workcodeforge-autenticacao-redis-1 redis-cli save
docker cp workcodeforge-autenticacao-redis-1:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

### Restaurar backup

```bash
# Restaurar PostgreSQL
cat backup_20251011.sql | docker exec -i workcodeforge-autenticacao-auth-postgres-1 \
  psql -U auth_user workadventure_auth

# Restaurar Redis
docker cp redis_backup_20251011.rdb workcodeforge-autenticacao-redis-1:/data/dump.rdb
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml restart redis
```

### Limpar recursos não utilizados

```bash
# Remover imagens antigas
docker image prune -a

# Remover volumes órfãos
docker volume prune

# Limpar tudo (CUIDADO!)
docker system prune -a --volumes
```

---

## 🔄 Rollback para Versão Anterior

```bash
# Parar aplicação
./stop-prod.sh

# Voltar para commit anterior
git log --oneline  # Ver histórico
git checkout <commit-hash>

# Reiniciar
./start-prod.sh
```

---

## 🌐 URLs da Aplicação

Após deployment bem-sucedido, sua aplicação estará disponível em:

- **Frontend Principal**: https://play.work.codeforgeit.com.br
- **Autenticação**: https://auth.work.codeforgeit.com.br
- **API Backend**: https://api.work.codeforgeit.com.br
- **Mapas**: https://maps.work.codeforgeit.com.br
- **Map Storage**: https://map-storage.work.codeforgeit.com.br
- **Uploader**: https://uploader.work.codeforgeit.com.br

---

## 🐛 Troubleshooting

### Containers não iniciam

```bash
# Ver logs de erro
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs

# Verificar status
docker ps -a
```

### Erro de conexão com banco de dados

```bash
# Verificar se o PostgreSQL está saudável
docker ps --filter name=auth-postgres

# Testar conexão
docker exec -it workcodeforge-autenticacao-auth-postgres-1 \
  psql -U auth_user -d workadventure_auth
```

### Erro 502 Bad Gateway

- Verificar se todos os containers estão rodando: `docker ps`
- Ver logs do serviço problemático
- Verificar se as portas não estão em conflito

### SSL não funciona

- Aguardar alguns minutos (Let's Encrypt pode demorar)
- Verificar logs do Traefik: `./logs-prod.sh reverse-proxy`
- Garantir que `ACME_EMAIL` está configurado corretamente
- Verificar se DNS está propagado: `dig play.work.codeforgeit.com.br`

---

## 📚 Recursos Adicionais

- [Documentação WorkAdventure](https://workadventu.re/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 🔐 Checklist de Segurança

- [ ] Firewall configurado (apenas portas 80/443 abertas)
- [ ] Arquivo `.env.production` com permissões 600
- [ ] Todos os secrets `CHANGE_ME` foram substituídos
- [ ] Chaves RSA geradas e protegidas
- [ ] Backup automático configurado
- [ ] Monitoramento de logs implementado
- [ ] SSL/TLS funcionando (HTTPS)
- [ ] Senha forte para PostgreSQL
- [ ] PgAdmin desabilitado em produção
- [ ] RedisInsight desabilitado (ou protegido com autenticação)

---

## 📞 Suporte

Para problemas ou dúvidas:
- Abrir issue no GitHub: [repositório do projeto]
- Consultar logs: `./logs-prod.sh`
- Documentação completa: `CLAUDE.md`

---

**Última atualização**: 2025-10-11
**Versão**: 1.0.0
