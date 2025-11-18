# 🚀 Roadmap de Preparação para Produção - WorkCodeForge

Este documento descreve o processo completo para preparar e fazer deploy do WorkCodeForge em produção.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Produção](#arquitetura-de-produção)
3. [Domínios de Produção](#domínios-de-produção)
4. [Checklist de Preparação](#checklist-de-preparação)
5. [Configuração Passo a Passo](#configuração-passo-a-passo)
6. [Deploy](#deploy)
7. [Pós-Deploy](#pós-deploy)
8. [Diferenças Dev vs Produção](#diferenças-dev-vs-produção)
9. [Troubleshooting](#troubleshooting)
10. [Rollback](#rollback)

---

## 🎯 Visão Geral

### Infraestrutura
- **Ambiente**: VPS/Servidor dedicado com Docker
- **Proxy Reverso**: Traefik v2.10 com SSL automático
- **SSL/HTTPS**: Let's Encrypt (renovação automática)
- **Banco de Dados**: PostgreSQL 15 (containerizado)
- **Cache/State**: Redis 7 (persistente)
- **Orquestração**: Docker Compose

### Serviços Principais
- **Play** - Frontend (Phaser + Svelte) + Pusher (WebSocket server)
- **Back** - Backend gRPC (gerenciamento de salas e estado)
- **Auth** - Sistema de autenticação customizado (NestJS + Svelte)
- **Map Storage** - Editor e armazenamento de mapas
- **Maps** - Servidor de mapas estáticos
- **Uploader** - Serviço de upload de arquivos

---

## 🏗️ Arquitetura de Produção

```
Internet
    ↓
[Traefik] (Let's Encrypt SSL)
    ↓
    ├─→ play.workcodeforge.com.br → [Play Container] (Frontend + Pusher)
    ├─→ auth.workcodeforge.com.br → [Auth Backend + Frontend]
    ├─→ api.workcodeforge.com.br → [Back Container] (gRPC/HTTP)
    ├─→ maps.workcodeforge.com.br → [Maps Container]
    ├─→ map-storage.workcodeforge.com.br → [Map Storage Container]
    └─→ uploader.workcodeforge.com.br → [Uploader Container]

Internal Network:
    ├─→ [Redis] (cache/state)
    ├─→ [PostgreSQL] (auth database)
    └─→ [Matrix Synapse] (chat - opcional)
```

---

## 🌐 Domínios de Produção

Todos os subdomínios devem apontar para o IP do seu VPS:

| Subdomínio | Serviço | Descrição | Obrigatório |
|------------|---------|-----------|-------------|
| `play.workcodeforge.com.br` | Play (Frontend) | Aplicação principal do usuário | ✅ Sim |
| `auth.workcodeforge.com.br` | Auth (Backend + Frontend) | Login e autenticação OAuth | ✅ Sim |
| `api.workcodeforge.com.br` | Back (gRPC/HTTP) | API backend para salas e estado | ✅ Sim |
| `maps.workcodeforge.com.br` | Maps | Servidor de mapas estáticos | ✅ Sim |
| `map-storage.workcodeforge.com.br` | Map Storage | Editor e API de mapas | ✅ Sim |
| `uploader.workcodeforge.com.br` | Uploader | Upload de arquivos (avatares, chat) | ✅ Sim |
| `icon.workcodeforge.com.br` | Icon | Gerador de ícones/avatares | ⚠️ Opcional |
| `matrix.workcodeforge.com.br` | Synapse (Matrix) | Servidor de chat | ⚠️ Opcional |

### Configuração DNS

Adicione registros DNS tipo **A** para cada subdomínio:

```
Tipo  | Nome          | Valor          | TTL
------|---------------|----------------|------
A     | play          | <IP_DO_VPS>    | 3600
A     | auth          | <IP_DO_VPS>    | 3600
A     | api           | <IP_DO_VPS>    | 3600
A     | maps          | <IP_DO_VPS>    | 3600
A     | map-storage   | <IP_DO_VPS>    | 3600
A     | uploader      | <IP_DO_VPS>    | 3600
A     | icon          | <IP_DO_VPS>    | 3600
A     | matrix        | <IP_DO_VPS>    | 3600
```

**Verificação:**
```bash
# Verificar se DNS está propagado
dig play.workcodeforge.com.br +short
nslookup auth.workcodeforge.com.br
```

---

## ✅ Checklist de Preparação

### 1️⃣ Infraestrutura

- [ ] **VPS provisionado** (mínimo: 4GB RAM, 2 vCPUs, 50GB disco)
- [ ] **Docker instalado** (v24+)
- [ ] **Docker Compose instalado** (v2.20+)
- [ ] **Firewall configurado**:
  - Porta 80 (HTTP) - aberta
  - Porta 443 (HTTPS) - aberta
  - Porta 22 (SSH) - aberta (restrita ao seu IP se possível)
  - Todas as outras portas - fechadas
- [ ] **DNS configurado** (todos os subdomínios apontando para o VPS)
- [ ] **Acesso SSH** ao servidor

### 2️⃣ Arquivos e Configuração

- [ ] **Chaves RSA geradas** (`workadventure-auth/backend/keys/`)
  ```bash
  cd workadventure-auth/backend
  mkdir -p keys
  openssl genrsa -out keys/private.key 2048
  openssl rsa -in keys/private.key -pubout -out keys/public.key
  chmod 600 keys/private.key
  chmod 644 keys/public.key
  ```

- [ ] **Secrets gerados** (use `scripts/generate-secrets.sh`)
- [ ] **`.env.production` configurado** (todos os `CHANGE_ME` substituídos)
- [ ] **Email configurado** para Let's Encrypt (`ACME_EMAIL`)
- [ ] **Dockerfile.prod criado** para auth-frontend (se ainda não existir)

### 3️⃣ Segurança

- [ ] **`.env.production` NÃO está no git** (verificar `.gitignore`)
- [ ] **Chaves RSA NÃO estão no git** (`keys/` no `.gitignore`)
- [ ] **Secrets fortes gerados** (mínimo 32 caracteres aleatórios)
- [ ] **PostgreSQL com senha forte**
- [ ] **Firewall ativo** no VPS (`ufw` ou `iptables`)

### 4️⃣ Testes Pré-Deploy

- [ ] **Build local testado**:
  ```bash
  docker-compose -f docker-compose.yaml -f docker-compose.prod.yml --env-file .env.production build
  ```
- [ ] **Verificar logs de build** (sem erros críticos)
- [ ] **Validar variáveis de ambiente** (script de validação)

---

## ⚙️ Configuração Passo a Passo

### Passo 1: Preparar Servidor VPS

```bash
# 1. Conectar ao servidor
ssh user@<IP_DO_VPS>

# 2. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 3. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 4. Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# 5. Configurar firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status

# 6. Relogar para aplicar grupo docker
exit
ssh user@<IP_DO_VPS>

# 7. Verificar instalação
docker --version
docker compose version
```

### Passo 2: Gerar Secrets

```bash
# No seu computador local (não no servidor)
cd /path/to/workcodeforge-autenticacao

# Executar script de geração de secrets
bash scripts/generate-secrets.sh

# Ou gerar manualmente:
openssl rand -base64 32  # Para cada secret
```

**Secrets necessários:**
1. `OPENID_CLIENT_SECRET`
2. `SECRET_KEY`
3. `ROOM_API_SECRET_KEY`
4. `ADMIN_API_TOKEN`
5. `PROMETHEUS_AUTHORIZATION_TOKEN`
6. `LIVEKIT_API_KEY`
7. `LIVEKIT_API_SECRET`
8. `POSTGRES_PASSWORD`

### Passo 3: Configurar `.env.production`

Edite `.env.production` e substitua **TODOS** os `CHANGE_ME`:

```bash
# Copiar template (se ainda não tiver)
cp .env.template .env.production

# Editar com seus valores
nano .env.production
```

**Variáveis críticas:**

```env
# Domínio base
DOMAIN=workcodeforge.com.br

# URLs principais (HTTPS!)
PLAY_URL=https://play.workcodeforge.com.br
FRONT_URL=https://play.workcodeforge.com.br
PUSHER_URL=https://play.workcodeforge.com.br

# Let's Encrypt
ACME_EMAIL=seu-email@workcodeforge.com.br

# Ambiente
NODE_ENV=production
DEBUG_MODE=false

# OpenID Connect (deve bater com auth-backend)
OPENID_CLIENT_ID=workadventure-production
OPENID_CLIENT_SECRET=<SECRET_GERADO>
OPENID_CLIENT_ISSUER=https://auth.workcodeforge.com.br

# Secrets
SECRET_KEY=<SECRET_GERADO>
ROOM_API_SECRET_KEY=<SECRET_GERADO>
ADMIN_API_TOKEN=<SECRET_GERADO>

# PostgreSQL
POSTGRES_PASSWORD=<SECRET_GERADO>

# LiveKit (se usar)
LIVEKIT_API_KEY=<SECRET_GERADO>
LIVEKIT_API_SECRET=<SECRET_GERADO>
LIVEKIT_HOST=https://livekit.workcodeforge.com.br
```

### Passo 4: Configurar Auth Backend

As variáveis de ambiente do auth-backend estão no `docker-compose.prod.yml`. Certifique-se de que os valores batem com `.env.production`:

```yaml
# Em docker-compose.prod.yml
auth-backend:
  environment:
    - ISSUER_URL=https://auth.workcodeforge.com.br
    - FRONTEND_URL=https://auth.workcodeforge.com.br
    - WORKADVENTURE_CLIENT_ID=workadventure-production
    - WORKADVENTURE_CLIENT_SECRET=${OPENID_CLIENT_SECRET}
    - ALLOWED_REDIRECT_URIS=https://play.workcodeforge.com.br/login-callback,https://play.workcodeforge.com.br/register-callback
    - CORS_ORIGIN=https://play.workcodeforge.com.br
    - DEFAULT_LOGOUT_REDIRECT=https://play.workcodeforge.com.br
    - DATABASE_PASSWORD=${POSTGRES_PASSWORD}
```

### Passo 5: Gerar Chaves RSA (se ainda não tiver)

```bash
cd workadventure-auth/backend
mkdir -p keys

# Gerar chave privada (2048 bits)
openssl genrsa -out keys/private.key 2048

# Gerar chave pública
openssl rsa -in keys/private.key -pubout -out keys/public.key

# Permissões corretas
chmod 600 keys/private.key
chmod 644 keys/public.key

# Verificar
ls -la keys/
```

**⚠️ IMPORTANTE**: Essas chaves assinam os tokens JWT. Se perder, todos os usuários precisarão fazer login novamente.

---

## 🚀 Deploy

### Passo 1: Enviar Arquivos para o Servidor

```bash
# Do seu computador local
cd /path/to/workcodeforge-autenticacao

# Criar tarball (excluindo node_modules, .git, etc)
tar -czf workcodeforge.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='*.log' \
  .

# Enviar para servidor
scp workcodeforge.tar.gz user@<IP_DO_VPS>:~/

# Enviar .env.production separadamente (seguro)
scp .env.production user@<IP_DO_VPS>:~/

# Conectar ao servidor
ssh user@<IP_DO_VPS>

# Extrair
mkdir -p ~/workcodeforge
tar -xzf workcodeforge.tar.gz -C ~/workcodeforge
mv .env.production ~/workcodeforge/

# Entrar no diretório
cd ~/workcodeforge
```

### Passo 2: Build das Imagens

```bash
# Build de todas as imagens
docker compose -f docker-compose.yaml -f docker-compose.prod.yml --env-file .env.production build

# Verificar imagens criadas
docker images | grep workcodeforge
```

### Passo 3: Iniciar Serviços

```bash
# Iniciar em modo daemon (-d)
docker compose -f docker-compose.yaml -f docker-compose.prod.yml --env-file .env.production up -d

# Verificar containers rodando
docker compose ps

# Verificar logs
docker compose logs -f reverse-proxy
docker compose logs -f auth-backend
docker compose logs -f play
docker compose logs -f back
```

### Passo 4: Aguardar Let's Encrypt

O Traefik vai solicitar certificados SSL automaticamente. Isso pode levar 1-2 minutos:

```bash
# Monitorar logs do Traefik
docker compose logs -f reverse-proxy | grep -i "certificate"

# Você deve ver mensagens como:
# "Trying to challenge from https://acme-v02.api.letsencrypt.org/acme/chall-v3/..."
# "The key [play.workcodeforge.com.br] was successfully obtained."
```

### Passo 5: Verificar Certificados

```bash
# Listar certificados obtidos
docker compose exec reverse-proxy ls -la /letsencrypt/acme.json

# Verificar online
curl -I https://play.workcodeforge.com.br
```

---

## 🔍 Pós-Deploy

### Verificações Essenciais

#### 1. Testar HTTPS e Certificados

```bash
# Deve retornar certificado válido
curl -I https://play.workcodeforge.com.br

# Deve redirecionar para HTTPS
curl -I http://play.workcodeforge.com.br

# Verificar certificado
openssl s_client -connect play.workcodeforge.com.br:443 -servername play.workcodeforge.com.br < /dev/null
```

#### 2. Testar Autenticação

1. Acessar `https://play.workcodeforge.com.br`
2. Deve redirecionar para `https://auth.workcodeforge.com.br/login`
3. Fazer login com usuário de teste:
   - Email: `admin@example.com`
   - Password: `pwd`
4. Após login, deve voltar para `https://play.workcodeforge.com.br` autenticado

#### 3. Verificar OAuth Flow

```bash
# Ver logs de autenticação
docker compose logs -f auth-backend | grep -i "token"
docker compose logs -f play | grep -i "openid"

# Deve ver:
# - Authorization code gerado
# - Token exchange bem-sucedido
# - ID token validado
```

#### 4. Testar Criação de Mapas

1. Acessar `https://map-storage.workcodeforge.com.br`
2. Fazer login
3. Criar mapa de teste
4. Salvar e verificar se persiste

#### 5. Monitorar Recursos

```bash
# Uso de CPU/Memória por container
docker stats

# Espaço em disco
df -h
docker system df

# Logs de erros
docker compose logs --tail=50 | grep -i error
docker compose logs --tail=50 | grep -i warning
```

### Configurar Monitoramento (Opcional)

```bash
# Instalar ctop (monitoring UI)
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop

# Usar
ctop
```

### Backup Inicial

```bash
# Backup do PostgreSQL
docker compose exec auth-postgres pg_dump -U auth_user workadventure_auth > backup_inicial.sql

# Backup de volumes
docker run --rm -v workcodeforge_auth-postgres-data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres-data.tar.gz /data

# Backup de certificados Let's Encrypt
docker run --rm -v workcodeforge_letsencrypt:/data -v $(pwd):/backup ubuntu tar czf /backup/letsencrypt.tar.gz /data
```

---

## 📊 Diferenças Dev vs Produção

| Aspecto | Desenvolvimento | Produção |
|---------|-----------------|----------|
| **Domínio** | `*.workadventure.localhost` | `*.workcodeforge.com.br` |
| **Protocolo** | HTTP | HTTPS (Let's Encrypt) |
| **NODE_ENV** | `development` | `production` |
| **DEBUG_MODE** | `true` | `false` |
| **Volumes** | Montados (hot-reload) | Removidos (builds otimizados) |
| **Restart Policy** | `no` | `always` |
| **Auth Frontend** | Vite dev server | Nginx (build estático) |
| **Secrets** | Fracos (`my-super-secret-key-for-local-dev`) | Fortes (32+ chars aleatórios) |
| **PostgreSQL Port** | 5433 (exposto) | 5432 (interno apenas) |
| **Services Debug** | pgAdmin, RedisInsight | Desabilitados |
| **Logs** | Verbosos | Essenciais apenas |
| **Build Mode** | Dev (source maps) | Produção (minificado) |

### Comandos de Deploy

```bash
# DESENVOLVIMENTO
docker-compose -f docker-compose.yaml -f docker-compose.override.yml --env-file .env.development up

# PRODUÇÃO
docker compose -f docker-compose.yaml -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## 🔧 Troubleshooting

### Problema: Certificado SSL não gerado

**Sintomas:**
- Erro de certificado ao acessar HTTPS
- Logs do Traefik com erros ACME

**Soluções:**

```bash
# 1. Verificar DNS está propagado
dig play.workcodeforge.com.br +short

# 2. Verificar portas 80 e 443 abertas
sudo netstat -tlnp | grep -E ':(80|443)'

# 3. Verificar logs do Traefik
docker compose logs reverse-proxy | grep -i acme

# 4. Forçar renovação (se necessário)
docker compose exec reverse-proxy rm /letsencrypt/acme.json
docker compose restart reverse-proxy

# 5. Verificar email ACME configurado
grep ACME_EMAIL .env.production
```

### Problema: Autenticação falha

**Sintomas:**
- Redirect loop
- Erro "invalid_client"
- CORS errors

**Soluções:**

```bash
# 1. Verificar CLIENT_ID e CLIENT_SECRET batem
grep OPENID_CLIENT .env.production
docker compose exec auth-backend env | grep WORKADVENTURE_CLIENT

# 2. Verificar ALLOWED_REDIRECT_URIS
docker compose exec auth-backend env | grep ALLOWED_REDIRECT_URIS

# 3. Verificar CORS_ORIGIN
docker compose exec auth-backend env | grep CORS_ORIGIN

# 4. Ver logs de autenticação
docker compose logs -f auth-backend
docker compose logs -f play | grep -i openid

# 5. Testar discovery endpoint
curl https://auth.workcodeforge.com.br/.well-known/openid-configuration
```

### Problema: Container não inicia

**Sintomas:**
- Container com status "Restarting" ou "Exited"
- `docker compose ps` mostra container parado

**Soluções:**

```bash
# 1. Ver logs detalhados
docker compose logs <service-name>

# 2. Verificar último erro
docker compose ps
docker compose logs --tail=100 <service-name> | grep -i error

# 3. Verificar variáveis de ambiente
docker compose exec <service-name> env

# 4. Verificar healthcheck
docker inspect <container-id> | jq '.[0].State.Health'

# 5. Reiniciar serviço específico
docker compose restart <service-name>

# 6. Rebuild se necessário
docker compose build --no-cache <service-name>
docker compose up -d <service-name>
```

### Problema: Out of Memory

**Sintomas:**
- Container morto repentinamente
- Logs: "Killed" ou "OOM"

**Soluções:**

```bash
# 1. Verificar uso de memória
docker stats

# 2. Verificar memória do servidor
free -h

# 3. Adicionar limits no docker-compose.prod.yml
services:
  play:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

# 4. Aumentar swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 5. Limpar containers/images não usados
docker system prune -a
```

### Problema: Espaço em disco cheio

**Sintomas:**
- Erro ao criar containers
- Logs: "no space left on device"

**Soluções:**

```bash
# 1. Verificar uso de disco
df -h
docker system df

# 2. Limpar imagens não usadas
docker image prune -a

# 3. Limpar volumes órfãos
docker volume prune

# 4. Limpar tudo (CUIDADO!)
docker system prune -a --volumes

# 5. Limpar logs antigos
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### Problema: Database migration falha

**Sintomas:**
- Auth backend não inicia
- Logs: "migration failed"

**Soluções:**

```bash
# 1. Ver logs do PostgreSQL
docker compose logs auth-postgres

# 2. Conectar ao banco
docker compose exec auth-postgres psql -U auth_user -d workadventure_auth

# 3. Verificar tabelas existentes
\dt

# 4. Recriar banco (PERDE DADOS!)
docker compose stop auth-backend
docker compose exec auth-postgres psql -U auth_user -c "DROP DATABASE workadventure_auth;"
docker compose exec auth-postgres psql -U auth_user -c "CREATE DATABASE workadventure_auth;"
docker compose up -d auth-backend

# 5. Restaurar de backup
docker compose exec -T auth-postgres psql -U auth_user workadventure_auth < backup.sql
```

---

## 🔄 Rollback

Se algo der errado, você pode fazer rollback:

### Rollback Rápido (voltar versão anterior)

```bash
# 1. Parar todos os serviços
docker compose -f docker-compose.yaml -f docker-compose.prod.yml down

# 2. Restaurar código anterior (se tiver backup)
cd ~/workcodeforge
rm -rf * .*
tar -xzf ~/workcodeforge-backup-YYYY-MM-DD.tar.gz

# 3. Restaurar .env anterior
cp ~/backups/.env.production.backup .env.production

# 4. Rebuild e restart
docker compose -f docker-compose.yaml -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.yaml -f docker-compose.prod.yml --env-file .env.production up -d
```

### Rollback de Database

```bash
# 1. Parar serviços que usam o banco
docker compose stop auth-backend auth-frontend

# 2. Restaurar backup
docker compose exec -T auth-postgres psql -U auth_user workadventure_auth < backup_YYYY-MM-DD.sql

# 3. Reiniciar serviços
docker compose start auth-backend auth-frontend
```

### Rollback de Certificados Let's Encrypt

```bash
# 1. Parar Traefik
docker compose stop reverse-proxy

# 2. Restaurar acme.json
docker run --rm -v workcodeforge_letsencrypt:/data -v $(pwd):/backup ubuntu tar xzf /backup/letsencrypt-backup.tar.gz -C /

# 3. Reiniciar Traefik
docker compose start reverse-proxy
```

---

## 📝 Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver status de todos os containers
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Ver logs de serviço específico
docker compose logs -f auth-backend

# Reiniciar serviço
docker compose restart <service-name>

# Parar todos os serviços
docker compose stop

# Iniciar todos os serviços
docker compose start

# Parar e remover containers
docker compose down

# Parar e remover TUDO (incluindo volumes - CUIDADO!)
docker compose down -v
```

### Execução de Comandos em Containers

```bash
# Shell interativo
docker compose exec auth-backend sh
docker compose exec auth-postgres bash

# Comando único
docker compose exec auth-backend npm run typeorm migration:run
docker compose exec auth-postgres psql -U auth_user workadventure_auth

# Verificar variáveis de ambiente
docker compose exec play env | grep OPENID
```

### Monitoramento

```bash
# Uso de recursos
docker stats

# Espaço em disco
docker system df

# Processos por container
docker compose top

# Inspecionar container
docker inspect <container-name-or-id>

# Healthcheck status
docker compose ps --format json | jq '.[] | {name: .Service, health: .Health}'
```

### Backup e Restore

```bash
# Backup database
docker compose exec auth-postgres pg_dump -U auth_user workadventure_auth | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore database
gunzip < backup_20240101_120000.sql.gz | docker compose exec -T auth-postgres psql -U auth_user workadventure_auth

# Backup volumes
docker run --rm -v workcodeforge_auth-postgres-data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres-$(date +%Y%m%d).tar.gz /data

# Backup tudo (exceto código)
tar czf full-backup-$(date +%Y%m%d).tar.gz .env.production workadventure-auth/backend/keys/
```

---

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. **Configurar backups automatizados**
   - Cronjob diário para backup do PostgreSQL
   - Backup semanal de volumes Docker
   - Backup de certificados SSL

2. **Monitoramento**
   - Prometheus + Grafana (opcional)
   - Uptime monitoring (UptimeRobot, etc)
   - Alertas por email/Slack

3. **Performance**
   - CDN para assets estáticos (Cloudflare)
   - Otimização de imagens
   - Cache Redis configurado

4. **Segurança**
   - Fail2ban para SSH
   - Rate limiting no Traefik
   - Atualização regular de containers

5. **CI/CD**
   - GitHub Actions para deploy automático
   - Testes automatizados
   - Deploy staging antes de produção

---

## 📚 Documentação Adicional

- [DOCUMENTACAO_AUTENTICACAO.md](./DOCUMENTACAO_AUTENTICACAO.md) - Sistema de autenticação customizado
- [ADMIN_PANEL_DEV.md](./ADMIN_PANEL_DEV.md) - Desenvolvimento do painel admin
- [CLAUDE.md](./CLAUDE.md) - Guia do projeto para desenvolvimento
- [README.md](./README.md) - Overview geral do WorkAdventure

---

## ❓ Suporte

Se encontrar problemas não documentados aqui:

1. Verificar logs: `docker compose logs -f`
2. Consultar [Troubleshooting](#troubleshooting)
3. Verificar issues do WorkAdventure original
4. Abrir issue no repositório

---

**Última atualização**: 2025-01-17
**Versão**: 1.0.0
