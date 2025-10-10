# 🔧 Debug - Badge de Localização

## 🚨 Problema: Badge não atualiza de "Home-Office" para "Presencial"

Siga estes passos para debugar:

## 1️⃣ Reiniciar e Acessar o Jogo

```bash
# Parar containers
docker-compose down

# Rebuild e start
docker-compose up --build

# OU apenas play service
cd play
npm run dev
```

## 2️⃣ Abrir Console do Navegador

1. Acesse: `http://play.workadventure.localhost`
2. Faça login com: `gvsantos@beautyservices.com.br`
3. Pressione **F12** para abrir DevTools
4. Vá na aba **Console**

## 3️⃣ Verificar Logs Automáticos

Ao entrar no jogo, você deve ver:

```
=== LOCATION STATUS DEBUG ===
LocalUser: { uuid: "...", email: "gvsantos@beautyservices.com.br", ... }
Current player email: gvsantos@beautyservices.com.br
🔄 Fetching location status for: gvsantos@beautyservices.com.br
LocationStatusService: Fetching status for gvsantos@beautyservices.com.br on 20251019...
LocationStatusService: Status for gvsantos@beautyservices.com.br: PRESENTE → PRESENTE
✅ Current player location status updated to: PRESENTE
```

### ✅ Se você vê esses logs:
O sistema está funcionando! O badge deve atualizar automaticamente.

### ❌ Se NÃO vê esses logs:

Continue para o próximo passo.

## 4️⃣ Verificar Email do Usuário

No console, digite:

```javascript
// Verificar se há email
const localUser = JSON.parse(localStorage.getItem('localUser'));
console.log('Email do usuário:', localUser?.email);
```

**Resultado esperado:**
```
Email do usuário: gvsantos@beautyservices.com.br
```

### ❌ Se retornar `null` ou `undefined`:
O problema é que o email não está sendo salvo no login. Verifique o sistema de autenticação.

## 5️⃣ Testar API Manualmente

No console, digite:

```javascript
// Usar ferramenta de debug
await window.debugLocationStatus.testCurrentUser()
```

**Resultado esperado:**
```
=== Testing Location Status API ===
Email: gvsantos@beautyservices.com.br
LocationStatusService: Fetching status for gvsantos@beautyservices.com.br on 20251019...
LocationStatusService: Status for gvsantos@beautyservices.com.br: PRESENTE → PRESENTE
✅ Result: PRESENTE
```

### ❌ Se der erro de CORS:
```
Access to fetch at 'https://portalweb.rrperfumes.com.br/...' from origin 'http://play.workadventure.localhost' has been blocked by CORS policy
```

**Solução**: A API precisa permitir requisições do domínio `http://play.workadventure.localhost`

## 6️⃣ Testar API Diretamente no Navegador

Abra uma nova aba e acesse:

```
https://portalweb.rrperfumes.com.br/api/controlid/controle_presenca/?data=20251019&email=gvsantos@beautyservices.com.br
```

**Resultado esperado:**
```json
[{"STATUS_FINAL":"PRESENTE"}]
```

### ❌ Se retornar erro 403, 500, ou vazio:
A API não está funcionando corretamente.

## 7️⃣ Forçar Atualização Manual

No console, digite:

```javascript
// Forçar busca da API
await window.debugLocationStatus.refreshCurrentUser()
```

Isso deve:
1. Buscar o status da API
2. Atualizar o cache
3. Atualizar o badge automaticamente

## 8️⃣ Verificar Cache

```javascript
// Ver o que está no cache
window.debugLocationStatus.showCache()
```

**Resultado esperado:**
```
=== Current Location Status Cache ===
gvsantos@beautyservices.com.br: PRESENTE
```

## 9️⃣ Testar com Outro Email

```javascript
// Testar com qualquer email
await window.debugLocationStatus.testAPI('gvsantos@beautyservices.com.br')
```

## 🔟 Verificar Estatísticas do Serviço

```javascript
window.debugLocationStatus.showServiceStats()
```

## 📊 Comandos Úteis de Debug

| Comando | Descrição |
|---------|-----------|
| `window.debugLocationStatus.testCurrentUser()` | Testa com usuário atual |
| `window.debugLocationStatus.getCurrentUserEmail()` | Mostra email do usuário |
| `window.debugLocationStatus.testAPI('email@example.com')` | Testa com email específico |
| `window.debugLocationStatus.showCache()` | Mostra cache atual |
| `window.debugLocationStatus.refreshCurrentUser()` | Força atualização |
| `window.debugLocationStatus.testDirectAPI('email@example.com')` | Testa API sem cache |

## 🐛 Problemas Comuns e Soluções

### Problema 1: Email é `null`

**Causa**: Sistema de autenticação não está salvando o email no LocalUser

**Solução**: Verificar `workadventure-auth/backend` e garantir que o email está sendo enviado no token JWT e salvo no LocalUser.

### Problema 2: Erro de CORS

**Causa**: API não permite requisições do domínio do frontend

**Solução**:
1. Configurar CORS na API para aceitar `http://play.workadventure.localhost`
2. OU criar um proxy no backend (Pusher) - veja `docs/FEATURE_LOCATION_BADGE.md`

### Problema 3: API retorna vazio `[]`

**Causa**: Usuário não tem registro de presença naquele dia

**Comportamento esperado**: Badge azul "Home-Office" (correto!)

### Problema 4: Badge não atualiza visualmente

**Causa**: Badge foi criado mas não está visível

**Solução**:
```javascript
// No console, verificar se o badge existe
const player = gameScene.CurrentPlayer;
console.log('Badge:', player.locationBadge);
console.log('Status:', player.getLocationStatus());
```

## ✅ Checklist de Debug

- [ ] Console mostra "=== LOCATION STATUS DEBUG ==="
- [ ] Email do usuário aparece nos logs
- [ ] "Fetching location status" aparece nos logs
- [ ] "Status for xxx: PRESENTE → PRESENTE" aparece
- [ ] "Current player location status updated to: PRESENTE" aparece
- [ ] `window.debugLocationStatus` está disponível
- [ ] `testCurrentUser()` funciona sem erro
- [ ] API retorna `[{"STATUS_FINAL":"PRESENTE"}]` ao acessar diretamente
- [ ] Cache mostra o email com status PRESENTE
- [ ] Badge atualiza visualmente de azul para verde

## 🆘 Se Nada Funcionar

1. **Limpar cache do navegador**: Ctrl+Shift+Del → Limpar tudo
2. **Hard refresh**: Ctrl+F5
3. **Modo anônimo**: Testar em aba anônima
4. **Verificar rede**: Aba "Network" no DevTools → Procurar chamada para `controle_presenca`

## 📧 Logs para Compartilhar

Se o problema persistir, compartilhe estes logs:

```javascript
// Copiar todos esses outputs:
console.log('=== DEBUG INFO ===');
console.log('1. LocalUser:', localStorage.getItem('localUser'));
console.log('2. Current email:', window.debugLocationStatus.getCurrentUserEmail());
await window.debugLocationStatus.testCurrentUser();
window.debugLocationStatus.showCache();
await window.debugLocationStatus.testDirectAPI('gvsantos@beautyservices.com.br');
```

Copie todo o output do console e envie para análise.
