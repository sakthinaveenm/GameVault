# Database Schema Specification

## 1. Overview
Universal Game Hub uses SQLite with SQLx migrations for local-first, offline storage. All data is structured with foreign key constraints, explicit indexing, and profile isolation.

## 2. Entity Relationship Diagram

```
+--------------------+       +----------------------+       +----------------------+
|    UserProfiles    | 1---* |  SaveConfigurations  | 1---* |    SaveSnapshots     |
+--------------------+       +----------------------+       +----------------------+
| id (TEXT PK)       |       | id (TEXT PK)         |       | id (TEXT PK)         |
| display_name (TEXT)|       | profile_id (FK)      |       | profile_id (FK)      |
| avatar_path (TEXT) |       | game_id (FK)         |       | game_id (FK)         |
| is_default (INT)   |       | save_path (TEXT)     |       | snapshot_hash (TEXT) |
| created_at (DATET) |       | platform (TEXT)      |       | compressed_size (INT)|
+--------------------+       +----------------------+       +----------------------+
         | 1                            | 1                            | 1
         |                              |                              |
         | *                            | *                            | *
+--------------------+       +----------------------+       +----------------------+
|   ProfileSettings  |       |        Games         |       |      SaveFiles       |
+--------------------+       +----------------------+       +----------------------+
| id (TEXT PK)       |       | id (TEXT PK)         |       | id (TEXT PK)         |
| profile_id (FK)    |       | title (TEXT)         |       | snapshot_id (FK)     |
| setting_key (TEXT) |       | source (TEXT)        |       | relative_path (TEXT) |
| setting_val (TEXT) |       | executable_path(TEXT)|       | file_hash (TEXT)     |
+--------------------+       | banner_url (TEXT)    |       | file_size (INT)      |
                             +----------------------+       +----------------------+
```

## 3. Core Tables

### 3.1 `UserProfiles`
- `id` TEXT PRIMARY KEY (UUID v4)
- `display_name` TEXT NOT NULL
- `avatar_path` TEXT
- `is_default` INTEGER NOT NULL DEFAULT 0
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 3.2 `Games`
- `id` TEXT PRIMARY KEY
- `title` TEXT NOT NULL
- `sort_title` TEXT
- `summary` TEXT
- `developer` TEXT
- `publisher` TEXT
- `release_date` TEXT
- `source` TEXT NOT NULL -- 'steam', 'epic', 'gog', 'local', 'retro', 'batocera'
- `platform` TEXT NOT NULL -- 'windows', 'macos', 'linux', 'snes', 'ps2', etc.
- `store_id` TEXT
- `executable_path` TEXT
- `launch_arguments` TEXT
- `working_directory` TEXT
- `cover_url` TEXT
- `banner_url` TEXT
- `icon_url` TEXT
- `installed` INTEGER NOT NULL DEFAULT 1
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 3.3 `ProfileGameData`
- `profile_id` TEXT NOT NULL REFERENCES UserProfiles(id) ON DELETE CASCADE
- `game_id` TEXT NOT NULL REFERENCES Games(id) ON DELETE CASCADE
- `is_favorite` INTEGER NOT NULL DEFAULT 0
- `playtime_minutes` INTEGER NOT NULL DEFAULT 0
- `last_played_at` DATETIME
- `custom_category` TEXT
- PRIMARY KEY (profile_id, game_id)

### 3.4 `SaveConfigurations`
- `id` TEXT PRIMARY KEY
- `profile_id` TEXT NOT NULL REFERENCES UserProfiles(id) ON DELETE CASCADE
- `game_id` TEXT NOT NULL REFERENCES Games(id) ON DELETE CASCADE
- `save_path` TEXT NOT NULL
- `platform` TEXT NOT NULL
- `enabled` INTEGER NOT NULL DEFAULT 1
- `backup_delay_seconds` INTEGER NOT NULL DEFAULT 5
- `file_patterns` TEXT -- JSON array of glob patterns

### 3.5 `SaveSnapshots`
- `id` TEXT PRIMARY KEY
- `profile_id` TEXT NOT NULL REFERENCES UserProfiles(id) ON DELETE CASCADE
- `game_id` TEXT NOT NULL REFERENCES Games(id) ON DELETE CASCADE
- `device_id` TEXT NOT NULL
- `snapshot_hash` TEXT NOT NULL
- `archive_path` TEXT NOT NULL
- `compressed_size` INTEGER NOT NULL
- `cloud_status` TEXT NOT NULL DEFAULT 'local_only' -- 'synced', 'pending_upload', 'conflict'
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 3.6 `SaveFiles`
- `id` TEXT PRIMARY KEY
- `snapshot_id` TEXT NOT NULL REFERENCES SaveSnapshots(id) ON DELETE CASCADE
- `relative_path` TEXT NOT NULL
- `file_hash` TEXT NOT NULL
- `file_size` INTEGER NOT NULL

### 3.7 `SyncConflicts`
- `id` TEXT PRIMARY KEY
- `profile_id` TEXT NOT NULL REFERENCES UserProfiles(id) ON DELETE CASCADE
- `game_id` TEXT NOT NULL REFERENCES Games(id) ON DELETE CASCADE
- `local_snapshot_id` TEXT NOT NULL REFERENCES SaveSnapshots(id)
- `cloud_snapshot_id` TEXT NOT NULL
- `status` TEXT NOT NULL DEFAULT 'pending' -- 'resolved', 'ignored'
- `detected_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `resolved_at` DATETIME

### 3.8 `Emulators`
- `id` TEXT PRIMARY KEY
- `name` TEXT NOT NULL -- 'RetroArch', 'Dolphin', etc.
- `executable_path` TEXT NOT NULL
- `system_id` TEXT NOT NULL
- `supported_extensions` TEXT NOT NULL -- JSON array e.g. ["iso", "cue", "chd"]
- `default_arguments` TEXT

### 3.9 `Downloads`
- `id` TEXT PRIMARY KEY
- `title` TEXT NOT NULL
- `source_url` TEXT NOT NULL
- `destination_path` TEXT NOT NULL
- `total_bytes` INTEGER NOT NULL DEFAULT 0
- `downloaded_bytes` INTEGER NOT NULL DEFAULT 0
- `status` TEXT NOT NULL DEFAULT 'queued' -- 'downloading', 'paused', 'completed', 'failed'
- `checksum` TEXT
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

