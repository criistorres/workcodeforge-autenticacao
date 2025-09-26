# Auth Service - Sistema de Login Dinâmico

Sistema de autenticação dinâmico para WorkAdventure que substitui o servidor OIDC mock, permitindo registro e login de usuários sem configuração manual.

## 🚀 Características

- **Registro dinâmico** de usuários
- **Autenticação JWT** segura
- **Validação robusta** com Zod
- **Banco SQLite** para persistência (compatível com PostgreSQL)
- **Cache Redis** para performance (opcional)
- **Docker** para containerização
- **Compatibilidade multi-arquitetura** (x86_64, ARM64, ARMv7)
- **Testes automatizados** com Jest
- **Logs estruturados** com Winston
- **Migrações automáticas** na inicialização

## 📋 Pré-requisitos

- Node.js 18+
- SQLite 3 (incluído no sistema) ou PostgreSQL 15+
- Redis (opcional)
- Docker e Docker Compose (opcional)

## 🛠️ Instalação

### 1. Clonar e instalar dependências

```bash
cd auth-service
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp env.example .env
# Editar .env com suas configurações
```

### 3. Configurar banco de dados

```bash
# Executar script de configuração
./scripts/setup-database.sh

# Ou manualmente:
npm run db:migrate
npm run db:seed
```

### 4. Executar em desenvolvimento

```bash
npm run dev
```

## 🐳 Docker

### Desenvolvimento

```bash
# Subir o auth-service
docker-compose up -d auth-service

# Ou usar o arquivo de desenvolvimento específico
docker-compose -f docker-compose.dev.yaml up -d
```

### Produção

```bash
docker-compose up -d
```

### Compatibilidade de Arquitetura

O Dockerfile foi otimizado para funcionar em diferentes arquiteturas:

- ✅ **x86_64** (Intel/AMD)
- ✅ **ARM64** (Apple Silicon M1/M2/M3)
- ✅ **ARMv7** (Raspberry Pi)

As dependências nativas (`bcrypt`, `better-sqlite3`) são automaticamente recompiladas durante o build para garantir compatibilidade.

### Rebuild Necessário

Se você encontrar problemas de "Exec format error", reconstrua o container:

```bash
# Rebuild completo (recomendado)
docker-compose build --no-cache auth-service

# Ou rebuild apenas do auth-service
docker-compose build --no-cache auth-service && docker-compose up -d auth-service
```

## 📊 Endpoints da API

### Health Check
- `GET /health` - Status do serviço

### Informações
- `GET /api/info` - Informações da API

### Autenticação (Fase 2) ✅
- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login de usuário
- `GET /auth/profile` - Perfil do usuário
- `PUT /auth/profile` - Atualizar perfil
- `POST /auth/change-password` - Alterar senha
- `POST /auth/refresh` - Renovar access token
- `POST /auth/logout` - Logout do usuário

### OIDC (Fase 3) ✅
- `GET /.well-known/openid_configuration` - Discovery
- `GET /oauth/authorize` - Authorization
- `POST /oauth/token` - Token exchange
- `GET /oauth/userinfo` - User info
- `GET /oauth/jwks` - JWKS keys

### Interface de Usuário (Fase 5) ✅
- `GET /` - Redireciona para login
- `GET /login.html` - Tela de login
- `GET /register.html` - Tela de registro
- `GET /profile.html` - Tela de perfil
- `GET /forgot-password.html` - Recuperação de senha
- `GET /oidc-redirect.html` - Redirecionamento OIDC

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com watch
npm run test:watch

# Cobertura de código
npm run test:coverage
```

## 📝 Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Compilar TypeScript
npm run start        # Executar em produção
npm run lint         # Verificar código
npm run lint:fix     # Corrigir problemas de lint
```

### Testes
```bash
npm run test         # Executar todos os testes
npm run test:unit    # Testes unitários
npm run test:integration # Testes de integração
npm run test:e2e     # Testes end-to-end
npm run test:performance # Testes de performance
npm run test:security # Testes de segurança
npm run test:all     # Todos os tipos de teste
npm run test:ci      # Testes para CI/CD
```

### Banco de Dados
```bash
npm run db:migrate   # Executar migrações
npm run db:seed      # Executar seeds
npm run db:migrate-sqlite # Migrações SQLite
npm run db:seed-sqlite # Seeds SQLite
npm run db:setup-sqlite # Setup completo SQLite
```

