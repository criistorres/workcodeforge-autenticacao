# Map Compilation Guide: TMJ to WAM Conversion

## Overview

WorkCodeForge uses two map file formats:
- **TMJ** (Tiled Map JSON): Human-readable map files created by Tiled map editor
- **WAM** (WorkAdventure Map): Compiled/optimized binary format used by the game engine

The map-storage service automatically compiles TMJ files into WAM files during upload.

---

## Architecture

### Map Processing Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Upload Process                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User uploads ZIP file with TMJ/WAM files to /upload endpoint   │
│                                                                     │
│  2. UploadController processes the ZIP:                            │
│     - Validates TMJ files using MapValidator                       │
│     - Checks for missing assets/tilesets                           │
│     - Validates existing WAM files                                 │
│                                                                     │
│  3. For each TMJ file without corresponding WAM:                   │
│     - Reads TMJ content (ITiledMap)                                │
│     - Extracts metadata (mapName, description, image, copyright)   │
│     - Calls getFreshWAMFileContent() to generate WAM               │
│     - Creates .wam file alongside .tmj                             │
│                                                                     │
│  4. All files stored in map-storage filesystem (disk or S3)        │
│                                                                     │
│  5. Cache updated via MapListService                               │
│     - Generates cached file list                                   │
│     - Updates WAM file metadata in cache                           │
│                                                                     │
│  6. Upload detector notifies Back service                          │
│     - Sends handleMapStorageUploadMapDetected() via gRPC           │
│     - Active game rooms reload the map                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. UploadController (`src/Upload/UploadController.ts`)
- **POST /upload**: Main endpoint for uploading map ZIPs
- **PUT /{*splat}**: Update individual files (TMJ or WAM)
- **PATCH /{*splat}**: Patch WAM files using JSON Patch notation
- **DELETE /{*splat}**: Delete files
- **GET /maps**: List maps (no authentication required)
- **GET /download**: Download maps as ZIP

#### 2. WAM File Generation
```typescript
// From: getFreshWAMFileContent() in UploadController.ts
async getFreshWAMFileContent(tmjFilePath: string, tmjContent: ITiledMap): Promise<WAMFileFormat> {
  // 1. Extract metadata from TMJ custom properties
  const name = tmjContent.properties?.find(p => p.name === 'mapName')?.value
  const description = tmjContent.properties?.find(p => p.name === 'mapDescription')?.value
  const thumbnail = tmjContent.properties?.find(p => p.name === 'mapImage')?.value
  const copyright = tmjContent.properties?.find(p => p.name === 'mapCopyright')?.value
  
  // 2. Create WAM structure
  const wamFile: WAMFileFormat = {
    version: '1.0.0',
    mapUrl: tmjFilePath,  // Reference to the TMJ file
    areas: [],            // Empty by default, can be edited
    entities: {},         // Empty by default, can be edited
    entityCollections: [  // List of entity definitions
      { url: "...", type: "file" }
    ],
    metadata: {
      name,
      description,
      thumbnail,
      copyright
    }
  }
  
  return wamFile
}
```

#### 3. MapValidator (`@workadventure/map-editor`)
- Validates TMJ/JSON format
- Checks for missing images/tilesets
- Uses ZipFileFetcher for ZIP archives
- Uses HttpFileFetcher for remote URLs

#### 4. WAMFileFormat (`@workadventure/map-editor`)
- Zod schema for validating WAM structure
- Automatic migration to latest WAM version
- Stores map metadata, areas, entities, and settings

#### 5. MapsManager (`src/MapsManager.ts`)
- Keeps compiled maps in memory during editing
- Auto-saves WAM files every 15 seconds
- Tracks edit commands for collaborative editing
- Clears cache when maps are uploaded

---

## TMJ to WAM Compilation Process

### Step 1: Upload TMJ File

When you upload a ZIP containing TMJ files:

```bash
# Create a ZIP with your map files
zip -r maps.zip filial1.tmj assets/

# Upload to map-storage
curl -X POST \
  -F "file=@maps.zip" \
  http://map-storage.workadventure.localhost/upload \
  --basic -u username:password
```

### Step 2: Validation

The UploadController validates:
1. **File format**: Must be .tmj (not .json)
2. **Map structure**: Valid Tiled format
3. **Assets**: All referenced tilesets/images exist
4. **Size limits**: Uncompressed size < MAX_UNCOMPRESSED_SIZE

