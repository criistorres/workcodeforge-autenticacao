# 🗺️ ROADMAP - WorkCode Forge
**Sistema de Autenticação e Ambiente Virtual Corporativo**

---

## 📊 VISÃO GERAL

### Modelo de Negócio
- **VPS Isolada por Cliente**: Cada empresa contrata uma instância completamente separada
- **Sem Multi-tenancy em Código**: Isolamento por infraestrutura, não por banco de dados
- **Gestão Centralizada**: Você (provedor) gerencia múltiplas VPS via painel master

### Estado Atual
✅ Sistema de autenticação básico (login/registro)
✅ Integração OIDC com WorkAdventure
✅ Admin panel com dashboard
✅ Edição de perfil básica
✅ Sistema de roles e permissões

❌ Sem recuperação de senha
❌ Sem verificação de email
❌ Sem rate limiting
❌ Sem sistema de tags robusto
❌ Sem emails transacionais
❌ Sem white-label

---

## 📐 REGRAS DE IMPLEMENTAÇÃO

Quando for implementar qualquer funcionalidade deste roadmap, siga estas regras:

### 1️⃣ Estrutura de Arquivos
- **Backend**: `workadventure-auth/backend/src/`
  - Entities: `*/entities/*.entity.ts`
  - DTOs: `*/dto/*.dto.ts`
  - Services: `*.service.ts`
  - Controllers: `*.controller.ts`
- **Frontend Auth**: `workadventure-auth/frontend/src/`
- **Frontend Play**: `play/src/front/`
- **Admin Panel**: `admin/frontend/src/`

### 2️⃣ Padrões de Código
- **Sempre usar TypeScript** (nunca JavaScript)
- **Validação**: Use `class-validator` nos DTOs
- **Nomenclatura**: camelCase para variáveis, PascalCase para classes
- **Idioma**: Código e logs em português quando apropriado
- **Imports**: Organize e remova imports não utilizados


### 5️⃣ Testes
- Testar manualmente cada funcionalidade implementada
- Verificar edge cases (campos vazios, valores inválidos)
- Testar em ambiente local antes de produção

### 6️⃣ Documentação
- Atualizar checkboxes no ROADMAP quando concluir tarefa e houver uma validacao do usuario, sempre pergunte posso conclui?
- Adicionar comentários em código complexo
- Documentar endpoints novos
- Se criar algo não previsto no roadmap, documentar o motivo
- Criar em docs/implementacoes/ um arquivo detalhando a implementação

---

## 🎯 PRIORIDADES

### 🔴 CRÍTICO (Bloqueia Comercialização)
0. **Lobby e Login In-Game** ⚠️ FAZER PRIMEIRO
1. Password Reset
2. Rate Limiting
3. Sistema de Tags e Controle de Acesso
4. Email Verification
5. **Admin Panel Completo** (Roles, Logs, Filtros, Bulk Actions)
6. Emails Transacionais

### 🟡 IMPORTANTE (Diferencial Comercial)
7. Campos Profissionais (cargo, matrícula, etc)
8. White-Label (cores, logo por VPS)
9. Sistema de Mapas

### 🟢 DESEJÁVEL (Futuro)
10. Analytics Avançado
11. Deploy Automation
12. API Pública

---

# 📅 FASES DE DESENVOLVIMENTO

---

## 🎮 FASE 0: LOBBY E LOGIN IN-GAME
**Duração**: 3-4 dias
**Prioridade**: 🔴 CRÍTICA - FAZER PRIMEIRO
**[📖 Detalhes técnicos](docs/implementacoes/fase-0-lobby.md)**

### Objetivos
- Usuários não logados veem mapa de lobby
- Clica em botao de login, redireciona para auth
- Após login, usuário é redirecionado ao mapa principal
- Sistema não quebra o fluxo atual que funciona

### Entregas
- [ ] Mapa `lobby.json` criado e configurado
- [ ] Endpoint `/auth/check-session` implementado
- [ ] Cookie cross-domain configurado (`.workadventure.localhost`)
- [ ] Roteamento de mapas no frontend (lobby vs main)
- [ ] Proteção contra loops de redirecionamento
- [ ] Testes de fluxo completo

---

