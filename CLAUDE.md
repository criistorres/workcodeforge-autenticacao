# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **WorkAdventure** fork customized as **WorkCodeForge** with a custom authentication system. WorkAdventure is a platform for building collaborative virtual worlds (metaverse) with video chat, fully customizable maps, and OpenID Connect authentication.

**Key Customization**: Replaced the default OIDC mock server with a custom NestJS + Svelte authentication service located in `workadventure-auth/`.

## Architecture

### Monorepo Structure (Workspaces)

This is a **monorepo** using npm workspaces. The main workspaces are:
- `play/` - Frontend Svelte app + Pusher backend (WebSocket/HTTP server)
- `back/` - Backend gRPC service (Room management, game logic)
- `map-storage/` - Map storage and editing service
- `uploader/` - File upload service
- `messages/` - Protocol Buffers definitions (shared across services)
- `libs/*` - Shared libraries
- `workadventure-auth/` - Custom authentication service (NestJS + Svelte)

### Custom Authentication System

Located in `workadventure-auth/`:
- `backend/` - NestJS OpenID Connect provider with JWT (RSA256)
- `frontend/` - Svelte login/registration interface

See `DOCUMENTACAO_AUTENTICACAO.md` for complete authentication documentation.

## Development Commands

### Initial Setup

```bash
# Copy environment template
cp .env.template .env

# Start all services with Docker Compose
docker-compose up

# Start without OIDC (anonymous access)
docker-compose -f docker-compose.yaml -f docker-compose-no-oidc.yaml up
```

### Development Workflow

**Frontend (Play):**
```bash
cd play
npm run dev           # Dev mode with hot reload (Vite + Pusher)
npm run build         # Production build
npm run typecheck     # TypeScript type checking
npm run svelte-check  # Svelte component validation
npm run test          # Run tests with Vitest
```

**Backend:**
```bash
cd back
npm run dev           # Dev mode with tsx watch
npm run typecheck     # TypeScript validation
npm run test          # Run tests
```

**Map Storage:**
```bash
cd map-storage
npm run start:dev     # Dev mode
```

**Custom Auth Service:**
```bash
cd workadventure-auth/backend
npm run dev           # NestJS dev mode

cd workadventure-auth/frontend
npm run dev           # Svelte dev mode
```

### Docker Commands

```bash
# Build and start everything
docker-compose up --build

# View logs
docker-compose logs -f play
docker-compose logs -f auth-backend
docker-compose logs -f back

# Restart specific service
docker-compose restart play

# Stop all
docker-compose down
```

### Linting and Formatting

```bash
# In play/ or back/
npm run lint          # Run ESLint
npm run lint-fix      # Auto-fix issues
npm run pretty        # Format with Prettier
npm run pretty-check  # Check formatting
```

### Testing

```bash
# Run tests
npm run test

# With coverage
npm run test:coverage
```

## Important Configuration Files

### Environment Variables

