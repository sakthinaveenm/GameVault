-- Torrent Downloads and P2P Task Management
CREATE TABLE IF NOT EXISTS torrent_tasks (
    id TEXT PRIMARY KEY NOT NULL,
    info_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    magnet_uri TEXT NOT NULL,
    save_path TEXT NOT NULL,
    total_bytes INTEGER NOT NULL DEFAULT 0,
    downloaded_bytes INTEGER NOT NULL DEFAULT 0,
    uploaded_bytes INTEGER NOT NULL DEFAULT 0,
    download_speed INTEGER NOT NULL DEFAULT 0,
    upload_speed INTEGER NOT NULL DEFAULT 0,
    progress REAL NOT NULL DEFAULT 0.0,
    peers INTEGER NOT NULL DEFAULT 0,
    seeds INTEGER NOT NULL DEFAULT 0,
    state TEXT NOT NULL DEFAULT 'queued',
    trackers_json TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_torrent_tasks_hash ON torrent_tasks(info_hash);
CREATE INDEX IF NOT EXISTS idx_torrent_tasks_state ON torrent_tasks(state);

