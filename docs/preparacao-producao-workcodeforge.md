# Preparação para Produção - WorkCodeForge

**Data**: 2025-01-17
**Tarefa**: Preparar ambiente para deploy em produção com subdomínios workcodeforge.com.br
**Status**: ✅ Concluído

---

## Objetivo

Preparar a infraestrutura e configuração do WorkCodeForge para deploy em produção, mantendo a capacidade de desenvolvimento local, utilizando subdomínios de `workcodeforge.com.br`.

---

## Requisitos do Usuário

1. **Infraestrutura**: VPS/servidor próprio com Docker
2. **SSL/HTTPS**: Let's Encrypt automático via Traefik
3. **Banco de Dados**: PostgreSQL containerizado (mesmo Docker Compose)
4. **Domínios**: Subdomínios de `workcodeforge.com.br`:
   - `play.workcodeforge.com.br` - Frontend principal
   - `auth.workcodeforge.com.br` - Autenticação
   - `maps.workcodeforge.com.br` - Mapas estáticos
   - `map-storage.workcodeforge.com.br` - Editor de mapas
   - `uploader.workcodeforge.com.br` - Upload de arquivos
   - `api.workcodeforge.com.br` - Backend gRPC/HTTP

---

## Trabalho Realizado

### 1. Criado PRODUCTION_ROADMAP.md

**Arquivo**: `/PRODUCTION_ROADMAP.md`

Documento completo com:
- ✅ Visão geral da arquitetura de produção
- ✅ Lista de domínios e configuração DNS necessária
- ✅ Checklist de preparação pré-deploy (infraestrutura, arquivos, segurança, testes)
- ✅ Passo a passo detalhado para:
  - Preparar servidor VPS (Docker, firewall, etc)
  - Gerar secrets de produção
  - Configurar variáveis de ambiente
  - Gerar chaves RSA para JWT
  - Deploy completo
- ✅ Checklist de pós-deploy e validações
- ✅ Tabela comparativa: Desenvolvimento vs Produção
- ✅ Seção de Troubleshooting completa com problemas comuns e soluções
- ✅ Procedimentos de Rollback (código, database, certificados SSL)
- ✅ Comandos úteis para gerenciamento, monitoramento e backup
- ✅ Próximos passos (backups automatizados, monitoramento, CI/CD)

**Total**: 600+ linhas de documentação detalhada

---

### 2. Atualizado .env.production

**Arquivo**: `/.env.production`

Mudanças realizadas:

#### Domínios Atualizados
- ❌ Antes: `work.codeforgeit.com.br`
- ✅ Depois: `workcodeforge.com.br`

Variáveis atualizadas:
```env
# Domínio base
DOMAIN=workcodeforge.com.br  # era: work.codeforgeit.com.br

# URLs principais
PLAY_URL=https://play.workcodeforge.com.br
FRONT_URL=https://play.workcodeforge.com.br
PUSHER_URL=https://play.workcodeforge.com.br

# OpenID Connect
OPENID_CLIENT_ISSUER=https://auth.workcodeforge.com.br
OPENID_LOGOUT_REDIRECT_URL=https://play.workcodeforge.com.br

# Map URLs
START_ROOM_URL=/_/global/maps.workcodeforge.com.br/starter/map.json
LOBBY_MAP_URL=/_/global/maps.workcodeforge.com.br/starter/chatzone.json
MAIN_MAP_URL=/_/global/maps.workcodeforge.com.br/starter/map.json

# LiveKit
LIVEKIT_HOST=https://livekit.workcodeforge.com.br

# Let's Encrypt
ACME_EMAIL=seu-email@workcodeforge.com.br
```

#### Variáveis Adicionadas

```env
# PostgreSQL (estava faltando!)
POSTGRES_PASSWORD=CHANGE_ME_GENERATE_STRONG_DB_PASSWORD_FOR_PRODUCTION

# Node Environment
NODE_ENV=production

# URLs principais (estavam faltando)
PLAY_URL=https://play.workcodeforge.com.br
FRONT_URL=https://play.workcodeforge.com.br
PUSHER_URL=https://play.workcodeforge.com.br
```

#### Instruções Atualizadas

Adicionada seção completa de instruções para geração de secrets:
- Lista de todos os 8 secrets necessários
- Comandos para gerar (openssl/node)
- Referência ao script automatizado

---

### 3. Criado Script de Geração de Secrets

**Arquivo**: `/scripts/generate-secrets.sh`

