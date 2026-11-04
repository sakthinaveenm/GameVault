-- 0001_initial_schema.sql
-- Universal Game Hub Initial SQLite Schema

PRAGMA foreign_keys = ON;

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY NOT NULL,
    display_name TEXT NOT NULL,
    avatar_path TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Profile Settings
CREATE TABLE IF NOT EXISTS profile_settings (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    UNIQUE(profile_id, setting_key)
);

-- Linked Accounts (e.g. Google OAuth)
CREATE TABLE IF NOT EXISTS linked_accounts (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    email TEXT NOT NULL,
    linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_authenticated_at DATETIME,
    UNIQUE(profile_id, provider)
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    operating_system TEXT NOT NULL,
    last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Games
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    sort_title TEXT,
    summary TEXT,
    developer TEXT,
    publisher TEXT,
    release_date TEXT,
    source TEXT NOT NULL, -- 'steam', 'epic', 'gog', 'local', 'retro', 'batocera'
    platform TEXT NOT NULL,
    store_id TEXT,
    executable_path TEXT,
    launch_arguments TEXT,
    working_directory TEXT,
    cover_url TEXT,
    banner_url TEXT,
    icon_url TEXT,
    installed INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Profile Game Data (isolates favorites, playtime, custom categories per profile)
CREATE TABLE IF NOT EXISTS profile_game_data (
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    playtime_minutes INTEGER NOT NULL DEFAULT 0,
    last_played_at DATETIME,
    custom_category TEXT,
    PRIMARY KEY (profile_id, game_id)
);

-- Emulators
CREATE TABLE IF NOT EXISTS emulators (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    executable_path TEXT NOT NULL,
    system_id TEXT NOT NULL,
    supported_extensions TEXT NOT NULL, -- JSON array
    default_arguments TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Save Configurations
CREATE TABLE IF NOT EXISTS save_configurations (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    save_path TEXT NOT NULL,
    platform TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    backup_delay_seconds INTEGER NOT NULL DEFAULT 5,
    file_patterns TEXT, -- JSON array
    UNIQUE(profile_id, game_id, save_path)
);

-- Save Snapshots
CREATE TABLE IF NOT EXISTS save_snapshots (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    snapshot_hash TEXT NOT NULL,
    archive_path TEXT NOT NULL,
    compressed_size INTEGER NOT NULL,
    cloud_status TEXT NOT NULL DEFAULT 'local_only',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Save Files
CREATE TABLE IF NOT EXISTS save_files (
    id TEXT PRIMARY KEY NOT NULL,
    snapshot_id TEXT NOT NULL REFERENCES save_snapshots(id) ON DELETE CASCADE,
    relative_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    file_size INTEGER NOT NULL
);

-- Cloud Files
CREATE TABLE IF NOT EXISTS cloud_files (
    id TEXT PRIMARY KEY NOT NULL,
    snapshot_id TEXT NOT NULL REFERENCES save_snapshots(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_file_id TEXT NOT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sync Conflicts
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    local_snapshot_id TEXT NOT NULL REFERENCES save_snapshots(id),
    cloud_snapshot_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'resolved', 'ignored'
    detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);

-- Sync History
CREATE TABLE IF NOT EXISTS sync_history (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    status TEXT NOT NULL,
    bytes_transferred INTEGER NOT NULL DEFAULT 0,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    error_message TEXT
);

-- Downloads
CREATE TABLE IF NOT EXISTS downloads (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    source_url TEXT NOT NULL,
    destination_path TEXT NOT NULL,
    total_bytes INTEGER NOT NULL DEFAULT 0,
    downloaded_bytes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'queued',
    checksum TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Metadata Cache
CREATE TABLE IF NOT EXISTS metadata_cache (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    platform TEXT NOT NULL,
    metadata_json TEXT NOT NULL,
    cached_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_source ON games(source);
CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
CREATE INDEX IF NOT EXISTS idx_profile_game_favorite ON profile_game_data(profile_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_save_snapshots_game ON save_snapshots(profile_id, game_id);
CREATE INDEX IF NOT EXISTS idx_save_files_snapshot ON save_files(snapshot_id);

