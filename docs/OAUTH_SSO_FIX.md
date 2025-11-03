# OAuth SSO Fix - Multi-Service State Tracking

**Date:** 2025-11-03
**Status:** ✅ Implemented and Tested
**Impact:** Enables proper Single Sign-On (SSO) across multiple services

---

## Problem: Double Login Bug

### Symptom
When logging in to WorkCodeForge, users had to **log in twice** with different OAuth states:
1. First login (Play) - successful
2. Second login (Matrix) - unexpected, clears the first session

### Root Cause

The issue occurred because:

1. **Multiple Services, Same OAuth Client**
   - Both Play and Matrix/Synapse use the same OAuth client credentials (`workadventure-local`)
   - Each service generates its own OAuth `state` parameter (for CSRF protection)
   - But they're sharing the same `client_id` and `client_secret`

2. **State Mismatch Detection**
   - The frontend tracked only a single `lastOAuthState` value
   - When the second service (Matrix) sent a request with a different state, the frontend interpreted it as a "new OAuth flow"
   - This triggered session clearing, requiring the user to log in again

3. **Sequence of Events**
   ```
   User clicks "Entrar"
        ↓
   Play initiates OAuth → state=STATE_A, redirect_uri=play_url
        ↓
   User authenticates successfully
        ↓
   [Meanwhile] Matrix initiates OAuth → state=STATE_B, redirect_uri=matrix_url
        ↓
   Frontend sees: STATE_B ≠ STATE_A
        ↓
   ⚠️ Treats as "new OAuth flow" → Clears session!
        ↓
   User forced to log in again
   ```

**Files Involved:**
- `docker-compose.override.yml:29` - Both services in ALLOWED_REDIRECT_URIS
- `workadventure-auth/frontend/src/routes/Login.svelte:88-95` - State mismatch detection logic

---

## Solution: Multi-Service OAuth State Tracking

Instead of tracking a single global `lastOAuthState`, we now track multiple states **per service**.

### How It Works

1. **Service Identification**
   - The frontend identifies which service is making the OAuth request by examining the `redirect_uri` parameter
   - Configuration comes from environment variables: `VITE_PLAY_REDIRECT_URI`, `VITE_MATRIX_REDIRECT_URI`

2. **Per-Service State Tracking**
   - Store states in an object: `{ play: STATE_A, matrix: STATE_B }`
   - When a new state arrives, identify its service first
   - Only clear session if the **same service** changes its state (legitimate new OAuth flow)
   - Allow **different services** to have different states simultaneously

3. **Result: True SSO**
   ```
   User clicks "Entrar"
        ↓
   Play OAuth: state=STATE_A, service=play
   Frontend saves: { play: STATE_A }
        ↓
   User authenticates
        ↓
   Matrix OAuth: state=STATE_B, service=matrix (DIFFERENT!)
        ↓
   ✅ Does NOT clear session! Saves: { play: STATE_A, matrix: STATE_B }
        ↓
   ✅ Single login = Both services authenticated!
   ```

---

## Implementation Details

### Code Changes

#### 1. Environment Configuration
**Files:** `.env.template`, `.env.development`

Added redirect URI mappings for each service:
```bash
PLAY_REDIRECT_URI=http://play.workadventure.localhost/openid-callback
MATRIX_REDIRECT_URI=http://matrix.workadventure.localhost/_synapse/client/oidc/callback
```

This is **configurable per deployment**:
- **Development**: Subdomains (play.domain, matrix.domain)
- **Production**: Custom domains (app.yourdomain.com, chat.yourdomain.com)
- **Single Domain**: Paths (yourdomain.com/app/, yourdomain.com/chat/)

#### 2. Frontend Logic
**File:** `workadventure-auth/frontend/src/routes/Login.svelte`

**New helper functions:**
```javascript
// Get service name from redirect_uri
function getServiceFromRedirectUri(uri) {
  // Maps redirect URIs back to service names
}

// Load all tracked OAuth states from localStorage
function getOAuthStates() {
  const stored = localStorage.getItem('oauthStates');
  return stored ? JSON.parse(stored) : {};
}

// Save OAuth states to localStorage
function setOAuthStates(states) {
  localStorage.setItem('oauthStates', JSON.stringify(states));
}
```

**Modified logic in `checkAndAutoAuthorize()`:**
```javascript
// OLD: if (state && lastState && state !== lastState) { clearSession(); }

// NEW: Per-service state tracking
const oauthStates = getOAuthStates();
const currentService = getServiceFromRedirectUri(redirectUri);
const previousState = oauthStates[currentService];

if (state && previousState && state !== previousState) {
  // SAME service changed state → legitimate new OAuth flow
  clearSession();
} else {
  // Different service or same service, same state → don't clear
  oauthStates[currentService] = state;
  setOAuthStates(oauthStates);
}
```

#### 3. Docker Configuration
**File:** `docker-compose.override.yml`

Pass environment variables to frontend build:
```yaml
auth-frontend:
  env_file:
    - .env.development
  environment:
    - VITE_PLAY_REDIRECT_URI=http://play.${DOMAIN}/openid-callback
    - VITE_MATRIX_REDIRECT_URI=http://matrix.${DOMAIN}/_synapse/client/oidc/callback
```

