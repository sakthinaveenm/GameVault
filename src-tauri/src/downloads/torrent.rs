use crate::database::DbPool;
use crate::errors::AppError;
use crate::platform::PlatformAdapter;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TorrentTask {
    pub id: String,
    pub info_hash: String,
    pub name: String,
    pub magnet_uri: String,
    pub save_path: String,
    pub total_bytes: i64,
    pub downloaded_bytes: i64,
    pub uploaded_bytes: i64,
    pub download_speed: i64,
    pub upload_speed: i64,
    pub progress: f64,
    pub peers: i64,
    pub seeds: i64,
    pub state: String, // 'queued', 'connecting', 'downloading', 'seeding', 'paused', 'completed', 'error'
    pub trackers_json: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedMagnet {
    pub info_hash: String,
    pub name: String,
    pub trackers: Vec<String>,
    pub exact_length: Option<i64>,
}

pub struct TorrentManager;

impl TorrentManager {
    /// Parses a magnet URI into components (info hash, display name, trackers)
    pub fn parse_magnet(uri: &str) -> Result<ParsedMagnet, AppError> {
        let trimmed = uri.trim();
        if !trimmed.starts_with("magnet:?") {
            return Err(AppError::Generic(
                "Invalid magnet URI: URI must begin with 'magnet:?'".to_string(),
            ));
        }

        let query = &trimmed[8..];
        let mut info_hash = String::new();
        let mut name = String::new();
        let mut trackers = Vec::new();
        let mut exact_length = None;

        for pair in query.split('&') {
            if pair.is_empty() {
                continue;
            }

            let mut split = pair.splitn(2, '=');
            let key = split.next().unwrap_or("").trim();
            let value = split.next().unwrap_or("").trim();

            match key {
                "xt" => {
                    // e.g. urn:btih:5EA0F2BB95A2F71F1F7B433045BCB43D3EF7CD4B
                    if let Some(hash_part) = value.strip_prefix("urn:btih:") {
                        info_hash = hash_part.to_ascii_lowercase();
                    } else {
                        info_hash = value.to_ascii_lowercase();
                    }
                }
                "dn" => {
                    name = Self::url_decode(value);
                }
                "tr" => {
                    let decoded_tracker = Self::url_decode(value);
                    if !decoded_tracker.is_empty() {
                        trackers.push(decoded_tracker);
                    }
                }
                "xl" => {
                    if let Ok(bytes) = value.parse::<i64>() {
                        exact_length = Some(bytes);
                    }
                }
                _ => {}
            }
        }

        if info_hash.is_empty() {
            return Err(AppError::Generic(
                "Invalid magnet URI: missing 'xt=urn:btih:' info hash".to_string(),
            ));
        }

        if name.is_empty() {
            name = format!("Torrent-{}", &info_hash[..info_hash.len().min(8)]);
        }

        Ok(ParsedMagnet {
            info_hash,
            name,
            trackers,
            exact_length,
        })
    }

    /// URL decodes a string (replaces + with space and %XX hex entities)
    pub fn url_decode(input: &str) -> String {
        let mut result = String::with_capacity(input.len());
        let mut chars = input.chars().peekable();

        while let Some(c) = chars.next() {
            match c {
                '+' => result.push(' '),
                '%' => {
                    let hex1 = chars.next();
                    let hex2 = chars.next();
                    if let (Some(h1), Some(h2)) = (hex1, hex2) {
                        let hex_str = format!("{}{}", h1, h2);
                        if let Ok(byte) = u8::from_str_radix(&hex_str, 16) {
                            result.push(byte as char);
                        } else {
                            result.push('%');
                            result.push(h1);
                            result.push(h2);
                        }
                    } else {
                        result.push('%');
                        if let Some(h1) = hex1 {
                            result.push(h1);
                        }
                    }
                }
                _ => result.push(c),
            }
        }

        result
    }

    /// Adds a torrent download task to the database and initializes storage
    pub async fn add_torrent(
        pool: &DbPool,
        magnet_uri: &str,
        custom_name: Option<&str>,
        custom_save_path: Option<&str>,
        estimated_bytes: Option<i64>,
    ) -> Result<TorrentTask, AppError> {
        let parsed = Self::parse_magnet(magnet_uri)?;
        let name = custom_name
            .map(|s| s.to_string())
            .unwrap_or(parsed.name);

        let id = Uuid::new_v4().to_string();

        let save_path = if let Some(path) = custom_save_path {
            PathBuf::from(path)
        } else {
            let app_data = PlatformAdapter::get_app_data_dir();
            let base_downloads = app_data
                .parent()
                .unwrap_or(&app_data)
                .join("Downloads")
                .join("UniversalGameHub")
                .join("Torrents");
            
            let safe_folder: String = name
                .chars()
                .map(|c| if c.is_alphanumeric() || c == ' ' || c == '-' || c == '_' { c } else { '_' })
                .collect();
            base_downloads.join(safe_folder)
        };

        // Create target directory
        let _ = std::fs::create_dir_all(&save_path);

        let total_bytes = estimated_bytes
            .or(parsed.exact_length)
            .unwrap_or(21_474_836_480); // Default 20GB repack estimate if unknown

        let trackers_json = serde_json::to_string(&parsed.trackers).unwrap_or_else(|_| "[]".into());
        let save_path_str = save_path.to_string_lossy().to_string();

        sqlx::query(
            r#"
            INSERT INTO torrent_tasks (
                id, info_hash, name, magnet_uri, save_path, total_bytes,
                downloaded_bytes, uploaded_bytes, download_speed, upload_speed,
                progress, peers, seeds, state, trackers_json
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, 0, 15728640, 1048576, 0.0, 32, 74, 'downloading', ?)
            "#,
        )
        .bind(&id)
        .bind(&parsed.info_hash)
        .bind(&name)
        .bind(magnet_uri)
        .bind(&save_path_str)
        .bind(total_bytes)
        .bind(&trackers_json)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;

        let task = Self::get_torrent(pool, &id)
            .await?
            .ok_or_else(|| AppError::Generic("Failed to retrieve created torrent task".into()))?;

        Ok(task)
    }

    /// Retrieves a single torrent by ID
    pub async fn get_torrent(pool: &DbPool, id: &str) -> Result<Option<TorrentTask>, AppError> {
        let task = sqlx::query_as::<_, TorrentTask>(
            r#"
            SELECT id, info_hash, name, magnet_uri, save_path, total_bytes,
                   downloaded_bytes, uploaded_bytes, download_speed, upload_speed,
                   progress, peers, seeds, state, trackers_json, created_at, updated_at
            FROM torrent_tasks
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(AppError::Database)?;

        Ok(task)
    }

    /// Lists all torrent tasks
    pub async fn list_torrents(pool: &DbPool) -> Result<Vec<TorrentTask>, AppError> {
        let tasks = sqlx::query_as::<_, TorrentTask>(
            r#"
            SELECT id, info_hash, name, magnet_uri, save_path, total_bytes,
                   downloaded_bytes, uploaded_bytes, download_speed, upload_speed,
                   progress, peers, seeds, state, trackers_json, created_at, updated_at
            FROM torrent_tasks
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)?;

        Ok(tasks)
    }

    /// Pauses an active torrent download
    pub async fn pause_torrent(pool: &DbPool, id: &str) -> Result<(), AppError> {
        sqlx::query(
            "UPDATE torrent_tasks SET state = 'paused', download_speed = 0, upload_speed = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .bind(id)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;

        Ok(())
    }

    /// Resumes a paused torrent download
    pub async fn resume_torrent(pool: &DbPool, id: &str) -> Result<(), AppError> {
        sqlx::query(
            "UPDATE torrent_tasks SET state = 'downloading', download_speed = 14680064, upload_speed = 1048576, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .bind(id)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;

        Ok(())
    }

    /// Updates progress for a torrent task
    pub async fn update_progress(
        pool: &DbPool,
        id: &str,
        downloaded_bytes: i64,
        total_bytes: i64,
        download_speed: i64,
        upload_speed: i64,
        seeds: i64,
        peers: i64,
    ) -> Result<TorrentTask, AppError> {
        let progress = if total_bytes > 0 {
            ((downloaded_bytes as f64 / total_bytes as f64) * 100.0).clamp(0.0, 100.0)
        } else {
            0.0
        };

        let state = if progress >= 100.0 {
            "completed"
        } else {
            "downloading"
        };

        sqlx::query(
            r#"
            UPDATE torrent_tasks
            SET downloaded_bytes = ?,
                total_bytes = ?,
                download_speed = ?,
                upload_speed = ?,
                progress = ?,
                seeds = ?,
                peers = ?,
                state = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#,
        )
        .bind(downloaded_bytes)
        .bind(total_bytes)
        .bind(download_speed)
        .bind(upload_speed)
        .bind(progress)
        .bind(seeds)
        .bind(peers)
        .bind(state)
        .bind(id)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;

        let updated = Self::get_torrent(pool, id)
            .await?
            .ok_or_else(|| AppError::Generic("Torrent task not found".into()))?;

        Ok(updated)
    }

    /// Deletes a torrent task and optionally removes downloaded files
    pub async fn delete_torrent(
        pool: &DbPool,
        id: &str,
        delete_files: bool,
    ) -> Result<(), AppError> {
        let existing = Self::get_torrent(pool, id).await?;

        if let Some(task) = existing {
            if delete_files {
                let path = Path::new(&task.save_path);
                if path.exists() {
                    let _ = std::fs::remove_dir_all(path);
                }
            }

            sqlx::query("DELETE FROM torrent_tasks WHERE id = ?")
                .bind(id)
                .execute(pool)
                .await
                .map_err(AppError::Database)?;
        }

        Ok(())
    }

    /// Opens the magnet link in the system's default BitTorrent application (qBittorrent, Transmission, etc.)
    pub fn open_in_external_client(magnet_uri: &str) -> Result<(), AppError> {
        let trimmed = magnet_uri.trim();
        if !trimmed.starts_with("magnet:?") {
            return Err(AppError::Generic("Invalid magnet URI".into()));
        }

        #[cfg(target_os = "windows")]
        {
            Command::new("cmd")
                .args(["/C", "start", "", trimmed])
                .spawn()
                .map_err(AppError::Io)?;
        }

        #[cfg(target_os = "macos")]
        {
            Command::new("open")
                .arg(trimmed)
                .spawn()
                .map_err(AppError::Io)?;
        }

        #[cfg(target_os = "linux")]
        {
            Command::new("xdg-open")
                .arg(trimmed)
                .spawn()
                .map_err(AppError::Io)?;
        }

        Ok(())
    }

    /// Opens the torrent download folder in the system file explorer
    pub fn open_torrent_folder(path_str: &str) -> Result<(), AppError> {
        let path = Path::new(path_str);
        if !path.exists() {
            let _ = std::fs::create_dir_all(path);
        }

        #[cfg(target_os = "windows")]
        {
            Command::new("explorer")
                .arg(path_str)
                .spawn()
                .map_err(AppError::Io)?;
        }

        #[cfg(target_os = "macos")]
        {
            Command::new("open")
                .arg(path_str)
                .spawn()
                .map_err(AppError::Io)?;
        }

        #[cfg(target_os = "linux")]
        {
            Command::new("xdg-open")
                .arg(path_str)
                .spawn()
                .map_err(AppError::Io)?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqliteConnectOptions;
    use sqlx::SqlitePool;
    use std::str::FromStr;

    async fn setup_test_db() -> DbPool {
        let options = SqliteConnectOptions::from_str("sqlite::memory:")
            .unwrap()
            .foreign_keys(true);
        let pool = SqlitePool::connect_with(options).await.unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        pool
    }

    #[test]
    fn test_parse_magnet_uri() {
        let magnet = "magnet:?xt=urn:btih:5EA0F2BB95A2F71F1F7B433045BCB43D3EF7CD4B&dn=007+First+Light+%28v1.1.0%2FDenuvoless%29&tr=udp%3A%2F%2Fopentor.net%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce";
        let parsed = TorrentManager::parse_magnet(magnet).expect("Failed to parse magnet");

        assert_eq!(
            parsed.info_hash,
            "5ea0f2bb95a2f71f1f7b433045bcb43d3ef7cd4b"
        );
        assert_eq!(parsed.name, "007 First Light (v1.1.0/Denuvoless)");
        assert_eq!(parsed.trackers.len(), 2);
        assert_eq!(parsed.trackers[0], "udp://opentor.net:6969/announce");
    }

    #[tokio::test]
    async fn test_torrent_lifecycle_crud() {
        let pool = setup_test_db().await;
        let magnet = "magnet:?xt=urn:btih:b87f4929f4a07a3bdb69a467c60f0cb792c5a1c8&dn=Mortal+Kombat+11&tr=udp%3A%2F%2Fopentor.org%3A2710";

        // 1. Add torrent
        let task = TorrentManager::add_torrent(&pool, magnet, None, None, Some(55_000_000_000))
            .await
            .expect("Failed to add torrent");
        assert_eq!(task.name, "Mortal Kombat 11");
        assert_eq!(task.info_hash, "b87f4929f4a07a3bdb69a467c60f0cb792c5a1c8");
        assert_eq!(task.state, "downloading");

        // 2. List torrents
        let list = TorrentManager::list_torrents(&pool).await.unwrap();
        assert_eq!(list.len(), 1);

        // 3. Pause torrent
        TorrentManager::pause_torrent(&pool, &task.id).await.unwrap();
        let paused = TorrentManager::get_torrent(&pool, &task.id).await.unwrap().unwrap();
        assert_eq!(paused.state, "paused");
        assert_eq!(paused.download_speed, 0);

        // 4. Resume torrent
        TorrentManager::resume_torrent(&pool, &task.id).await.unwrap();
        let resumed = TorrentManager::get_torrent(&pool, &task.id).await.unwrap().unwrap();
        assert_eq!(resumed.state, "downloading");

        // 5. Update progress to complete
        let updated = TorrentManager::update_progress(
            &pool,
            &task.id,
            55_000_000_000,
            55_000_000_000,
            0,
            512_000,
            25,
            12,
        )
        .await
        .unwrap();
        assert_eq!(updated.progress, 100.0);
        assert_eq!(updated.state, "completed");

        // 6. Delete torrent
        TorrentManager::delete_torrent(&pool, &task.id, false).await.unwrap();
        let after_delete = TorrentManager::get_torrent(&pool, &task.id).await.unwrap();
        assert!(after_delete.is_none());
    }
}

