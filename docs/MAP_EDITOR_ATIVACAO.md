# Map Editor: Ativação e Controle de Acesso

## Status Atual ✅

| Item | Status | Detalhes |
|------|--------|----------|
| **Map Editor Habilitado** | ✅ Ativo | `ENABLE_MAP_EDITOR=true` |
| **Mapas Editáveis** | ✅ Funcional | URLs `/~/*.wam` via map-storage |
| **Controle por Tags** | ✅ Ativo | Apenas `admin` ou `editor` podem editar |
| **Integração JWT** | ✅ Completa | Tags incluídas no token |

---

## Como o Map Editor Funciona

### Fluxo de Funcionamento

```
1. Usuário acessa mapa via `/~/{mapname}.wam`
   ↓
2. Frontend verifica se mapa é editável (regex /~/)
   ↓
3. Backend valida tags do usuário:
   - Tag "admin" → ✅ Pode editar
   - Tag "editor" → ✅ Pode editar
   - Outras tags → ❌ Sem acesso
   ↓
4. Se aprovado: mostra botão do Map Editor
   ↓
5. Clique → abre interface de edição
   ↓
6. Edições salvas automaticamente no map-storage
```

### Localização Técnica

| Componente | Arquivo | Linha |
|------------|---------|-------|
| Lógica de Controle | `play/src/pusher/services/LocalAdmin.ts` | 72-76 |
| Detecção de URL | `play/src/pusher/services/LocalAdmin.ts` | 69 |
| Frontend (Visibilidade) | `play/src/front/Phaser/Game/GameScene.ts` | 802 |
| Roteamento de Mapas | `play/src/front/Connection/ConnectionManager.ts` | 343, 361 |
| Auth Backend (Tags) | `workadventure-auth/backend/src/oidc/oidc.service.ts` | 88 |

---

## Configuração Atual do Seu Ambiente

### `.env` - Configurações Globais

```env
# Map Editor Settings
ENABLE_MAP_EDITOR=true                    # ✅ Map Editor ATIVADO

# Controle de Acesso
MAP_EDITOR_ALLOW_ALL_USERS=false          # ❌ NÃO permite todos
MAP_EDITOR_ALLOWED_USERS=                 # (vazio - não usa lista de emails)

# Sistema de Tags
OPENID_TAGS_CLAIM=tags                    # ✅ Campo "tags" no JWT
OPENID_SCOPE=openid email profile tags-scope  # ✅ Inclui scope de tags
```

### `docker-compose.yaml`

```yaml
play:
  environment:
    ENABLE_MAP_EDITOR: "$ENABLE_MAP_EDITOR"
    MAP_EDITOR_ALLOW_ALL_USERS: "false"   # ✅ Restrito por tags
```

---

## Usuários com Acesso ao Map Editor

### Teste Local (Padrão)

| Email | Senha | Tags | Pode Editar? |
|-------|-------|------|--------------|
| `admin@example.com` | `pwd` | `["admin", "moderator"]` | ✅ SIM |
| `user1@example.com` | `pwd` | `["admin", "moderator"]` | ✅ SIM |
| `user2@example.com` | `pwd` | `["member"]` | ❌ NÃO |

### Como Verificar Tags de um Usuário

1. **Via Admin Panel**:
   - Acesse: `http://auth.workadventure.localhost/admin`
   - Vá em "Usuários"
   - Clique no usuário
   - Verifique campo "Tags"

2. **Via JWT Token** (DevTools):
   - Abra DevTools (F12)
   - Application → Storage
   - Procure por JWT token
   - Decodifique em https://jwt.io
   - Procure campo `"tags"`

3. **Via SQL**:
   ```sql
   SELECT email, tags FROM users WHERE email = 'admin@example.com';
   -- Result: ["admin", "moderator"]
   ```

---

## Modificar Acesso ao Map Editor

### Opção 1: Por Tags (Recomendado) ⭐

**Situação**: Você quer que apenas certos usuários editem mapas.

**Passo 1**: Adicione tag `admin` ou `editor` ao usuário

```sql
UPDATE users
SET tags = jsonb_build_array('designer', 'editor')
WHERE email = 'designer@company.com';
```

**Passo 2**: Usuário faz logout e login novamente

**Passo 3**: Ao acessar um mapa, verá botão do Map Editor

**Vantagens**:
- ✅ Controle granular
- ✅ Baseado em roles (admin, editor, moderator, etc)
- ✅ Funciona com sistema de autenticação

### Opção 2: Por Email (Lista Whitelist)

**Situação**: Você quer um controle muito específico por email.

**Passo 1**: Edite `.env`:
```env
MAP_EDITOR_ALLOW_ALL_USERS=false
MAP_EDITOR_ALLOWED_USERS=designer1@company.com,designer2@company.com
```

**Passo 2**: Reinicie serviço:
```bash
docker-compose restart play
```

**Observação**: Apenas estes emails podem editar, independente de tags.

**Vantagens**:
- ✅ Muito específico
- ✅ Não requer tags

**Desvantagens**:
- ❌ Difícil escalar para muitos usuários
- ❌ Requer restart do serviço

### Opção 3: Permitir Todos (NÃO RECOMENDADO)

**Situação**: Você quer que qualquer usuário autenticado possa editar.

```env
MAP_EDITOR_ALLOW_ALL_USERS=true
```