Script Bash completo que:
- ✅ Gera 8 secrets fortes usando `openssl rand -base64 32`
- ✅ Exibe secrets gerados com cores e formatação clara
- ✅ Salva secrets em arquivo temporário com timestamp
- ✅ Opção `--auto-update` para atualizar .env.production automaticamente
- ✅ Cria backup de .env.production antes de atualizar
- ✅ Substitui todos os valores `CHANGE_ME` pelos secrets gerados
- ✅ Valida se ainda há valores não configurados após atualização
- ✅ Exibe instruções de próximos passos

**Secrets gerados:**
1. `OPENID_CLIENT_SECRET` - OAuth client secret
2. `SECRET_KEY` - JWT secret key principal
3. `POSTGRES_PASSWORD` - Senha PostgreSQL
4. `ROOM_API_SECRET_KEY` - API key para Room API
5. `ADMIN_API_TOKEN` - Token de admin
6. `PROMETHEUS_AUTHORIZATION_TOKEN` - Token Prometheus
7. `LIVEKIT_API_KEY` - LiveKit API key (20 chars)
8. `LIVEKIT_API_SECRET` - LiveKit secret

**Uso:**
```bash
# Gerar e exibir secrets
bash scripts/generate-secrets.sh

# Gerar e atualizar .env.production automaticamente
bash scripts/generate-secrets.sh --auto-update
```

**Segurança:**
- Cria backup automático (.env.production.backup-TIMESTAMP)
- Salva secrets em arquivo temporário fora do projeto
- Alerta para apagar arquivo temporário após uso
- Usa delimitador @ no sed para evitar conflitos com caracteres especiais

---

### 4. Validado docker-compose.prod.yml

**Arquivo**: `/docker-compose.prod.yml`

**Status**: ✅ Já estava correto

O arquivo já usa variáveis `${DOMAIN}` em todas as configurações, portanto com o `.env.production` atualizado, todos os serviços usarão automaticamente `workcodeforge.com.br`:

```yaml
# Exemplos de uso correto:
ISSUER_URL: https://auth.${DOMAIN}
FRONTEND_URL: https://auth.${DOMAIN}
ALLOWED_REDIRECT_URIS: https://play.${DOMAIN}/login-callback,...
CORS_ORIGIN: https://play.${DOMAIN}
PUBLIC_MAP_STORAGE_URL: https://map-storage.${DOMAIN}
```

**Nenhuma alteração necessária** - o design com variáveis estava correto desde o início.

---

## Arquivos Criados/Modificados

### Novos Arquivos

1. ✨ `/PRODUCTION_ROADMAP.md` (600+ linhas)
2. ✨ `/scripts/generate-secrets.sh` (executável, 180+ linhas)
3. ✨ `/docs/preparacao-producao-workcodeforge.md` (este arquivo)

### Arquivos Modificados

1. 📝 `/.env.production`:
   - Domínios atualizados (codeforgeit → workcodeforge)
   - Variável `POSTGRES_PASSWORD` adicionada
   - Variáveis `NODE_ENV`, `PLAY_URL`, `FRONT_URL`, `PUSHER_URL` adicionadas
   - Instruções de geração de secrets expandidas

### Arquivos Validados (sem mudanças)

1. ✅ `/docker-compose.prod.yml` - Já usa ${DOMAIN} corretamente

---

## Estrutura Final de Deploy

### Desenvolvimento

```bash
docker-compose \
  -f docker-compose.yaml \
  -f docker-compose.override.yml \
  --env-file .env.development \
  up
```

**Características:**
- Domínios: `*.workadventure.localhost`
- Protocolo: HTTP
- Hot-reload: ✅ Ativo
- Volumes: Montados
- Secrets: Fracos (dev)
- Services Debug: pgAdmin, RedisInsight

### Produção

```bash
docker compose \
  -f docker-compose.yaml \
  -f docker-compose.prod.yml \
  --env-file .env.production \
  up -d
```