## 🔐 FASE 1: SEGURANÇA CRÍTICA
**Duração**: 1 semana
**Prioridade**: 🔴 CRÍTICA
**[📖 Detalhes técnicos](docs/implementacoes/fase-1-seguranca.md)**

### 1.1 Rate Limiting & Login Attempts
- Bloquear IP após 5 tentativas falhas em 15min
- Bloquear conta após 10 tentativas falhas em 1h
- CAPTCHA após 3 falhas consecutivas
- Limpar tentativas antigas via cron job

### 1.2 Password Reset Completo
- Token UUID com expiração de 15 minutos
- Email com link de reset
- Validação de força da senha
- Histórico de senhas (não permitir últimas 3)

### 1.3 Email Verification
- Bloquear login se email não verificado
- Token com expiração de 24h
- Limite de 3 re-envios por hora

### 1.4 Política de Senhas
- Mínimo 8 caracteres
- Maiúscula, minúscula, número, especial
- Score de força (zxcvbn)
- Histórico de senhas

### 1.5 Session Security
- Rastrear IP, geolocalização, device, browser
- Alerta de login em novo país/dispositivo
- Logout remoto de sessões

---

## 🏷️ FASE 2: SISTEMA DE TAGS E CONTROLE DE ACESSO
**Duração**: 4-5 dias
**Prioridade**: 🔴 CRÍTICA
**[📖 Detalhes técnicos](docs/implementacoes/fase-2-tags.md)**

### 2.1 Backend - Tag Management
- Entity `TagEntity` (nome, displayName, descrição, cor, ícone)
- CRUD completo de tags disponíveis
- Atribuir tags aos usuários

### 2.2 Admin Panel - Interface de Tags
- Página `/admin/tags` com grid de cards
- Modal criar/editar tag com color picker e emoji picker
- Integração no UserList (filtro, modal de atribuição)

### 2.3 Integração WorkAdventure
- Propriedades de área: `requiredTags`, `tagLogic` (OR/AND)
- Verificação de acesso ao entrar em área
- Mensagem de bloqueio personalizada

---

## 🎛️ FASE 5: FINALIZAÇÃO DO ADMIN PANEL
**Duração**: 3 semanas
**Prioridade**: 🔴 CRÍTICA
**[📖 Detalhes técnicos](docs/implementacoes/fase-5-admin-panel.md)**

### Estado Atual
✅ Dashboard básico, UserList, UserDetail, Sidebar
❌ Faltam: Roles, Logs, Filtros avançados, Bulk actions, Gráficos, Componentes

### Semana 1: Páginas Essenciais
- [ ] Página `/admin/roles` - CRUD de permissões
- [ ] Página `/admin/logs` - Auditoria com filtros e timeline
- [ ] Exportação CSV de logs

### Semana 2: Melhorias UserList e UserDetail
- [ ] Filtros avançados (tag, status, data, departamento)
- [ ] Bulk actions (delete, block, assign tags)
- [ ] Timeline de atividades do usuário
- [ ] Gráfico de logins (Chart.js)
- [ ] Gestão de sessões ativas
- [ ] Exportação CSV de usuários

### Semana 3: Dashboard e Componentes
- [ ] Gráficos: crescimento, departamentos, horários de pico
- [ ] Cards de ações rápidas
- [ ] Alertas: limite de usuários, verificações pendentes, aniversariantes
- [ ] Modal reutilizável
- [ ] Toast notification system
- [ ] Skeleton loading
- [ ] Substituir todos `alert()` e `confirm()`

---

## 👤 FASE 6: CAMPOS PROFISSIONAIS DO USUÁRIO
**Duração**: 3 dias
**Prioridade**: 🟡 IMPORTANTE
**[📖 Detalhes técnicos](docs/implementacoes/fase-6-campos-profissionais.md)**

### Novos Campos em UserEntity
**Dados Profissionais:**
- cargo, matricula, dataAdmissao, setor
- gestorId (hierarquia), subordinados

**Dados Pessoais:**
- dataNascimento (para aniversariantes)

**Preferências:**
- idioma, timezone, tema (light/dark)

**Segurança:**
- passwordHistory, passwordChangedAt
- failedLoginAttempts, lockedUntil

### Criptografia LGPD
- Criptografar: CPF, telefone, dataNascimento
- AES-256-CBC com IV único por registro

---