### Backup e Deploy
```bash
npm run backup:create # Criar backup
npm run backup:restore # Restaurar backup
npm run backup:list   # Listar backups
npm run backup:cleanup # Limpar backups antigos
npm run backup:schedule # Backup agendado
npm run deploy       # Deploy em produção
npm run deploy:rollback # Rollback
npm run deploy:status # Status do deploy
npm run deploy:logs  # Logs do deploy
```

## 🗄️ Estrutura do Banco

### Tabela `users`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| email | VARCHAR(255) | Email único |
| username | VARCHAR(50) | Username único |
| password_hash | VARCHAR(255) | Hash da senha |
| name | VARCHAR(100) | Nome completo |
| tags | JSONB | Tags personalizadas |
| is_active | BOOLEAN | Status ativo |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |
| last_login_at | TIMESTAMP | Último login |

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Aplicação
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://play.workadventure.localhost

# Banco de Dados
DATABASE_URL=postgresql://postgres:password@localhost:5432/workcode
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workcode
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=30d

# OIDC
OIDC_ISSUER=http://auth.workadventure.localhost
OIDC_CLIENT_ID=workadventure-client
OIDC_CLIENT_SECRET=workadventure-secret
```

## 📈 Monitoramento

### Logs

Os logs são salvos em:
- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros
- `logs/exceptions.log` - Exceções não tratadas

### Health Check

```bash
curl http://localhost:3001/health
```

### Métricas

#### Resumo das Métricas (JSON)
```bash
curl http://localhost:3001/metrics/summary
```

#### Métricas Prometheus
```bash
curl http://localhost:3001/metrics
```

#### Saúde com Métricas
```bash
curl http://localhost:3001/metrics/health
```

### Métricas Disponíveis

- **Requisições**: Total, sucesso, falhas, tempo médio de resposta
- **Usuários**: Total, ativos, registrados hoje
- **Sistema**: Uso de memória, CPU, uptime
- **Banco de Dados**: Queries, tempo médio de consulta
- **Erros**: Total, por tipo

### Monitoramento em Tempo Real

O sistema coleta métricas automaticamente e as disponibiliza em:
- Formato JSON para dashboards customizados
- Formato Prometheus para ferramentas como Grafana
- Health checks para alertas automáticos

## 🔒 Segurança

- Senhas hasheadas com bcrypt (12 rounds)
- Tokens JWT com expiração
- Validação rigorosa de entrada
- Rate limiting (Fase 2)
- HTTPS obrigatório em produção

## 🔧 Troubleshooting

### Problema: "Exec format error" no Container

**Sintomas:**
- Container em loop de reinicialização
- Erro "Exec format error" nos logs
- Falha ao carregar dependências nativas (bcrypt, better-sqlite3)

**Causa:**
Incompatibilidade de arquitetura entre as dependências compiladas e o ambiente de execução (ARM64 vs x86_64).

**Solução:**
```bash
# Reconstruir o container com --no-cache
docker-compose build --no-cache auth-service

# O Dockerfile já inclui a recompilação automática:
RUN npm uninstall bcrypt better-sqlite3 && npm install bcrypt better-sqlite3
```

**Verificação:**
```bash
# Verificar se o container está funcionando
docker ps | grep auth-service

# Testar endpoints
curl http://localhost:3002/health
curl http://localhost:3002/api/info
```

### Problema: Banco de Dados Não Inicializa

**Sintomas:**
- Logs mostram "Banco de dados SQLite inicializado" mas container reinicia
- Falha na conexão com banco

**Solução:**
O sistema agora executa migrações automaticamente na inicialização. Se persistir:

```bash
# Verificar logs detalhados
docker logs workcodeforge-auth-service-dev

# Executar migrações manualmente (se necessário)
docker exec workcodeforge-auth-service-dev npm run db:migrate-sqlite
```

### Problema: "attempt to write a readonly database" (SQLITE_READONLY)

**Sintomas:**
- Erro "attempt to write a readonly database" nos logs
- Falha ao registrar novos usuários
- Container reiniciando constantemente
- Erro "nodemon: not found" no container

**Causa:**
Arquivos WAL e SHM do SQLite com proprietários diferentes ou comando incorreto no docker-compose.

**Solução:**
```bash
# Parar container
docker-compose -f docker-compose.dev.yaml down

# Remover arquivos WAL/SHM corrompidos
rm -f data/auth.db-wal data/auth.db-shm

# Reiniciar container
docker-compose -f docker-compose.dev.yaml up -d auth-service

