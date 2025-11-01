# Map Editor Access Control

## Overview

The Map Editor is a powerful feature in WorkAdventure that allows users to edit and create maps directly from the application interface. Access control is managed through environment variables and user tags in the JWT token.

## Current Configuration

**Status**: Map Editor is **ENABLED** and **RESTRICTED by user tags**

- `ENABLE_MAP_EDITOR=true` - Feature is activated
- `MAP_EDITOR_ALLOW_ALL_USERS=false` - Only specific users can access

## Access Control Levels

### 1. Tag-Based Access (Recommended for Production)

Users with either of these tags in their JWT token can access the map editor:
- `admin` - Full administrative access
- `editor` - Map editing permissions

**Test users with access:**
- `user1@example.com` - Tags: `["admin", "moderator"]` ✅
- `admin@example.com` - Tags: `["admin", "moderator"]` ✅

**Test users WITHOUT access:**
- `user2@example.com` - Tags: `["member"]` ❌

### 2. Email Whitelist Access (Optional)

If you want to be more granular, you can specify individual emails:

```env
MAP_EDITOR_ALLOWED_USERS=user1@example.com,user2@example.com
MAP_EDITOR_ALLOW_ALL_USERS=false
```

This allows only those specific emails to access the map editor, **regardless of their tags**.

### 3. Allow All Users (NOT RECOMMENDED FOR PRODUCTION)

To allow all authenticated users to access the map editor:

```env
MAP_EDITOR_ALLOW_ALL_USERS=true
```

**Security Warning**: This should only be used for development or private installations.

## How Access Control Works

The access decision is made in `play/src/pusher/services/LocalAdmin.ts:72-76`:

```typescript
if (
    ENABLE_MAP_EDITOR &&
    (MAP_EDITOR_ALLOW_ALL_USERS ||
        MAP_EDITOR_ALLOWED_USERS.includes(userIdentifier) ||
        tags?.includes("admin") ||
        tags?.includes("editor"))
) {
    canEdit = true;
}
```

A user can access the map editor if **ANY** of these conditions are true:
1. `MAP_EDITOR_ALLOW_ALL_USERS` is set to `true`
2. User's email is in `MAP_EDITOR_ALLOWED_USERS` list
3. User has the `admin` tag in their JWT claims
4. User has the `editor` tag in their JWT claims

## Configuration for Different Scenarios

### Development Environment
```env
ENABLE_MAP_EDITOR=true
MAP_EDITOR_ALLOW_ALL_USERS=true
```
All authenticated users can edit maps.

### Production - Admin Only
```env
ENABLE_MAP_EDITOR=true
MAP_EDITOR_ALLOW_ALL_USERS=false
MAP_EDITOR_ALLOWED_USERS=
```
Only users with `admin` or `editor` tags can edit. (Current configuration)

### Production - Admin + Specific Users
```env
ENABLE_MAP_EDITOR=true
MAP_EDITOR_ALLOW_ALL_USERS=false
MAP_EDITOR_ALLOWED_USERS=designer1@company.com,designer2@company.com
```
Users with `admin`/`editor` tags + specific designers can edit.

### Fully Restricted
```env
ENABLE_MAP_EDITOR=true
MAP_EDITOR_ALLOW_ALL_USERS=false
MAP_EDITOR_ALLOWED_USERS=
```
Only users with `admin` or `editor` tags can edit. (Most restrictive)

## Managing User Tags

Users are assigned tags when they register or authenticate via OpenID Connect. Tags are stored in the JWT token's `tags` claim.

### To grant a user Map Editor access:

1. **Option A**: Assign them the `admin` or `editor` tag via admin interface
2. **Option B**: Add their email to `MAP_EDITOR_ALLOWED_USERS` environment variable

### Where Tags Are Used

- **Custom Auth Backend**: `workadventure-auth/backend/src/users/users.service.ts`
  - Default tags assigned during registration: `["member"]`
  - Can be updated via `updateTags()` method

- **OIDC Provider**: Claim configured in `.env`
  ```env
  OPENID_TAGS_CLAIM=tags
  ```

## Enabling Map Editor for Your Installation

### Step 1: Verify ENABLE_MAP_EDITOR is true
```bash
grep ENABLE_MAP_EDITOR .env
# Should output: ENABLE_MAP_EDITOR=true
```

### Step 2: Choose your access control strategy
See "Configuration for Different Scenarios" above.

### Step 3: Configure environment variables
Edit your `.env` file with your chosen strategy.

### Step 4: Restart services
```bash
docker-compose restart play
```

### Step 5: Test access
1. Login with a user that should have access (e.g., `user1@example.com`)
2. Click the map editor icon in the action bar (if visible)
3. Verify you can edit the map

## Troubleshooting

### Map Editor button not showing up?

1. **Check ENABLE_MAP_EDITOR**
   ```bash
   docker-compose logs play | grep ENABLE_MAP_EDITOR
   ```

2. **Check user tags in JWT**
   - Open browser DevTools
   - Network tab → look for `/openid-callback`
   - The response should contain the JWT token with your tags

3. **Check docker-compose override**
   - File: `docker-compose.override.yml`
   - May be overriding your `.env` settings

4. **Restart containers**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### JWT Token Inspection

To verify your JWT token contains the correct tags:

1. Go to https://jwt.io/
2. Paste your JWT token (find it in browser storage or network requests)
3. Look for the `tags` claim in the decoded payload

## Related Files

- `.env` - Configuration file
- `docker-compose.yaml` - May override .env settings
- `docker-compose.override.yml` - Local overrides
- `play/src/pusher/services/LocalAdmin.ts` - Access control logic
- `workadventure-auth/backend/src/users/users.service.ts` - Tag management
- `docs/others/self-hosting/self-hosted-access.md` - Official WorkAdventure documentation

## See Also

- [WorkAdventure Map Editor Documentation](https://docs.workadventure.dev/admin/manage-maps/using-the-map-editor)
- [DOCUMENTACAO_AUTENTICACAO.md](./DOCUMENTACAO_AUTENTICACAO.md) - Custom authentication system
