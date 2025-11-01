# Map Storage: Technical Summary

## Quick Reference

### Map Compilation Overview

WorkCodeForge automatically compiles **TMJ files** (Tiled JSON) into **WAM files** (WorkAdventure Map format) when uploaded to the map-storage service.

**No manual compilation step is required** - the `UploadController` handles it automatically.

---

## Key Findings

### 1. TMJ to WAM Compilation Flow

| Stage | Component | Location | What It Does |
|-------|-----------|----------|--------------|
| **Upload** | UploadController | `/map-storage/src/Upload/UploadController.ts` | Receives ZIP with TMJ/WAM files, validates format |
| **Validation** | MapValidator | `@workadventure/map-editor` | Validates TMJ structure, checks for missing assets |
| **Generation** | getFreshWAMFileContent() | UploadController.ts:510 | Creates WAM from TMJ if not present |
| **Storage** | FileSystem (disk/S3) | `/maps/mapas/` or S3 | Stores compiled WAM alongside TMJ |
| **Cache** | MapListService | `/map-storage/src/Services/MapListService.ts` | Updates map list cache |
| **Notification** | UploadDetector | `/map-storage/src/Services/UploadDetector.ts` | Notifies Back service via gRPC |
| **Reloading** | GameRoom (Back service) | Back gRPC | Game rooms reload updated maps |

### 2. No Separate "Build" Process

- **There is NO separate build/compile command** like `npm run build:maps`
- **There is NO CLI tool** to force compilation
- **There is NO dedicated endpoint** like `/compile` or `/build`

**Compilation happens automatically during upload:**

```
User uploads ZIP with TMJ files → UploadController validates → 
WAM auto-generated if missing → Stored in filesystem → Cache updated → 
Back service notified → Game rooms reload
```

### 3. How Files Are Compiled

**Location**: `UploadController.ts` methods:
- `createWAMFileIfMissing()` (line 490-508)
- `getFreshWAMFileContent()` (line 510-569)

**Process**:
```typescript
// For each TMJ without matching WAM:
1. Check if WAM file exists (const wamPath = tmjKey.replace(".tmj", ".wam"))
2. If NOT exists, create it:
   - Read TMJ content
   - Extract metadata from TMJ properties (mapName, description, etc.)
   - Create WAM structure with version, mapUrl, areas, entities
   - Write WAM as JSON file
3. If WAM already exists, skip (don't regenerate)
```

### 4. WAM File Structure

Created by `getFreshWAMFileContent()`:

```json
{
  "version": "1.0.0",
  "mapUrl": "./filial1.tmj",              // Reference to the TMJ
  "areas": [],                              // For collaborative areas
  "entities": {},                           // For interactive objects
  "entityCollections": [...],               // Furniture, decorations, etc.
  "metadata": {
    "name": "Map Name",                     // From TMJ property mapName
    "description": "Description",           // From TMJ property mapDescription
    "thumbnail": "image.png",               // From TMJ property mapImage
    "copyright": "Copyright info"           // From TMJ property mapCopyright
  }
}
```

### 5. Available HTTP Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| **POST** | `/upload` | Upload ZIP with maps | YES |
| **PUT** | `/{file}` | Upload individual file (TMJ/WAM) | YES |
| **PATCH** | `/{file}.wam` | Patch WAM with JSON Patch | YES |
| **DELETE** | `/{file}` | Delete file | YES |
| **GET** | `/maps` | List all maps | NO |
| **GET** | `/download?directory=/` | Download as ZIP | YES |

### 6. Forcing Recompilation of filial1 and filial2

**All 4 methods to recompile:**

#### Method 1: Delete WAM + Re-upload TMJ (Best)
```bash
# 1. Delete old WAM files
curl -X DELETE \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u john.doe:password

# 2. Upload ZIP with fresh TMJ files
cd /maps/mapas
zip maps.zip filial1.tmj filial2.tmj assets/
curl -X POST -F "file=@maps.zip" \
  http://map-storage.workadventure.localhost/upload \
  --basic -u john.doe:password
```

#### Method 2: Update Individual TMJ
```bash
# Delete the WAM
curl -X DELETE \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u john.doe:password

# Upload TMJ (WAM will be auto-created)
curl -X PUT -F "file=@filial1.tmj" \
  http://map-storage.workadventure.localhost/filial1.tmj \
  --basic -u john.doe:password
```

#### Method 3: Upload Pre-compiled WAM
```bash
curl -X PUT -F "file=@filial1.wam" \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u john.doe:password
```

#### Method 4: Patch WAM Metadata
```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '[{"op": "replace", "path": "/metadata/name", "value": "New Name"}]' \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u john.doe:password
```

---

## Important Code Locations

### Main Files

| File | Purpose | Key Methods |
|------|---------|-------------|
| `/map-storage/src/Upload/UploadController.ts` | Map upload & compilation | `postUpload()`, `createWAMFileIfMissing()`, `getFreshWAMFileContent()` |
| `/map-storage/src/MapsManager.ts` | In-memory map management | `getOrLoadGameMap()`, `executeCommand()`, `loadWAMToMemory()` |
| `/map-storage/src/MapStorageServer.ts` | gRPC server for Back service | `handleEditMapCommandWithKeyMessage()` |
| `/map-storage/src/Services/UploadDetector.ts` | Notifies Back of changes | `refresh(wamUrl)` |
| `/map-storage/src/Services/MapListService.ts` | Cache management | `generateCacheFile()`, `updateWAMFileInCache()` |

### Key Imports from @workadventure/map-editor