### Step 3: WAM Generation

For each TMJ without a matching WAM:

```typescript
// In createWAMFileIfMissing()
const wamPath = tmjKey.replace(".tmj", ".wam")

if (!fileExists(wamPath)) {
  // Generate new WAM from TMJ
  const wamContent = await getFreshWAMFileContent(
    "./filial1.tmj",
    parsedTmjContent
  )
  
  // Write WAM file
  fileSystem.write(wamPath, JSON.stringify(wamContent))
}
```

### Step 4: Storage

Files stored in map-storage directory:
```
/maps/mapas/
├── filial1.tmj
├── filial1.wam        ← Auto-generated
├── filial2.tmj
├── filial2.wam        ← Auto-generated
└── assets/
    ├── tileset.png
    └── ...
```

### Step 5: Cache Update

MapListService generates a cache file:
```typescript
await mapListService.generateCacheFile(hostname)
// Creates cached list of all maps and WAM metadata
```

### Step 6: Notification

UploadDetector notifies Back service via gRPC:
```typescript
uploadDetector.refresh(wamUrl)
// Calls: handleMapStorageUploadMapDetected() on Back service
// Result: Active game rooms reload the updated map
```

---

## How to Force Recompilation of Maps

### Scenario: You need to recompile filial1.wam and filial2.wam

### Option 1: Re-upload via HTTP (Recommended)

**Delete existing WAM files first, then upload TMJ files:**

```bash
# 1. Delete old WAM files
curl -X DELETE \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u username:password

curl -X DELETE \
  http://map-storage.workadventure.localhost/filial2.wam \
  --basic -u username:password

# 2. Create ZIP with only TMJ files (no WAM files)
cd /Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao/maps/mapas
zip -r maps.zip filial1.tmj filial2.tmj assets/

# 3. Upload ZIP (this will auto-generate WAM files)
curl -X POST \
  -F "file=@maps.zip" \
  http://map-storage.workadventure.localhost/upload \
  --basic -u username:password
```

### Option 2: Update Individual TMJ File

If you only modified filial1.tmj:

```bash
# Delete corresponding WAM to force regeneration
curl -X DELETE \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u username:password

# Upload updated TMJ file
curl -X PUT \
  -F "file=@filial1.tmj" \
  http://map-storage.workadventure.localhost/filial1.tmj \
  --basic -u username:password
```

### Option 3: Direct WAM File Upload

If you have a pre-compiled WAM file:

```bash
curl -X PUT \
  -F "file=@filial1.wam" \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u username:password
```

### Option 4: Patch WAM Metadata

Update WAM file properties using JSON Patch notation:

```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '[
    { "op": "replace", "path": "/metadata/name", "value": "New Map Name" },
    { "op": "replace", "path": "/metadata/description", "value": "New Description" }
  ]' \
  http://map-storage.workadventure.localhost/filial1.wam \
  --basic -u username:password
```

---

## File Formats

### TMJ File Structure (Tiled JSON)

```json
{
  "tiledversion": "1.8.0",
  "type": "map",
  "version": "1.8",
  "width": 100,
  "height": 100,
  "tilewidth": 32,
  "tileheight": 32,
  "properties": [
    { "name": "mapName", "type": "string", "value": "My Map" },
    { "name": "mapDescription", "type": "string", "value": "Description" },
    { "name": "mapImage", "type": "string", "value": "thumbnail.png" },
    { "name": "mapCopyright", "type": "string", "value": "Copyright info" }
  ],
  "layers": [...],
  "tilesets": [...]
}
```

### WAM File Structure (Compiled Format)

```json
{
  "version": "1.0.0",
  "mapUrl": "./filial1.tmj",
  "areas": [
    {
      "id": "area1",
      "name": "Conference Room",
      "x": 10,
      "y": 10,
      "width": 20,
      "height": 20,
      "properties": []
    }
  ],
  "entities": {},
  "entityCollections": [
    {
      "url": "http://play.workadventure.localhost/collections/FurnitureCollection.json",
      "type": "file"
    }
  ],
  "metadata": {
    "name": "My Map",
    "description": "Description",
    "thumbnail": "thumbnail.png",
    "copyright": "Copyright info"
  }
}
```

