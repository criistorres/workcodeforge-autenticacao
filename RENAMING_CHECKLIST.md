# 🔄 Checklist: Renomear WorkAdventure → WorkCodeForge

## 📋 Arquivos para Atualizar

### 1. Variáveis de Ambiente

#### `.env` (raiz do projeto)
- [ ] `OPENID_CLIENT_ID` → `workcodeforge-local`
- [ ] Comentários que mencionam WorkAdventure

#### `workadventure-auth/backend/.env`
- [ ] `WORKADVENTURE_CLIENT_ID` → `workcodeforge-local`
- [ ] `WORKADVENTURE_CLIENT_SECRET` → (manter ou gerar novo)
- [ ] Comentários e descrições

#### `docker-compose.override.yml`
- [ ] `WORKADVENTURE_CLIENT_ID=workadventure-local` → `WORKCODEFORGE_CLIENT_ID=workcodeforge-local`
- [ ] `WORKADVENTURE_CLIENT_SECRET` → `WORKCODEFORGE_CLIENT_SECRET`
- [ ] Comentários nos serviços

---

### 2. Banco de Dados

#### PostgreSQL
- [ ] Nome do database: `workadventure_auth` → `workcodeforge_auth`
- [ ] User: `auth_user` → manter ou renomear
- [ ] Atualizar em:
  - [ ] `docker-compose.override.yml` (serviço `auth-postgres`)
  - [ ] Variáveis de ambiente

---

### 3. Backend (NestJS)

#### Código TypeScript
- [ ] `workadventure-auth/backend/src/main.ts`
  - Mensagens de log
- [ ] `workadventure-auth/backend/src/oidc/oidc.service.ts`
  - Comentários
  - Variáveis
- [ ] `workadventure-auth/backend/src/auth/auth.service.ts`
  - Logs e comentários
- [ ] `workadventure-auth/backend/package.json`
  - `name`: `@workcodeforge/auth-backend`
  - `description`

---

### 4. Frontend (Svelte)

#### Código JavaScript/Svelte
- [ ] `workadventure-auth/frontend/src/routes/Login.svelte`
  - Títulos e textos
  - Comentários
- [ ] `workadventure-auth/frontend/package.json`
  - `name`: `@workcodeforge/auth-frontend`
  - `description`
- [ ] `workadventure-auth/frontend/index.html`
  - `<title>` tag
  - Meta tags

---

### 5. Documentação

#### Arquivos Markdown
- [ ] `DOCUMENTACAO_AUTENTICACAO.md`
  - Título principal
  - Todas as referências a "WorkAdventure"
  - Exemplos de código
  - URLs
- [ ] `ADMIN_PANEL_DEV.md`
  - Visão geral (já atualizado ✅)
  - Verificar outras menções
- [ ] `README.md` (se houver seção específica de auth)
- [ ] Criar novo `README.md` em `workadventure-auth/`

---

### 6. Docker

#### Dockerfiles
- [ ] `workadventure-auth/backend/Dockerfile`
  - Labels e comentários
- [ ] `workadventure-auth/frontend/Dockerfile`
  - Labels e comentários

#### Docker Compose
- [ ] `docker-compose.override.yml`
  - Nomes de serviços (manter ou renomear?)
  - Labels Traefik
  - Comentários
- [ ] Volumes:
  - `auth-postgres-data` → `workcodeforge-auth-postgres-data`

---

### 7. URLs e Hostnames

#### Subdomínios (opcional - pode manter compatibilidade)
- [ ] `auth.workadventure.localhost` → `auth.workcodeforge.localhost`
- [ ] Se mudar, atualizar:
  - `/etc/hosts`
  - Traefik labels
  - CORS configs
  - ISSUER_URL
  - FRONTEND_URL
  - Redirect URIs

---

## 🎯 Estratégia de Renomeação

### Opção 1: Renomeação Completa
Alterar TUDO, incluindo URLs e subdomínios.

**Prós:**
- Branding completo
- Sem referências antigas

**Contras:**
- Precisa reconfigurar `/etc/hosts`
- Atualizar todas as URLs
- Regenerar tokens/secrets

### Opção 2: Renomeação Parcial (Recomendado)
Alterar apenas código, variáveis e docs. Manter URLs funcionais.

**Prós:**
- Menos breaking changes
- Auth continua funcionando
- Migração gradual

**Contras:**
- URLs ainda com "workadventure"

### Opção 3: Renomeação Progressiva
Criar aliases, manter compatibilidade.

---

## 📝 Comandos de Busca

```bash
# Encontrar todas referências a "workadventure" (case insensitive)
grep -ri "workadventure" --exclude-dir=node_modules --exclude-dir=.git .

# Apenas em arquivos específicos
grep -ri "workadventure" workadventure-auth/backend/src/

# Contar ocorrências
grep -ri "workadventure" --exclude-dir=node_modules --exclude-dir=.git . | wc -l
```

---

## ✅ Checklist de Validação

Após renomeação, verificar:

- [ ] Build do backend funciona
  ```bash
  cd workadventure-auth/backend
  npm run build
  ```

- [ ] Build do frontend funciona
  ```bash
  cd workadventure-auth/frontend
  npm run build
  ```

- [ ] Docker compose sobe sem erros
  ```bash
  docker-compose up --build
  ```

- [ ] Discovery document funciona
  ```bash
  curl http://auth.workcodeforge.localhost/.well-known/openid-configuration
  ```

- [ ] Login funciona
  ```bash
  curl -X POST http://auth.workcodeforge.localhost/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user1@example.com","password":"pwd"}'
  ```

- [ ] WorkAdventure/Play ainda consegue autenticar

---

## 🚨 Cuidados

1. **Backup antes de começar**
   ```bash
   git add .
   git commit -m "Backup antes de renomear para WorkCodeForge"
   ```

2. **Client Secret**
   - Se mudar, WorkAdventure precisa ser atualizado também

3. **Database**
   - Se renomear DB, fazer dump antes
   - Criar novo DB com nome novo
   - Restaurar dados

4. **Sessões ativas**
   - Usuários logados serão deslogados se mudar secrets/URLs

---

## 📅 Plano de Execução

### Etapa 1: Preparação
1. Commit atual
2. Criar branch `feat/rename-to-workcodeforge`
3. Fazer backup do banco (se tiver dados importantes)

### Etapa 2: Renomeação de Código
1. Variáveis de ambiente
2. Código backend
3. Código frontend
4. Documentação

### Etapa 3: Renomeação de Infra (se aplicável)
1. Database
2. URLs/hostnames
3. Docker configs

### Etapa 4: Testes
1. Build backend/frontend
2. Docker compose up
3. Testar login
4. Testar integração com Play

### Etapa 5: Commit e Merge
1. Commit changes
2. Push branch
3. Merge to main

---

**Criado em:** 2024-10-04
**Status:** Aguardando decisão sobre estratégia de renomeação