## 📧 FASE 7: SISTEMA DE EMAILS
**Duração**: 3-4 dias
**Prioridade**: 🔴 CRÍTICA
**[📖 Detalhes técnicos](docs/implementacoes/fase-7-emails.md)**

### Email Service
- Integração com SendGrid/Mailgun/AWS SES
- Templates HTML responsivos

### Templates Necessários
- Welcome (boas-vindas)
- Email Verification
- Password Reset
- Password Changed
- Login Alert (novo dispositivo/local)
- Limit Alert (próximo do limite de usuários)

### White-Label
- Carregar logo, cores, dados da empresa do `empresa.yml`
- Templates personalizados por VPS

### Fila de Emails (Opcional)
- Bull Queue + Redis
- Retry automático, monitoramento, rate limiting

---

## 🎨 FASE 8: WHITE-LABEL E CUSTOMIZAÇÃO
**Duração**: 3-4 dias
**Prioridade**: 🟡 IMPORTANTE
**[📖 Detalhes técnicos](docs/implementacoes/fase-8-white-label.md)**

### Sistema de Configuração por VPS
**Arquivo:** `config/empresa.yml`

**Seções:**
- `empresa`: nome, CNPJ, razão social
- `branding`: logo, cores, fonte
- `features`: toggles de funcionalidades
- `plano`: tipo, limites (usuários, mapas, storage)
- `contato`: emails, telefone, site
- `social`: LinkedIn, Instagram

### Frontend - Aplicar White-Label
- Carregar config do endpoint `/api/config/public`
- Aplicar cores via CSS variables
- Alterar título, favicon, logo

### Admin Panel - Configurações
- Página `/admin/configuracoes`
- Upload de logo
- Color pickers para cores
- Toggles de features
- Limites do plano

---

## 🗺️ FASE 9: SISTEMA DE MAPAS
**Duração**: 1 semana
**Prioridade**: 🟡 IMPORTANTE
**[📖 Detalhes técnicos](docs/implementacoes/fase-9-mapas.md)**

### Backend - Map Management
- Entity `MapaEntity` (nome, tipo, arquivoUrl, isActive, isDefault)
- Upload de `.json` com validação
- CRUD completo

### Admin Panel - Gestão de Mapas
- Página `/admin/mapas` com grid de cards
- Upload de mapa com preview
- Ativar/desativar mapas
- Definir mapa padrão

### Integração WorkAdventure
- Carregar mapa padrão ao entrar
- Portais entre mapas com controle de acesso por tag

---

## 🚀 FASE 10: AUTOMAÇÃO DE DEPLOY
**Duração**: 3-4 dias
**Prioridade**: 🟢 DESEJÁVEL
**[📖 Detalhes técnicos](docs/implementacoes/fase-10-automacao.md)**

### Scripts
- **setup-cliente.sh**: Setup automático de nova VPS
- **backup-cliente.sh**: Backup diário (banco + arquivos)
- **update-cliente.sh**: Atualização de versão

### Funcionalidades
- Gerar secrets fortes automaticamente
- Configurar Docker Compose
- Criar usuário admin inicial
- Enviar credenciais por email
- Agendar backups via cron

---

## 📊 FASE 11: ANALYTICS E RELATÓRIOS
**Duração**: 4-5 dias
**Prioridade**: 🟢 DESEJÁVEL
**[📖 Detalhes técnicos](docs/implementacoes/fase-11-analytics.md)**

### Métricas de Uso
- Entity `MetricaDiariaEntity` com cron job diário
- Usuários ativos, pico simultâneo, tempo médio de sessão
- Total de logins, novos usuários
- Mapas mais acessados

### Dashboard Analytics
**Gráficos:**
- Usuários ativos (30 dias) - Linha
- Novos usuários (30 dias) - Barra
- Tempo médio de sessão - Gauge
- Mapas mais acessados - Pizza
- Horários de pico - Heatmap

---

## ⏱️ CRONOGRAMA ESTIMADO

