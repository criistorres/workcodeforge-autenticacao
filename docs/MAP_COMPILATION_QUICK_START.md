# Map Compilation - Quick Start Guide

## TL;DR - For filial1 and filial2

### Generate WAM files (Auto-compilation)

```bash
cd /Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao/maps/mapas

# Create ZIP
zip -r maps_upload.zip filial1.tmj filial2.tmj assets/

# Upload (triggers auto-compilation)
curl -X POST \
  -F "file=@maps_upload.zip" \
  http://map-storage.workadventure.localhost/upload \
  --basic -u john.doe:password

# Verify (should return 200 OK)
# Result: filial1.wam and filial2.wam are created automatically
```

---

## How It Works

### 1. Upload Process

```
ZIP with TMJ files
        ↓
UploadController validates TMJ
        ↓
For each TMJ without .wam:
  - Read TMJ properties
  - Create WAM structure
  - Write .wam file
        ↓
Files stored in map-storage
        ↓
Cache updated
        ↓
Back service notified (gRPC)
        ↓
Game rooms reload maps
```

### 2. Key Code (UploadController.ts)

**Lines 214-217**: For each TMJ without matching WAM:
```typescript
if (path.extname(key) === ".tmj") {
  if (!wamFilesNames.includes(path.parse(zipEntry.path).name)) {
    promises.push(this.createWAMFileIfMissing(key, zipEntry, zipDirectory));
  }
}
```

**Lines 490-508**: Create WAM if missing:
```typescript
private async createWAMFileIfMissing(
  tmjKey: string,
  zipEntry: unzipper.File,
  zip: unzipper.CentralDirectory
): Promise<void> {
  const wamPath = tmjKey.slice().replace(".tmj", ".wam");
  if (!(await this.fileSystem.exist(wamPath))) {
    const tmjString = await zipEntry.buffer().toString("utf-8");
    const tmjContent = JSON.parse(tmjString);
    await this.fileSystem.writeStringAsFile(
      wamPath,
      JSON.stringify(
        await this.getFreshWAMFileContent(
          `./${path.basename(tmjKey)}`,
          tmjContent
        ),
        null,
        4
      )
    );
  }
}
```

**Lines 510-569**: Generate WAM content:
```typescript
private async getFreshWAMFileContent(
  tmjFilePath: string,
  tmjContent: ITiledMap
): Promise<WAMFileFormat> {
  // Extract metadata from TMJ properties
  const name = tmjContent.properties?.find(p => p.name === 'mapName')?.value;
  const description = tmjContent.properties?.find(p => p.name === 'mapDescription')?.value;
  const thumbnail = tmjContent.properties?.find(p => p.name === 'mapImage')?.value;
  const copyright = tmjContent.properties?.find(p => p.name === 'mapCopyright')?.value;

  // Create WAM structure
  const wamFile: WAMFileFormat = {
    version: wamFileMigration.getLatestVersion(),
    mapUrl: tmjFilePath,
    areas: [],
    entities: {},
    entityCollections: [
      { url: "http://...", type: "file" }
    ],
    metadata: { name, description, thumbnail, copyright }
  };

  return wamFile;
}
```

---

## All 4 Methods to Recompile Maps

### Method 1: Re-upload ZIP (Recommended)

```bash
curl -X POST \
  -F "file=@maps.zip" \
  http://map-storage.workadventure.localhost/upload \
  --basic -u john.doe:password
```

**Pros**: Simple, updates cache automatically
**Cons**: Need to delete existing WAMs first

### Method 2: Update Individual TMJ

```bash
# Delete old WAM
curl -X DELETE \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u john.doe:password

# Upload new TMJ (WAM auto-created)
curl -X PUT \
  -F "file=@filial1.tmj" \
  http://map-storage.workadventure.localhost/filial1.tmj \
  --basic -u john.doe:password
```

**Pros**: Individual file updates
**Cons**: Need separate requests for each file

### Method 3: Direct WAM Upload

```bash
curl -X PUT \
  -F "file=@filial1.wam" \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u john.doe:password
```

**Pros**: Upload pre-compiled WAM
**Cons**: Must create WAM yourself

### Method 4: Patch WAM Metadata

```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '[
    {"op": "replace", "path": "/metadata/name", "value": "New Name"},
    {"op": "replace", "path": "/metadata/description", "value": "Description"}
  ]' \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u john.doe:password
```

**Pros**: Update metadata without re-uploading
**Cons**: Only for metadata, not geometry

---

## File Structure

### Input: TMJ (Tiled Map JSON)

```
filial1.tmj
├── tiledversion
├── width, height
├── tilewidth, tileheight
├── properties (mapName, mapDescription, etc.)
├── layers (tile data, object data)
├── tilesets (references to .tsx or embedded)
└── custom properties...
```

### Output: WAM (WorkAdventure Map)