# Verificar funcionamento
curl http://localhost:3001/health
```

**Verificação:**
```bash
# Testar registro de usuário
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","username":"teste123","password":"Teste123!","name":"Teste User"}'
```

## 🔗 Integração com WorkAdventure

### Como Usar

1. **Subir o sistema completo:**
```bash
# Subir WorkAdventure com Auth Service
docker-compose up -d

# Ou apenas o Auth Service
docker-compose -f docker-compose.auth.yaml up -d
```

2. **Testar integração:**
```bash
# Executar teste de integração
node scripts/test-integration.js
```

3. **Acessar o sistema:**
- WorkAdventure: http://play.workadventure.localhost
- Auth Service: http://auth.workadventure.localhost
- Interface de Login: http://auth.workadventure.localhost/login.html
- Interface de Registro: http://auth.workadventure.localhost/register.html
- Perfil do Usuário: http://auth.workadventure.localhost/profile.html
- Discovery OIDC: http://auth.workadventure.localhost/.well-known/openid_configuration

### Configuração

O sistema está configurado para usar:
- **Client ID**: `workadventure-client`
- **Client Secret**: `workadventure-secret`
- **Issuer**: `http://auth.workadventure.localhost`
- **Scopes**: `profile openid email tags-scope`

### Variáveis de Ambiente

Copie o arquivo de exemplo e configure:
```bash
cp env.auth.example .env.auth
# Edite .env.auth com suas configurações
```

## 🎨 Interface de Usuário

### Características da Interface
- **Design Moderno**: Interface limpa e profissional
- **Responsiva**: Funciona perfeitamente em mobile e desktop
- **Acessível**: Suporte completo a screen readers e navegação por teclado
- **Validação em Tempo Real**: Feedback instantâneo para o usuário
- **Integração OIDC**: Fluxo completo de autenticação com WorkAdventure

### Páginas Disponíveis
- **Login** (`/login.html`): Autenticação de usuários existentes
- **Registro** (`/register.html`): Criação de novas contas
- **Perfil** (`/profile.html`): Edição de dados pessoais e tags
- **Recuperação** (`/forgot-password.html`): Recuperação de senha
- **OIDC Redirect** (`/oidc-redirect.html`): Redirecionamento para WorkAdventure

### Funcionalidades
- **Validação Frontend**: Email, senha, username com critérios específicos
- **Sistema de Tags**: Gerenciamento dinâmico de tags personalizadas
- **Estados de Loading**: Indicadores visuais durante operações
- **Alertas Toast**: Notificações de sucesso e erro
- **Tema Consistente**: Cores e tipografia alinhadas com WorkAdventure
- **Redirecionamento Inteligente**: Após login, redireciona para WorkAdventure ou inicia fluxo OIDC

### Comportamento do Redirecionamento
O sistema possui dois tipos de redirecionamento após login bem-sucedido:

1. **Login Direto** (sem parâmetros OIDC):
   - Redireciona para: `http://play.workadventure.localhost/`
   - Usado quando o usuário acessa diretamente a página de login

2. **Login OIDC** (com parâmetros de autorização):
   - Inicia o fluxo OpenID Connect
   - Redireciona para o endpoint de autorização OIDC
   - Usado quando o usuário é redirecionado pelo WorkAdventure

### Teste da Interface
```bash
# Executar teste completo da interface
node scripts/test-interface.js

# Resultado esperado: Taxa de sucesso ≥ 90%
```

### Teste de Redirecionamento
```bash
# Executar teste de redirecionamento após login
node scripts/test-redirect.js

# Resultado esperado: Redirecionamento para http://play.workadventure.localhost/
```

## 🚧 Status da Implementação

### ✅ Fase 1: Infraestrutura Base
- [x] Estrutura do projeto
- [x] Configuração do banco de dados
- [x] Modelos de dados
- [x] Schemas de validação
- [x] Serviços base
- [x] Docker Compose
- [x] Testes unitários

### ✅ Fase 2: API de Autenticação (Concluída)
- [x] Endpoints de registro/login
- [x] Middleware de autenticação
- [x] Validação de dados
- [x] Geração de JWT
- [x] Tratamento de erros centralizado
- [x] Testes unitários e de integração

### ✅ Fase 3: Servidor OIDC (Concluída)
- [x] Discovery endpoint
- [x] Authorization flow
- [x] Token exchange
- [x] User info
- [x] JWKS endpoint
- [x] Suporte a PKCE
- [x] Validação rigorosa
- [x] Testes de integração