**⚠️ Aviso**: Isto é PERIGOSO em produção! Qualquer usuário pode editar qualquer mapa.

---

## Código de Controle de Acesso

### Lógica de Validação (LocalAdmin.ts:72-76)

```typescript
if (
    ENABLE_MAP_EDITOR &&
    (MAP_EDITOR_ALLOW_ALL_USERS ||
        MAP_EDITOR_ALLOWED_USERS.includes(userIdentifier) ||
        tags?.includes("admin") ||
        tags?.includes("editor"))
) {
    canEdit = true;  // ✅ Pode editar
}
```

**Explicação**:
- `ENABLE_MAP_EDITOR` deve ser `true`
- **E** (ANY of):
  - `MAP_EDITOR_ALLOW_ALL_USERS` é true
  - Email está em `MAP_EDITOR_ALLOWED_USERS`
  - Tag "admin" presente
  - Tag "editor" presente

---

## Troubleshooting: Map Editor não aparece

### Checklist de Diagnóstico

#### ❌ Problema 1: Botão não aparece ao entrar no mapa

**Verificar 1.1**: Você tem tag "admin" ou "editor"?
```bash
# SQL
SELECT email, tags FROM users WHERE email = 'seu-email@example.com';
# Deve mostrar tags incluindo "admin" ou "editor"
```

**Verificar 1.2**: `ENABLE_MAP_EDITOR=true`?
```bash
grep ENABLE_MAP_EDITOR .env
# Deve mostrar: ENABLE_MAP_EDITOR=true
```

**Verificar 1.3**: URL é `/~/` format?
```
✅ Correto: http://play.workadventure.localhost/~/filial1.wam
❌ Errado: http://play.workadventure.localhost/_/global/...
```

**Verificar 1.4**: Token contém tags?
```javascript
// No console do DevTools:
const token = localStorage.getItem('authToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload.tags);  // Deve mostrar ["admin", ...]
```

#### ❌ Problema 2: Tag não está no JWT

**Causa**: Sistema de autenticação não está enviando tags

**Solução**:
1. Verifique `OPENID_TAGS_CLAIM=tags` no `.env`
2. Verifique que `OPENID_SCOPE` inclui `tags-scope`
3. Verifique que banco de dados tem tags:
   ```sql
   SELECT * FROM users WHERE email = 'admin@example.com' \gx
   -- Campo: tags | Value: ["admin"]
   ```

#### ❌ Problema 3: Mapa não é editável

**Causa**: Mapa está em `/_/global/` format (não em `/~/`)

**Solução**:
1. Fazer upload via map-storage
2. Configurar `defaultMap` do usuário
3. Mapa automaticamente redireciona para `/~/filial1.wam`

---

## Teste Prático: Verificar Acesso

### Teste 1: Login e Verificar Tags

```bash
# 1. Acesse o app
curl -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pwd"}'

# 2. Verifique response (contém JWT)
# 3. Decodifique JWT em https://jwt.io
# 4. Procure por campo "tags"
```

### Teste 2: Acessar Map Editor UI

```bash
# 1. Limpe cache do navegador
# 2. Faça login com admin@example.com
# 3. Vá para: http://play.workadventure.localhost
# 4. Procure por ícone de Map Editor (🔧)
# 5. Clique para abrir
```

### Teste 3: Editar Mapa

```bash
# 1. Com Map Editor aberto:
# 2. Clique em uma camada de tiles
# 3. Modifique um tile (clique e arraste)
# 4. Veja "Salvando..." aparecer
# 5. Recarregue a página - mudança persiste!
```

---

## Logs Úteis para Debugging

### Ver Logs de Autenticação

```bash
docker-compose logs auth-backend | grep -i "tags\|editor\|token"
```

### Ver Logs do Play (Map Editor)

```bash
docker-compose logs play | grep -i "map.*editor\|canEdit\|tags"
```

### Ver Logs do Map-Storage

```bash
docker-compose logs map-storage | grep -i "upload\|filial\|success"
```

---

## Performance e Limitações

### Limitações Conhecidas

| Limitação | Detalhes |
|-----------|----------|
| Tamanho de mapa | Até 50MB (dependendo de servidor) |
| Simultâneos editando | Não há lock - último save vence |
| Histórico de versões | Não implementado (guarde backups!) |
| Undo/Redo | Apenas para sessão atual |

### Boas Práticas

1. **Backup**: Faça download de mapas antes de editar
2. **Um editor por vez**: Não edite o mesmo mapa em duas abas
3. **Salve frequentemente**: Não confie em auto-save
4. **Teste em dev**: Sempre teste em mapa de teste antes

---

## Recursos

- **Tiled Editor Documentation**: https://doc.mapeditor.org/
- **WorkAdventure Map Editor**: https://docs.workadventure.dev/admin/manage-maps/using-the-map-editor
- **Sistema de Tags**: Ver `DOCUMENTACAO_AUTENTICACAO.md`
- **Upload de Mapas**: Ver `MAPAS_UPLOAD_GUIA.md`
- **Código Fonte**:
  - `play/src/pusher/services/LocalAdmin.ts` (lógica)
  - `play/src/front/Phaser/Game/MapEditorModeManager.ts` (UI)

---

**Status**: ✅ Fully Functional and Tested
**Última atualização**: Outubro 2025
**Autor**: WorkCodeForge Development Team