```
filial1.wam
├── version: "1.0.0"
├── mapUrl: "./filial1.tmj"  ← Points to TMJ file
├── areas: []                ← Collaborative areas
├── entities: {}             ← Interactive objects
├── entityCollections: [...]
├── metadata:
│   ├── name
│   ├── description
│   ├── thumbnail
│   └── copyright
└── settings (optional)
```

---

## Current Status

### What Exists

```
filial1.tmj         ✓ (91KB)
filial2.tmj         ✓ (91KB)
assets/             ✓ (tilesets, images)
```

### What's Missing

```
filial1.wam         ✗ (needs generation)
filial2.wam         ✗ (needs generation)
```

### After Upload

```
filial1.tmj         ✓ (unchanged)
filial1.wam         ✓ (auto-created)
filial2.tmj         ✓ (unchanged)
filial2.wam         ✓ (auto-created)
assets/             ✓ (unchanged)
```

---

## Important Points

### Auto-Generation Rules

1. **Only creates WAM if it doesn't exist**
   ```typescript
   if (!(await fileSystem.exist(wamPath))) {
     // Create new WAM
   }
   ```
   If WAM already exists, uploading won't overwrite it.

2. **Extracts metadata from TMJ properties**
   ```json
   {
     "name": "mapName",
     "type": "string",
     "value": "My Map"
   }
   ```
   Add these properties in Tiled editor to customize.

3. **WAM is metadata wrapper, not geometry**
   - WAM points to TMJ via `mapUrl: "./filial1.tmj"`
   - Game still loads geometry from TMJ
   - WAM adds interactive layers on top

### No Manual Compilation Needed

```
❌ NO npm run build:maps
❌ NO npm run compile:maps
❌ NO /api/compile endpoint
❌ NO CLI tool

✅ YES: Upload TMJ → Auto-compile to WAM
```

---

## Endpoints (HTTP)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/upload` | YES | Upload ZIP with maps |
| PUT | `/{file}` | YES | Upload single file |
| PATCH | `/{file}.wam` | YES | Patch WAM with JSON |
| DELETE | `/{file}` | YES | Delete file |
| GET | `/maps` | NO | List maps |
| GET | `/download` | YES | Download as ZIP |

---

## Authentication

```bash
# Basic Auth
curl -X POST \
  -F "file=@maps.zip" \
  http://map-storage.workadventure.localhost/upload \
  --basic -u john.doe:password
```

**Credentials** (from environment):
- Username: `john.doe`
- Password: `password`
- Method: HTTP Basic Authentication

---

## Environment Variables

```bash
# For map-storage Docker container

STORAGE_DIRECTORY=/maps
# Where maps are stored on disk or S3

ENTITY_COLLECTION_URLS=http://play.workadventure.localhost/collections/FurnitureCollection.json
# Default entities for new WAM files

WAM_TEMPLATE_URL=
# Optional: base WAM template to use instead of defaults

MAX_UNCOMPRESSED_SIZE=104857600
# Max upload size (100MB)

ENABLE_BASIC_AUTHENTICATION=true
AUTHENTICATION_USER=john.doe
AUTHENTICATION_PASSWORD=password
```

---

## Services Involved

```
┌─────────────────┐
│ Map Storage     │  HTTP: Upload/Download
│ (port 3000)     │  gRPC: Notify Back service
└────────┬────────┘
         │
    ┌────┴─────────┐
    ↓              ↓
┌────────┐    ┌──────────┐
│ Disk   │    │ S3       │
│ /maps  │    │ Storage  │
└────────┘    └──────────┘
         │
         ↓
┌──────────────┐
│ Back Service │  (gRPC)
│ Room Manager │
└──────────────┘
         │
         ↓
┌──────────────┐
│ Game Rooms   │
│ Reload Maps  │
└──────────────┘
```

---

## Troubleshooting

### Maps not loading?
1. Check filial1.wam and filial2.wam exist
2. Verify mapUrl points to correct TMJ file
3. Check assets directory has all tilesets

### WAM file not created?
1. Check upload returned 200 OK
2. Verify TMJ file is valid format
3. Check all referenced images exist
4. Look at map-storage logs: `docker-compose logs map-storage`

### Upload fails?
1. Verify auth credentials (john.doe/password)
2. Check map-storage service is running
3. Verify ZIP file is not encrypted
4. Check file size < 100MB uncompressed

---

## References

### Documentation
- `/docs/MAP_COMPILATION_GUIDE.md` - Complete guide
- `/docs/MAP_STORAGE_TECHNICAL_SUMMARY.md` - Technical details
- `/map-storage/README.md` - API docs

### Code
- `/map-storage/src/Upload/UploadController.ts` - Main logic
- Lines 490-508: `createWAMFileIfMissing()`
- Lines 510-569: `getFreshWAMFileContent()`

### External
- `@workadventure/map-editor` - WAMFileFormat class
- `@workadventure/tiled-map-type-guard` - ITiledMap interface

---

**Quick Start**: Upload ZIP with filial1.tmj and filial2.tmj → WAM files auto-generated
**Status**: Ready to compile filial1 and filial2
**Updated**: 2025-10-27