### ✅ Fase 4: Integração com WorkAdventure (Concluída)
- [x] Configuração do docker-compose.auth.yaml
- [x] Modificação do docker-compose.yaml principal
- [x] Atualização das variáveis de ambiente OPID
- [x] Adição do alias auth.workadventure.localhost no Traefik
- [x] Script de teste de integração
- [x] Documentação atualizada

### ✅ Fase 5: Interface de Usuário (Concluída)
- [x] Páginas HTML responsivas (login, registro, perfil)
- [x] Design moderno e acessível
- [x] Validação frontend em tempo real
- [x] JavaScript robusto com gerenciamento de estado
- [x] Integração completa com fluxo OIDC
- [x] Sistema de tags dinâmico
- [x] Testes automatizados da interface

### ✅ Fase 6: Testes e Deploy (Concluída)
- [x] Testes automatizados completos (unitários, integração, e2e, performance, segurança)
- [x] Configuração de produção com Docker
- [x] Monitoramento e logs estruturados
- [x] Scripts de deploy e backup
- [x] Comando único para subir todo o projeto

### ✅ Fase 7: Correção de Compatibilidade de Arquitetura (Concluída)
- [x] Resolução do problema "Exec format error" com dependências nativas
- [x] Correção de compatibilidade ARM64 (Apple Silicon) / x86_64
- [x] Recompilação automática de `bcrypt` e `better-sqlite3` no Dockerfile
- [x] Inicialização assíncrona do banco de dados SQLite
- [x] Execução automática de migrações na inicialização
- [x] Testes de funcionamento completos em container
- [x] Documentação de troubleshooting atualizada

### ✅ Fase 8: Correção de Permissões do Banco de Dados SQLite (Concluída)
- [x] Resolução erro "attempt to write a readonly database" (SQLITE_READONLY)
- [x] Correção permissões arquivos WAL e SHM do SQLite
- [x] Remoção arquivos WAL/SHM corrompidos com proprietários diferentes
- [x] Correção comando docker-compose.dev.yaml (npm run dev → node dist/app.js)
- [x] Resolução problema "nodemon: not found" no container de produção
- [x] Testes completos de registro e login de usuários
- [x] Verificação mapeamento correto de todas as 22 rotas
- [x] Validação funcionamento completo do sistema de autenticação

### ✅ Fase 9: Correção do Redirecionamento após Login (Concluída)
- [x] Modificação do redirecionamento após login bem-sucedido
- [x] Alteração de `/profile.html` para `http://play.workadventure.localhost/`
- [x] Manutenção do fluxo OIDC para casos com parâmetros de autorização
- [x] Testes automatizados de integração completos
- [x] Validação do fluxo completo de autenticação com WorkAdventure
- [x] Script de teste para verificação de redirecionamento

### ✅ Fase 10: Correção do Fluxo OIDC com Sistema de Sessão (Concluída)
- [x] Implementação de sistema de cookies para sessão web
- [x] Correção do método getCurrentUser para verificar cookies
- [x] Adição de cookie-parser middleware
- [x] Modificação do endpoint de login para definir cookie auth_token
- [x] Modificação do endpoint de logout para limpar cookie
- [x] Teste completo do fluxo OIDC com usuário logado
- [x] Validação do redirecionamento automático para WorkAdventure
- [x] Teste de token exchange funcionando corretamente

### ✅ Fase 11: Correção do Fluxo OIDC - Redirecionamento Direto (Concluída)
- [x] Identificação do problema: auth-service usava authorization code flow
- [x] Análise do comportamento do oidc-server-mock (redirecionamento direto)
- [x] Modificação do endpoint /oauth/authorize para redirecionamento direto
- [x] Implementação de detecção de requisições do WorkAdventure
- [x] Geração de matrixLoginToken para compatibilidade com Matrix
- [x] Correção de erros TypeScript no build
- [x] Teste completo do fluxo OIDC corrigido
- [x] Validação do redirecionamento direto com token e matrixLoginToken
- [x] Teste de integração com WorkAdventure funcionando perfeitamente
- [x] Resolução do problema de duplicidade de email no registro

## 🎯 Status Atual do Sistema

### ✅ **SISTEMA 100% FUNCIONAL**

O Auth Service está **totalmente operacional** e pronto para uso em produção:

