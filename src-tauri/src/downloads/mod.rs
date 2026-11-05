pub mod torrent;

pub use torrent::{ParsedMagnet, TorrentManager, TorrentTask};

use crate::database::DbPool;
use crate::errors::AppError;
use crate::games::launcher::GameLauncher;
use sha2::{Digest, Sha256};
use std::path::Path;
use uuid::Uuid;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct DownloadItem {
    pub id: String,
    pub title: String,
    pub source_url: String,
    pub destination_path: String,
    pub total_bytes: i64,
    pub downloaded_bytes: i64,
    pub status: String, // 'queued', 'downloading', 'paused', 'completed', 'failed'
    pub checksum: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

pub struct DownloadManager;

impl DownloadManager {
    /// Inserts a new download task into the database
    pub async fn queue_download(
        pool: &DbPool,
        title: &str,
        source_url: &str,
        destination_path: &Path,
        expected_checksum: Option<&str>,
    ) -> Result<DownloadItem, AppError> {
        let id = Uuid::new_v4().to_string();
        let dest_str = destination_path.to_string_lossy().to_string();

        sqlx::query(
            r#"
            INSERT INTO downloads (id, title, source_url, destination_path, total_bytes, downloaded_bytes, status, checksum)
            VALUES (?, ?, ?, ?, 0, 0, 'queued', ?)
            "#,
        )
        .bind(&id)
        .bind(title)
        .bind(source_url)
        .bind(&dest_str)
        .bind(expected_checksum)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;

        let item = sqlx::query_as::<_, DownloadItem>(
            "SELECT id, title, source_url, destination_path, total_bytes, downloaded_bytes, status, checksum, created_at FROM downloads WHERE id = ?"
        )
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(AppError::Database)?;

        Ok(item)
    }

    /// Lists all downloads
    pub async fn list_downloads(pool: &DbPool) -> Result<Vec<DownloadItem>, AppError> {
        let items = sqlx::query_as::<_, DownloadItem>(
            "SELECT id, title, source_url, destination_path, total_bytes, downloaded_bytes, status, checksum, created_at FROM downloads ORDER BY created_at DESC"
        )
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)?;

        Ok(items)
    }

    /// Verifies the checksum of a downloaded file against the expected SHA-256 hash
    pub fn verify_checksum(file_path: &Path, expected_hex: &str) -> Result<bool, AppError> {
        if !file_path.exists() {
            return Err(AppError::Generic(format!(
                "Downloaded file not found at: {}",
                file_path.display()
            )));
        }

        let mut file = std::fs::File::open(file_path)
            .map_err(AppError::Io)?;
        let mut hasher = Sha256::new();
        std::io::copy(&mut file, &mut hasher)
            .map_err(AppError::Io)?;
        let computed = format!("{:x}", hasher.finalize());

        Ok(computed.eq_ignore_ascii_case(expected_hex))
    }

    /// Enforces explicit user confirmation before executing any downloaded installer/executable
    pub fn execute_installer(
        file_path: &Path,
        user_confirmed: bool,
    ) -> Result<u32, AppError> {
        if !user_confirmed {
            return Err(AppError::Generic(
                "Execution rejected: explicit user confirmation is mandatory to launch downloaded installers."
                    .to_string(),
            ));
        }

        if !file_path.exists() {
            return Err(AppError::Generic(format!(
                "Installer executable not found: {}",
                file_path.display()
            )));
        }

        let mut child = GameLauncher::launch(file_path, &[], None)?;
        let pid = child.id();
        std::thread::spawn(move || {
            let _ = child.wait();
        });

        Ok(pid)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_installer_user_confirmation_gate() {
        let temp = tempdir().unwrap();
        let fake_exe = temp.path().join("installer.bin");
        std::fs::write(&fake_exe, b"test").unwrap();

        // 1. Unconfirmed attempt MUST fail
        let result = DownloadManager::execute_installer(&fake_exe, false);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("explicit user confirmation is mandatory"));

        // 2. Confirmed attempt with non-existent file fails with not found
        let missing_exe = temp.path().join("missing.bin");
        let result_missing = DownloadManager::execute_installer(&missing_exe, true);
        assert!(result_missing.is_err());
    }

    #[test]
    fn test_verify_checksum() {
        let temp = tempdir().unwrap();
        let test_file = temp.path().join("sample.iso");
        std::fs::write(&test_file, b"Universal Game Hub Content").unwrap();

        let mut hasher = Sha256::new();
        hasher.update(b"Universal Game Hub Content");
        let expected_hash = format!("{:x}", hasher.finalize());

        let is_valid = DownloadManager::verify_checksum(&test_file, &expected_hash)
            .expect("Checksum calculation succeeded");
        assert!(is_valid);

        let is_invalid = DownloadManager::verify_checksum(&test_file, "deadbeef1234")
            .expect("Checksum calculation succeeded");
        assert!(!is_invalid);
    }
}