---

## Testing

### Fresh Login Test
1. Clear browser storage: Open DevTools → Application → Storage → Clear All
2. Navigate to `http://play.workadventure.localhost/`
3. Complete character customization and click "Salvar"
4. Click "Entrar" and log in with admin credentials
5. **Expected:** Single login redirects to game (no second login required)
6. **Console logs:** Should show:
   ```
   [LOGIN] Salvando state para serviço 'play'
   [LOGIN] Salvando state para serviço 'matrix'
   ```

### Verification with Playwright
```typescript
// Fresh login from start
await page.goto('http://play.workadventure.localhost');
await page.fill('input[name=username]', 'admin');
await page.fill('input[name=password]', 'password');
await page.click('button:has-text("Entrar")');

// Check console for proper state tracking (no session clear warnings)
const logs = await page.evaluate(() => window.logMessages || []);
expect(logs.some(l => l.includes("Salvando state para serviço"))).toBe(true);
expect(logs.every(l => !l.includes("LIMPANDO SESSÃO"))).toBe(true);
```

---

## Production Deployment

### Configuration by Domain Structure

**Option 1: Subdomains (Recommended)**
```bash
# .env.production
PLAY_REDIRECT_URI=https://app.yourdomain.com/openid-callback
MATRIX_REDIRECT_URI=https://chat.yourdomain.com/_synapse/client/oidc/callback

# Must match ALLOWED_REDIRECT_URIS in auth backend
ALLOWED_REDIRECT_URIS=https://app.yourdomain.com/openid-callback,https://chat.yourdomain.com/_synapse/client/oidc/callback
```

**Option 2: Single Domain with Paths**
```bash
# .env.production
PLAY_REDIRECT_URI=https://yourdomain.com/app/openid-callback
MATRIX_REDIRECT_URI=https://yourdomain.com/chat/_synapse/client/oidc/callback

# Must match ALLOWED_REDIRECT_URIS in auth backend
ALLOWED_REDIRECT_URIS=https://yourdomain.com/app/openid-callback,https://yourdomain.com/chat/_synapse/client/oidc/callback
```

**Option 3: Add More Services**

The solution is extensible. To add a new service:
1. Add environment variable: `NEW_SERVICE_REDIRECT_URI=...`
2. Update `docker-compose.yml`: `- VITE_NEW_SERVICE_REDIRECT_URI=...`
3. Update `ALLOWED_REDIRECT_URIS` in auth backend
4. The frontend will automatically handle it via `getServiceFromRedirectUri()`

---

## Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Login Required** | 2 logins | 1 login ✅ |
| **SSO Across Services** | ❌ No | ✅ Yes |
| **Session Clear** | Unexpected ❌ | Only on legitimate flow ✅ |
| **Configurable** | Hardcoded domains ❌ | Environment variables ✅ |
| **Production Ready** | ❌ No | ✅ Yes |
| **CSRF Protected** | ✅ Yes | ✅ Yes (unchanged) |

---

## Files Modified

| File | Change |
|------|--------|
| `.env.template` | Added PLAY_REDIRECT_URI and MATRIX_REDIRECT_URI with documentation |
| `.env.development` | Configured development values for redirect URIs |
| `workadventure-auth/frontend/src/routes/Login.svelte` | Implemented multi-service state tracking |
| `docker-compose.override.yml` | Added Vite environment variables for auth-frontend |

---

## Troubleshooting

### Still seeing double login?
1. **Clear browser storage**: DevTools → Application → Storage → Clear All
2. **Rebuild containers**: `docker-compose up --build`
3. **Check environment variables**: Verify `VITE_PLAY_REDIRECT_URI` is set in auth-frontend
4. **Console logs**: Check for "Salvando state para serviço" messages

### Production login fails?
1. Verify `ALLOWED_REDIRECT_URIS` matches both configured redirect URIs
2. Verify `.env.production` has matching values
3. Check browser console for exact redirect_uri being sent
4. Ensure domain names are correct (no typos)

### Service identification not working?
1. Check that redirect URIs in environment match actual OAuth requests
2. Fallback uses path pattern matching if env vars empty:
   - `/openid-callback` → play
   - `/_synapse/` → matrix
3. If fallback not working, explicitly set environment variables

---

## Architecture Notes

This solution maintains the security properties of OAuth 2.0:
- **State parameter** still protects against CSRF attacks
- **Different states per service** doesn't weaken security
- **Per-service tracking** ensures each service's authentication is independent
- **Session clearing logic** still protects against hijacking

The key insight: State mismatch between services is **expected and healthy** in a multi-service OAuth setup. Only state mismatch **within the same service** indicates a potential security issue.

---

## References

- [OAuth 2.0 State Parameter - RFC 6749](https://tools.ietf.org/html/rfc6749#section-4.1.1)
- [OpenID Connect Core - State Handling](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest)
- [Security Considerations for Multi-Service OAuth](https://www.rfc-editor.org/rfc/rfc6819.html)