- **Container**: ✅ Rodando estável na porta 3002
- **Health Check**: ✅ Respondendo corretamente
- **Banco de Dados**: ✅ SQLite inicializado com migrações automáticas
- **API Endpoints**: ✅ Todos funcionando (auth, OIDC, metrics)
- **Sistema de Sessão**: ✅ Cookies implementados para sessão web
- **Fluxo OIDC**: ✅ Completo e funcional com redirecionamento automático
- **Compatibilidade**: ✅ Multi-arquitetura (ARM64/x86_64)
- **Integração**: ✅ Pronto para WorkAdventure

### 🧪 Testes de Funcionamento

```bash
# Verificar status do container
docker ps | grep auth-service

# Health Check
curl http://localhost:3002/health
# ✅ {"status":"ok","database":"connected",...}

# API Info
curl http://localhost:3002/api/info
# ✅ {"name":"Auth Service","version":"1.0.0",...}

# OIDC Discovery
curl http://localhost:3002/.well-known/openid-configuration
# ✅ {"issuer":"http://auth-service:3002",...}
```

### 🔧 Integração com WorkAdventure

O auth-service está integrado com o WorkAdventure através do OpenID Connect:

#### Fluxo OIDC Completo

1. **Usuário acessa WorkAdventure**: `http://play.workadventure.localhost`
2. **Clica em "Login"**: WorkAdventure redireciona para `/oauth/authorize`
3. **Auth-service verifica sessão**: 
   - Se usuário logado (cookie): redireciona **diretamente** com tokens
   - Se não logado: redireciona para página de login
4. **Login do usuário**: Define cookie `auth_token` para sessão
5. **Redirecionamento direto**: Volta para WorkAdventure com `token` e `matrixLoginToken`
6. **Usuário autenticado**: Acesso completo ao WorkAdventure (sem token exchange)

**Diferença Chave:**
- ❌ **Antes**: authorization code flow → `/openid-callback` → token exchange
- ✅ **Agora**: redirecionamento direto com tokens → igual oidc-server-mock

#### Vantagens do Sistema Atual

- **Registro dinâmico**: Usuários podem se registrar sem configuração manual
- **Sessão persistente**: Login mantido entre requisições via cookies
- **Redirecionamento direto**: Tokens enviados diretamente (sem authorization code)
- **Compatibilidade 100%**: Funciona exatamente como o oidc-server-mock
- **Matrix Login Token**: Suporte completo para integração com Matrix/Synapse

#### Configuração Docker Compose
```yaml
# Container auth-service
auth-service:
  environment:
    OIDC_ISSUER: http://auth-service:3002
    OIDC_CLIENT_ID: workadventure-client
    OIDC_CLIENT_SECRET: workadventure-secret

# Container play
play:
  environment:
    OPID_CLIENT_ISSUER: http://auth-service:3002
    OPID_CLIENT_ID: workadventure-client
    OPID_CLIENT_SECRET: workadventure-secret
```

#### Endpoints OpenID Connect
- **Discovery**: `http://auth-service:3002/.well-known/openid-configuration`
- **Authorization**: `http://auth-service:3002/oauth/authorize`
- **Token**: `http://auth-service:3002/oauth/token`
- **UserInfo**: `http://auth-service:3002/oauth/userinfo`
- **JWKS**: `http://auth-service:3002/oauth/jwks`

#### Correções Implementadas
1. **Endpoint Discovery**: Corrigido caminho de `openid_configuration` para `openid-configuration`
2. **Comunicação Interna**: Configurado comunicação direta entre containers via IP interno
3. **Traefik**: Adicionada porta 8080 para API do Traefik
4. **Variáveis de Ambiente**: Ajustadas para comunicação interna entre containers

#### Teste de Integração
```bash
# Verificar se o auth-service está funcionando
curl http://localhost:3002/health

# Testar endpoint OpenID Connect
curl http://localhost:3002/.well-known/openid-configuration

# Verificar integração com play (dentro do container)
docker exec workcodeforge_v1-play-1 curl http://auth-service:3002/.well-known/openid-configuration
```

### 🚀 Próximos Passos

O sistema está pronto para:
1. **Integração completa** com WorkAdventure ✅
2. **Deploy em produção** com configurações de segurança
3. **Monitoramento** com métricas e alertas
4. **Backup automático** do banco de dados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/workcodeforge/auth-service/issues)
- **Documentação**: [Wiki](https://github.com/workcodeforge/auth-service/wiki)
- **Email**: suporte@workcodeforge.com