**Main `.env`** (WorkAdventure config):
- `OPENID_CLIENT_ID` - Must match auth service
- `OPENID_CLIENT_SECRET` - Must match auth service
- `OPENID_CLIENT_ISSUER` - Auth service URL (http://auth.workadventure.localhost)
- `DISABLE_ANONYMOUS` - Set to `true` to force authentication

**`workadventure-auth/backend/.env`**:
- `WORKADVENTURE_CLIENT_ID` - Must match main .env
- `WORKADVENTURE_CLIENT_SECRET` - Must match main .env
- `ISSUER_URL` - Auth service public URL
- `ALLOWED_REDIRECT_URIS` - Comma-separated callback URLs

### Docker Compose

- `docker-compose.yaml` - Base configuration
- `docker-compose.override.yml` - Local overrides (enables custom auth, disables mock OIDC)
- `docker-compose-no-oidc.yaml` - Anonymous mode
- `docker-compose.livekit.yaml` - LiveKit integration

### RSA Keys for JWT

Located in `workadventure-auth/backend/keys/`:
```bash
# Generate if missing
cd workadventure-auth/backend
mkdir -p keys
openssl genrsa -out keys/private.key 2048
openssl rsa -in keys/private.key -pubout -out keys/public.key
```

## Key Technical Details

### Play Service (Frontend + Pusher)

**Frontend (Phaser + Svelte)**:
- Entry point: `play/src/front/` (Phaser game) + `play/src/pusher/` (WebSocket server)
- Game engine: Phaser 3.86.0
- UI Framework: Svelte 3.x
- Build tool: Vite 4.x
- TypeScript with strict mode

**Pusher (Backend)**:
- WebSocket server using `uWebSockets.js`
- HTTP server with Express 5.x
- OpenID Connect client (`openid-client` package)
- Located in `play/src/pusher/`

### Back Service (gRPC)

- gRPC service definitions in `messages/`
- Room management and game state
- Redis for state storage
- Located in `back/src/`

### Protocol Buffers

- Definitions: `messages/protos/`
- Auto-generated TypeScript: Shared across services
- Watch mode: `npm run proto:watch` in `messages/`

### Authentication Flow

1. User visits `http://play.workadventure.localhost`
2. Redirect to `/authorize` endpoint (auth service)
3. Login page at `http://auth.workadventure.localhost/login`
4. After successful login, authorization code returned
5. Play service exchanges code for JWT tokens
6. User authenticated with `id_token` containing claims (email, name, tags/roles)

See `DOCUMENTACAO_AUTENTICACAO.md` section "Fluxo de Autentica��o" for detailed flow.

### Test Users (Custom Auth)

Default test users (in-memory):
- Email: `user1@example.com` / Password: `pwd` / Tags: `["admin", "moderator"]`
- Email: `user2@example.com` / Password: `pwd` / Tags: `["member"]`
- Email: `admin@example.com` / Password: `pwd` / Tags: `["admin", "moderator"]`

## Admin Panel Development

**Status**: Planning phase. See `ADMIN_PANEL_DEV.md` for:
- Database schema (PostgreSQL + TypeORM)
- RBAC (Role-Based Access Control) system
- Audit logging
- Planned API endpoints
- Development phases

**Key Features Planned**:
- User management (CRUD, block/unblock)
- Role and permission management
- Audit logs
- Dashboard with statistics
- Session management

## Local Development URLs

- Play (main app): http://play.workadventure.localhost
- Auth service: http://auth.workadventure.localhost
- Maps: http://maps.workadventure.localhost
- Map Storage: http://map-storage.workadventure.localhost
- Traefik dashboard: http://traefik.workadventure.localhost
- Matrix (chat): http://matrix.workadventure.localhost

**Note**: Add these to `/etc/hosts`:
```
127.0.0.1 play.workadventure.localhost auth.workadventure.localhost maps.workadventure.localhost matrix.workadventure.localhost traefik.workadventure.localhost map-storage.workadventure.localhost uploader.workadventure.localhost
```

## Common Issues

### CORS Errors
Ensure `CORS_ORIGIN` in `workadventure-auth/backend/.env` matches Play URL:
```
CORS_ORIGIN=http://play.workadventure.localhost
```

### Client ID/Secret Mismatch
Both `.env` (main) and `workadventure-auth/backend/.env` must have matching:
```
OPENID_CLIENT_ID=workadventure-local
OPENID_CLIENT_SECRET=my-super-secret-key-for-local-dev
```

### Missing RSA Keys
JWT signing fails if keys don't exist. Generate with:
```bash
cd workadventure-auth/backend
openssl genrsa -out keys/private.key 2048
openssl rsa -in keys/private.key -pubout -out keys/public.key
```

### Port Already in Use
Check with `lsof -i :3000` (or relevant port) and kill process or change port in docker-compose.

## Project-Specific Notes

### Renaming from WorkAdventure to WorkCodeForge
There's a planned renaming task (see `RENAMING_CHECKLIST.md` and `ADMIN_PANEL_DEV.md`). When making changes:
- Use "WorkCodeForge" for new branding/docs
- Maintain "WorkAdventure" for technical identifiers until full migration

### Translations (i18n)
- TypeSafe i18n system in `play/src/i18n/`
- Generate translations: `npm run typesafe-i18n` in `play/`
- Watch mode: `npm run typesafe-i18n-watch`

### Map Editor
Map editing functionality in `play/` using `@workadventure/map-editor` package.
Enable with: `ENABLE_MAP_EDITOR=true` in `.env`

## Additional Documentation

- `README.md` - General project overview
- `DOCUMENTACAO_AUTENTICACAO.md` - Complete authentication system documentation (Portuguese)
- `ADMIN_PANEL_DEV.md` - Admin panel development plan
- `TESTING_GUIDE.md` - Testing guidelines
- `CONTRIBUTING.md` - Contribution guidelines
- `SAAS_ROADMAP.md` - SaaS features roadmap


Sempre que uma tarefa for finalizada e validada, crie um arquivo em docs/ com o nome da tarefa e um resumo do que foi feito, para documentacao.