---

## Environment Variables (map-storage)

### Key Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `STORAGE_DIRECTORY` | Maps storage path (disk) | `/maps` |
| `ENTITY_COLLECTION_URLS` | Default entity collections | `http://...,http://...` |
| `WAM_TEMPLATE_URL` | Template for WAM generation | `http://map-storage.../template.wam` |
| `MAX_UNCOMPRESSED_SIZE` | Max upload size | `104857600` (100MB) |
| `ENABLE_BASIC_AUTHENTICATION` | Enable basic auth on /upload | `true` |
| `AUTHENTICATION_USER` | Basic auth username | `john.doe` |
| `AUTHENTICATION_PASSWORD` | Basic auth password | `password` |

---

## Current Status of filial1 and filial2

### Files in `/maps/mapas/`

```
filial1.tmj         - TMJ source file (91KB) - Last modified: Oct 27 20:47
filial1.json        - Old format (35KB) - Legacy, unused
filial2.tmj         - TMJ source file (91KB) - Last modified: Oct 27 20:47
filial2.tmj.backup  - Backup (35KB) - Not used
Arquivo.zip         - Upload archive (1.9MB)
assets/             - Tileset and image assets
```

### Missing: WAM Files

Neither `filial1.wam` nor `filial2.wam` exist in the maps directory. They need to be generated.

---

## How to Generate WAM Files for filial1 and filial2

### Quick Method: Upload via HTTP

```bash
# Navigate to maps directory
cd /Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao/maps/mapas

# Create ZIP with TMJ files
zip -r maps_upload.zip filial1.tmj filial2.tmj assets/

# Upload to map-storage (triggers WAM generation)
curl -X POST \
  -F "file=@maps_upload.zip" \
  http://map-storage.workadventure.localhost/upload \
  --basic -u john.doe:password

# Clean up
rm maps_upload.zip
```

### Expected Result

After successful upload:
- `filial1.wam` will be auto-created with mapUrl pointing to `./filial1.tmj`
- `filial2.wam` will be auto-created with mapUrl pointing to `./filial2.tmj`
- Maps will be accessible at http://map-storage.workadventure.localhost/filial1.wam

### Programmatic Method (Using map-editor library)

If you need to compile outside the upload process:

```typescript
import { WAMFileFormat } from "@workadventure/map-editor"
import { wamFileMigration } from "@workadventure/map-editor/src/Migrations/WamFileMigration"

// Read TMJ file
const tmjContent = JSON.parse(fs.readFileSync('filial1.tmj', 'utf-8'))

// Create WAM structure
const wamFile: WAMFileFormat = {
  version: wamFileMigration.getLatestVersion(),
  mapUrl: './filial1.tmj',
  areas: [],
  entities: {},
  entityCollections: [
    {
      url: "http://play.workadventure.localhost/collections/FurnitureCollection.json",
      type: "file"
    }
  ],
  metadata: {
    name: tmjContent.properties?.find(p => p.name === 'mapName')?.value,
    // ... extract other metadata
  }
}

// Write WAM file
fs.writeFileSync('filial1.wam', JSON.stringify(wamFile, null, 4))
```

---

## Troubleshooting

### WAM file not created during upload
- Check that TMJ file is valid (no missing assets)
- Verify upload returns 200 OK status
- Check map-storage logs for validation errors

### Maps not loading in game
- Verify mapUrl in WAM points to correct TMJ file
- Check that TMJ file exists in same directory
- Verify assets directory contains all referenced images

### Cannot recompile maps
- Ensure authentication credentials are correct
- Check that map-storage service is running
- Verify disk space is available

### Performance issues with large maps
- Consider splitting very large maps into multiple files
- Compress tilesets properly before upload
- Monitor map-storage memory usage

---

## References

### Code Files
- `/map-storage/src/Upload/UploadController.ts` - Upload and compilation logic
- `/map-storage/src/MapsManager.ts` - In-memory map management
- `/map-storage/README.md` - API documentation

### Environment Setup
- See `CLAUDE.md` for development setup
- Map-storage runs at http://map-storage.workadventure.localhost
- Default credentials: john.doe / password (basic auth)

---

**Last Updated**: 2025-10-27
**Status**: WAM files for filial1 and filial2 need to be generated