```typescript
// Core compilation types
import { WAMFileFormat } from "@workadventure/map-editor"
import { wamFileMigration } from "@workadventure/map-editor/src/Migrations/WamFileMigration"

// Validation
import { MapValidator } from "@workadventure/map-editor/src/GameMap/MapValidator"
import { ZipFileFetcher } from "@workadventure/map-editor/src/GameMap/Validator/ZipFileFetcher"

// Type definitions
import { ITiledMap } from "@workadventure/tiled-map-type-guard"
```

---

## Current Status: filial1 and filial2

### Files Present
```
/maps/mapas/filial1.tmj    ✓ Exists (91KB, Oct 27 20:47)
/maps/mapas/filial2.tmj    ✓ Exists (91KB, Oct 27 20:47)
/maps/mapas/assets/        ✓ Exists (tilesets and images)
```

### Missing
```
/maps/mapas/filial1.wam    ✗ MISSING - Needs to be generated
/maps/mapas/filial2.wam    ✗ MISSING - Needs to be generated
```

### How They Will Be Compiled

When TMJ files are uploaded:
1. `UploadController.createWAMFileIfMissing()` will detect missing WAM files
2. It will call `getFreshWAMFileContent()` to generate them
3. WAM files will be created with:
   - `mapUrl: "./filial1.tmj"` (and filial2)
   - Empty `areas: []` (can be added later via Map Editor)
   - Empty `entities: {}`
   - Default `entityCollections` from environment variables
   - Metadata extracted from TMJ custom properties

---

## Important Concepts

### 1. WAM = Metadata Wrapper Around TMJ

WAM files don't contain map geometry - they:
- Point to the TMJ file via `mapUrl`
- Add interactive areas for gameplay
- Define entities/objects
- Store metadata (name, description, etc.)

The actual game map data remains in the TMJ file.

### 2. Auto-generation Logic

WAM files are **only created if they don't exist**:

```typescript
if (!(await fileSystem.exist(wamPath))) {
  // Generate new WAM
}
```

**If you already have a WAM file, uploading won't overwrite it** (unless you delete it first).

### 3. Cache Invalidation

When maps are uploaded, the cache is updated:

```typescript
await mapListService.generateCacheFile(req.hostname)
// Creates/updates: maps/maps-[hostname].cache.json
```

This cache file lists all available maps for fast loading.

### 4. Game Room Reloading

When maps are updated, Back service is notified:

```typescript
uploadDetector.refresh(wamUrl)
// Sends to all game rooms: "Hey, map changed!"
// Game rooms reload if map is currently loaded
```

---

## Configuration

### map-storage Environment Variables

```bash
# Storage backend (disk)
STORAGE_DIRECTORY=/maps

# Default entity collections for new WAM files
ENTITY_COLLECTION_URLS=http://play.workadventure.localhost/collections/FurnitureCollection.json,http://play.workadventure.localhost/collections/OfficeCollection.json

# Optional: Template WAM file to use as base
WAM_TEMPLATE_URL=

# Upload size limit (100MB)
MAX_UNCOMPRESSED_SIZE=104857600

# Authentication
ENABLE_BASIC_AUTHENTICATION=true
AUTHENTICATION_USER=john.doe
AUTHENTICATION_PASSWORD=password
```

### Authentication Credentials

For upload/delete operations, use:
- **Username**: john.doe
- **Password**: password
- **Method**: HTTP Basic Auth

---

## Performance Characteristics

### Map Processing

- **Validation**: Checks file format, missing assets (all in ZIP)
- **Generation**: Creates WAM instantly from TMJ properties
- **Storage**: Stores as JSON files
- **In-memory cache**: Keeps compiled maps in RAM during editing
- **Auto-save**: Saves WAM every 15 seconds if changed

### Limits

- **Max uncompressed size**: 100MB (configurable)
- **Max file size per upload**: Same as uncompressed limit
- **Concurrent uploads**: Serialized per directory (p-limit)

---

## Troubleshooting Commands

### Check if service is running
```bash
curl http://map-storage.workadventure.localhost/maps
```

### Upload test ZIP (npm command in map-storage)
```bash
cd /map-storage
npm run upload-test-map
# Uses tests/assets/assets/ directory
```

### Check Docker logs
```bash
docker-compose logs -f map-storage
```

### Validate TMJ file before upload
```bash
# The UploadController validates using MapValidator
# Returns detailed error messages if validation fails
# Example: "Image of the tileset 'XXX': 'xxx.png' is not loadable."
```

---

## Related Services

### Back Service (gRPC)
- Receives `handleMapStorageUploadMapDetected()` notifications
- Manages game rooms and loaded maps
- Routes map edit commands to map-storage

### Play Service (Frontend)
- Loads maps from map-storage
- Displays game world
- Sends user actions to Back service

### Map Storage Service
- Stores maps and assets
- Compiles TMJ → WAM
- Provides HTTP API and gRPC interface
- Manages cache

---

## References

### Complete Guide
See `/docs/MAP_COMPILATION_GUIDE.md` for detailed walkthrough

### Source Code
- `/map-storage/README.md` - API documentation
- `/map-storage/src/Upload/UploadController.ts` - Implementation
- `/map-storage/src/index.ts` - Service startup

### External Dependencies
- `@workadventure/map-editor` - Provides WAMFileFormat, MapValidator
- `@workadventure/tiled-map-type-guard` - ITiledMap type definitions
- `@workadventure/messages` - gRPC protobuf definitions

---

**Created**: 2025-10-27
**For**: WorkCodeForge Map Storage System
**Status**: Complete - Ready for map compilation
