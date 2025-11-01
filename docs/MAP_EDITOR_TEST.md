# Map Editor Access Testing Guide

This guide helps you verify that the Map Editor access control is working correctly based on user tags.

## Prerequisites

1. Services are running: `docker-compose up`
2. You have access to the application at `http://play.workadventure.localhost`
3. Browser DevTools available for token inspection

## Test Scenarios

### Scenario 1: Admin User Can Edit Maps ✅

**Expected**: User with `admin` tag should see and access the map editor

**Steps**:
1. Open browser, go to `http://play.workadventure.localhost`
2. Click "Login"
3. Enter credentials:
   - Email: `admin@example.com`
   - Password: `pwd`
4. After login, look for the **map editor icon** in the action bar (usually bottom right)
5. Click the icon to open the map editor
6. Verify you can interact with map editing tools

**Verification**:
- ✅ Map editor button is visible
- ✅ Can open and use the map editor
- ✅ Can save map changes

**Token Check**:
1. Open DevTools (F12) → Network tab
2. Reload page and look for requests to `play.workadventure.localhost`
3. Find a response that contains a JWT token
4. Copy the `id_token` or `access_token`
5. Go to https://jwt.io
6. Paste the token and verify the decoded payload contains:
   ```json
   {
     "tags": ["admin", "moderator"],
     "email": "admin@example.com",
     ...
   }
   ```

---

### Scenario 2: Member User Cannot Edit Maps ❌

**Expected**: User with only `member` tag should NOT see the map editor option

**Steps**:
1. Open an incognito/private browser window
2. Go to `http://play.workadventure.localhost`
3. Click "Login"
4. Enter credentials:
   - Email: `user2@example.com`
   - Password: `pwd`
5. After login, look for the map editor icon in the action bar
6. Verify the icon is **NOT visible**

**Verification**:
- ✅ Map editor button is NOT visible
- ✅ Cannot access map editor functionality

**Token Check**:
1. Same as Scenario 1, but the token should contain:
   ```json
   {
     "tags": ["member"],
     "email": "user2@example.com",
     ...
   }
   ```

---

### Scenario 3: User with Editor Tag Can Edit ✅

**Expected**: User with `editor` tag should see and access the map editor

**Create a test user with editor tag**:
1. Access the auth service database or admin panel
2. Create/update a user with tags: `["editor"]`
3. Or manually update the user via the API if available

**Steps**:
1. Login with the editor user
2. Verify map editor is visible and functional
3. Same token verification as Scenario 1

---

## Manual Configuration Testing

If you want to test using the email whitelist instead of tags:

### Enable Email-Based Access

1. Edit `.env`:
   ```env
   ENABLE_MAP_EDITOR=true
   MAP_EDITOR_ALLOW_ALL_USERS=false
   MAP_EDITOR_ALLOWED_USERS=user1@example.com,admin@example.com
   ```

2. Restart services:
   ```bash
   docker-compose restart play
   ```

3. Test with `user1@example.com` (should see editor) and `user2@example.com` (should NOT see editor)

### Allow All Users (Development Only)

1. Edit `.env`:
   ```env
   ENABLE_MAP_EDITOR=true
   MAP_EDITOR_ALLOW_ALL_USERS=true
   ```

2. Restart services:
   ```bash
   docker-compose restart play
   ```

3. Both `user1@example.com` and `user2@example.com` should see the editor

---

## Troubleshooting

### Problem: Map Editor button doesn't appear for admin user

**Check 1: Verify configuration**
```bash
# Check .env
grep MAP_EDITOR .env

# Check logs
docker-compose logs play | grep -i "map.editor"
```

**Check 2: Restart services**
```bash
docker-compose down
docker-compose up -d play
```

**Check 3: Clear browser cache**
- Clear localStorage: DevTools → Application → LocalStorage → Clear all
- Hard refresh: Ctrl+Shift+R or Cmd+Shift+R

**Check 4: Verify token contains tags**
- Use jwt.io to inspect the token (see Scenario 1)
- Tags claim might have a different name if configured differently

### Problem: Can't login at all

**Check auth service logs**:
```bash
docker-compose logs auth-backend
```

**Verify credentials**:
- Default test users:
  - `user1@example.com` / `pwd` (admin, moderator tags)
  - `user2@example.com` / `pwd` (member tag)
  - `admin@example.com` / `pwd` (admin, moderator tags)

### Problem: Token doesn't contain tags

**Check OPENID_TAGS_CLAIM in .env**:
```bash
grep OPENID_TAGS_CLAIM .env
# Should be: OPENID_TAGS_CLAIM=tags
```

**Check auth backend sending tags**:
```bash
docker-compose logs auth-backend | grep -i tags
```

---

## Current Configuration

Based on your `.env` file:

```
ENABLE_MAP_EDITOR=true                    # Feature is enabled ✅
MAP_EDITOR_ALLOW_ALL_USERS=false          # Restricted access ✅
MAP_EDITOR_ALLOWED_USERS=                 # (empty - not using email list)
OPENID_TAGS_CLAIM=tags                    # Tag claim name ✅
OPENID_SCOPE=openid email profile tags-scope  # Includes tags scope ✅
```

**Summary**:
- ✅ Only users with `admin` or `editor` tags can edit maps
- ✅ Tags are included in the JWT token
- ✅ Email-based access control is NOT active

---

## Files Involved

1. **Configuration**:
   - `.env` - Environment variables
   - `docker-compose.yaml` - May override .env

2. **Backend Logic**:
   - `play/src/pusher/services/LocalAdmin.ts:72-76` - Access control decision
   - `workadventure-auth/backend/src/oidc/oidc.service.ts:88` - Tags included in JWT

3. **Frontend**:
   - `play/src/front/Phaser/Game/GameScene.ts:802` - Map editor button visibility
   - `play/src/front/Connection/RoomConnection.ts:505` - Activation logic

---

## Additional Resources

- [MAP_EDITOR_ACCESS.md](./MAP_EDITOR_ACCESS.md) - Detailed configuration guide
- [DOCUMENTACAO_AUTENTICACAO.md](./DOCUMENTACAO_AUTENTICACAO.md) - Authentication system docs
- JWT Token Inspector: https://jwt.io/