```
TOTAL: 10-11 SEMANAS

┌─────────────────────────────────────────────────────────┐
│ Semana 1: Lobby e Login In-Game (FASE 0)               │
│ Semana 2: Segurança Crítica (FASE 1)                   │
│ Semana 3: Sistema de Tags (FASE 2)                     │
│ Semana 4: Campos Profissionais (FASE 6)                │
│ Semana 5: Sistema de Emails (FASE 7)                   │
│ Semanas 6-8: Admin Panel Completo (FASE 5)             │
│ Semana 9: White-Label + Mapas (FASES 8 e 9)            │
│ Semana 10: Automação (FASE 10)                         │
│ Semana 11: Analytics + Testes (FASE 11)                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 MARCOS (MILESTONES)

### Milestone 1: Lobby Funcional (Semana 1)
✅ Sistema de lobby implementado
✅ Login in-game funcionando
✅ Redirecionamento correto entre mapas
✅ Cookie cross-domain configurado

**Critério**: Usuários não autenticados veem lobby, autenticados vão direto para o mapa principal

---

### Milestone 2: MVP Seguro (Semana 3)
✅ Sistema de autenticação completo e seguro
✅ Recuperação de senha funcionando
✅ Sistema de tags com controle de acesso
✅ Rate limiting ativo
✅ Email verification

**Critério**: Pode ser testado com clientes beta

---

### Milestone 3: Pronto para Vendas (Semana 8)
✅ Admin panel completamente funcional
✅ Campos profissionais implementados
✅ Emails transacionais
✅ Roles e permissões completos
✅ Auditoria de logs

**Critério**: Pode ser comercializado com confiança

---

### Milestone 4: Produção Completa (Semana 11)
✅ White-label configurável
✅ Gestão de mapas
✅ Analytics e relatórios
✅ Automação de deploy
✅ Documentação completa

**Critério**: Escalável para múltiplos clientes

---

## 📚 DOCUMENTAÇÃO

### Para Desenvolvimento
- [ ] `README.md` - Setup local
- [ ] `CONTRIBUTING.md` - Padrões de código
- [ ] `docs/API.md` - Documentação de endpoints

### Para Deploy
- [ ] `docs/INSTALL.md` - Instalação em produção
- [ ] `docs/BACKUP.md` - Procedimentos de backup
- [ ] `docs/TROUBLESHOOTING.md` - Problemas comuns

### Para Cliente
- [ ] `docs/GUIA_USUARIO.md` - Como usar
- [ ] `docs/GUIA_ADMIN.md` - Painel admin
- [ ] `docs/FAQ.md` - Perguntas frequentes

### Legal
- [ ] `docs/TERMOS_DE_USO.md`
- [ ] `docs/POLITICA_PRIVACIDADE.md` (LGPD)
- [ ] `docs/SLA.md` - Acordo de nível de serviço

### Implementações Técnicas
- [ ] `docs/implementacoes/fase-0-lobby.md`
- [ ] `docs/implementacoes/fase-1-seguranca.md`
- [ ] `docs/implementacoes/fase-2-tags.md`
- [ ] `docs/implementacoes/fase-5-admin-panel.md`
- [ ] `docs/implementacoes/fase-6-campos-profissionais.md`
- [ ] `docs/implementacoes/fase-7-emails.md`
- [ ] `docs/implementacoes/fase-8-white-label.md`
- [ ] `docs/implementacoes/fase-9-mapas.md`
- [ ] `docs/implementacoes/fase-10-automacao.md`
- [ ] `docs/implementacoes/fase-11-analytics.md`

---

## 🚨 NOTAS IMPORTANTES

### Segurança
- **NUNCA** commitar `.env` ou `empresa.yml` com dados reais
- Rotacionar secrets a cada 90 dias
- Manter logs de auditoria por 1 ano
- Backup criptografado

### Performance
- Índices no banco (email, userId, createdAt)
- Cache Redis para sessões
- CDN para assets estáticos
- Limitar queries pesadas

### LGPD
- Criptografar dados sensíveis (CPF, telefone, dataNascimento)
- Endpoint de exportação de dados do usuário
- Endpoint de exclusão de dados (direito ao esquecimento)
- Consentimento explícito para coleta de dados

### Escalabilidade
- Cada VPS deve suportar até limite do plano
- Monitorar uso de CPU/RAM/Disco
- Alertas quando atingir 80% de recursos
- Plano de upgrade claro para o cliente

---

**Última Atualização**: 06/10/2025
**Versão do Roadmap**: 2.0

**Desenvolvedor**: Cristian Torres
**Repositório**: https://github.com/cristiantorres/workcodeforge