**Características:**
- Domínios: `*.workcodeforge.com.br`
- Protocolo: HTTPS (Let's Encrypt)
- Hot-reload: ❌ Desabilitado
- Volumes: Removidos (builds otimizados)
- Secrets: Fortes (gerados)
- Services Debug: Desabilitados
- Restart: `always`

---

## Checklist de Deploy (Resumido)

### Antes do Deploy

- [ ] DNS configurado (todos os subdomínios → IP do VPS)
- [ ] Firewall configurado (portas 80, 443, 22)
- [ ] Secrets gerados: `bash scripts/generate-secrets.sh --auto-update`
- [ ] Email configurado: `ACME_EMAIL` no .env.production
- [ ] Chaves RSA geradas: `workadventure-auth/backend/keys/`
- [ ] .env.production copiado para VPS (SCP)

### Deploy

```bash
# No servidor VPS
docker compose -f docker-compose.yaml -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.yaml -f docker-compose.prod.yml --env-file .env.production up -d
```

### Pós-Deploy

- [ ] Verificar certificados SSL (Let's Encrypt)
- [ ] Testar HTTPS: `https://play.workcodeforge.com.br`
- [ ] Testar autenticação
- [ ] Verificar logs: `docker compose logs -f`
- [ ] Criar backup inicial

---

## Observações Importantes

### 1. Auth Frontend - Vite Dev Server

⚠️ **Problema identificado**: O `auth-frontend` está usando Vite dev server em produção (porta 5173).

**Solução futura**: Criar `Dockerfile.prod` com build Nginx otimizado.

**Status**: Documentado no PRODUCTION_ROADMAP.md, seção "Problemas Identificados" #1.

### 2. Extra Hosts Hardcoded

⚠️ **Observação**: O docker-compose.prod.yml usa `extra_hosts` com IP `172.17.0.1`.

```yaml
extra_hosts:
  - "auth.${DOMAIN}:172.17.0.1"
```

**Motivo**: Para o container `play` resolver `auth.workcodeforge.com.br` internamente.

**Status**: Funciona, mas pode causar problemas em redes Docker customizadas. Melhor usar DNS interno do Docker.

### 3. Segurança - .gitignore

✅ **Validado**: `.env.production` já está no `.gitignore`
✅ **Validado**: `workadventure-auth/backend/keys/` já está no `.gitignore`

**Importante**: NUNCA commitar secrets no git!

---

## Próximos Passos (Pós-Deploy)

1. **Curto prazo** (após primeiro deploy):
   - Configurar backups automatizados (PostgreSQL, volumes, certificados SSL)
   - Monitoramento básico (uptime, logs de erro)
   - Testar todos os fluxos de usuário

2. **Médio prazo**:
   - Criar Dockerfile.prod para auth-frontend (Nginx)
   - Implementar monitoramento avançado (Prometheus + Grafana)
   - Configurar CI/CD (GitHub Actions)
   - Ambiente de staging

3. **Longo prazo**:
   - CDN para assets estáticos
   - Otimização de performance
   - Alta disponibilidade (load balancer, múltiplos nós)
   - Disaster recovery plan

---

## Comandos Úteis

### Gerenciamento

```bash
# Ver status
docker compose ps

# Logs em tempo real
docker compose logs -f

# Reiniciar serviço específico
docker compose restart auth-backend

# Parar tudo
docker compose down

# Rebuild e restart
docker compose build auth-backend
docker compose up -d auth-backend
```

### Monitoramento

```bash
# Uso de recursos
docker stats

# Espaço em disco
docker system df

# Verificar certificados SSL
docker compose exec reverse-proxy ls -la /letsencrypt/acme.json
```

### Backup

```bash
# Backup PostgreSQL
docker compose exec auth-postgres pg_dump -U auth_user workadventure_auth | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup volumes
docker run --rm -v workcodeforge_auth-postgres-data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres-data.tar.gz /data
```

---

## Referências

- **PRODUCTION_ROADMAP.md** - Documentação completa de deploy
- **DOCUMENTACAO_AUTENTICACAO.md** - Sistema de autenticação customizado
- **CLAUDE.md** - Guia do projeto para desenvolvimento
- **.env.production** - Variáveis de ambiente de produção (NÃO commitado)
- **scripts/generate-secrets.sh** - Script de geração de secrets

---

## Conclusão

✅ **Preparação para produção concluída com sucesso!**

O projeto está pronto para deploy em produção com:
- Documentação completa e detalhada
- Configuração de ambiente atualizada para `workcodeforge.com.br`
- Script automatizado para geração de secrets
- Procedimentos de deploy, validação e troubleshooting
- Comandos úteis para operação e manutenção

**Próximo passo**: Executar o checklist de deploy no PRODUCTION_ROADMAP.md e fazer o primeiro deploy em produção.

---

**Documentado por**: Claude Code
**Data**: 2025-01-17
