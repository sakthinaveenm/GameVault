pub mod backup;
pub mod hashing;
pub mod restore;

use crate::database::DbPool;
use crate::errors::{AppError, AppResult};
use crate::models::SaveSnapshot;
use crate::platform::PlatformAdapter;
use backup::SaveBackup;
use chrono::Utc;
use hashing::SaveHasher;
use restore::SaveRestore;
use sqlx::Row;
use std::path::{Path, PathBuf};
use uuid::Uuid;

pub struct SaveService;

impl SaveService {
    pub async fn create_game_snapshot(
        pool: &DbPool,
        profile_id: &str,
        game_id: &str,
        save_dir: &Path,
    ) -> AppResult<SaveSnapshot> {
        if !save_dir.exists() {
            return Err(AppError::SaveManager("Save directory does not exist".into()));
        }

        let (hash, entries) = SaveHasher::scan_and_hash_dir(save_dir)
            .map_err(|e| AppError::SaveManager(format!("Hashing error: {}", e)))?;

        let snapshot_id = Uuid::new_v4().to_string();
        let app_data = PlatformAdapter::get_app_data_dir();
        let archive_dest = app_data
            .join("saves")
            .join(profile_id)
            .join(game_id)
            .join(format!("{}.zip", snapshot_id));

        let compressed_size = SaveBackup::create_archive(save_dir, &archive_dest)?;
        let device_id = format!("{}-{}", std::env::consts::OS, std::env::consts::ARCH);
        let now = Utc::now();

        let mut tx = pool.begin().await?;

        sqlx::query(
            r#"
            INSERT INTO save_snapshots (
                id, profile_id, game_id, device_id, snapshot_hash,
                archive_path, compressed_size, cloud_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'local_only', ?)
            "#,
        )
        .bind(&snapshot_id)
        .bind(profile_id)
        .bind(game_id)
        .bind(&device_id)
        .bind(&hash)
        .bind(archive_dest.to_string_lossy().to_string())
        .bind(compressed_size as i64)
        .bind(now)
        .execute(&mut *tx)
        .await?;

        for entry in &entries {
            sqlx::query(
                r#"
                INSERT INTO save_files (id, snapshot_id, relative_path, file_hash, file_size)
                VALUES (?, ?, ?, ?, ?)
                "#,
            )
            .bind(Uuid::new_v4().to_string())
            .bind(&snapshot_id)
            .bind(&entry.relative_path)
            .bind(&entry.sha256_hash)
            .bind(entry.size_bytes as i64)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;

        Ok(SaveSnapshot {
            id: snapshot_id,
            profile_id: profile_id.to_string(),
            game_id: game_id.to_string(),
            device_id,
            snapshot_hash: hash,
            archive_path: archive_dest.to_string_lossy().to_string(),
            compressed_size: compressed_size as i64,
            cloud_status: "local_only".to_string(),
            created_at: now,
            file_count: entries.len() as i64,
        })
    }

    pub async fn list_snapshots_for_game(
        pool: &DbPool,
        profile_id: &str,
        game_id: &str,
    ) -> AppResult<Vec<SaveSnapshot>> {
        let rows = sqlx::query(
            r#"
            SELECT 
                s.id, s.profile_id, s.game_id, s.device_id, s.snapshot_hash,
                s.archive_path, s.compressed_size, s.cloud_status, s.created_at,
                (SELECT COUNT(*) FROM save_files sf WHERE sf.snapshot_id = s.id) as file_count
            FROM save_snapshots s
            WHERE s.profile_id = ? AND s.game_id = ?
            ORDER BY s.created_at DESC
            "#,
        )
        .bind(profile_id)
        .bind(game_id)
        .fetch_all(pool)
        .await?;

        let mut snapshots = Vec::new();
        for row in rows {
            snapshots.push(SaveSnapshot {
                id: row.get("id"),
                profile_id: row.get("profile_id"),
                game_id: row.get("game_id"),
                device_id: row.get("device_id"),
                snapshot_hash: row.get("snapshot_hash"),
                archive_path: row.get("archive_path"),
                compressed_size: row.get("compressed_size"),
                cloud_status: row.get("cloud_status"),
                created_at: row.get("created_at"),
                file_count: row.get("file_count"),
            });
        }

        Ok(snapshots)
    }

    pub async fn restore_snapshot(
        pool: &DbPool,
        snapshot_id: &str,
        target_save_dir: &Path,
    ) -> AppResult<()> {
        let row = sqlx::query(
            "SELECT archive_path, profile_id, game_id FROM save_snapshots WHERE id = ?"
        )
        .bind(snapshot_id)
        .fetch_optional(pool)
        .await?;

        let row = row.ok_or_else(|| {
            AppError::SaveManager(format!("Snapshot {} not found", snapshot_id))
        })?;

        let archive_path: String = row.get("archive_path");
        let profile_id: String = row.get("profile_id");
        let game_id: String = row.get("game_id");

        let app_data = PlatformAdapter::get_app_data_dir();
        let safety_dest = app_data
            .join("saves")
            .join(&profile_id)
            .join(&game_id)
            .join(format!("safety_pre_restore_{}.zip", Utc::now().timestamp()));

        SaveRestore::restore_archive_safely(
            &PathBuf::from(archive_path),
            target_save_dir,
            Some(&safety_dest),
        )?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqliteConnectOptions;
    use sqlx::SqlitePool;
    use std::fs::File;
    use std::io::Write;
    use std::str::FromStr;
    use tempfile::tempdir;

    async fn setup_test_db() -> DbPool {
        let options = SqliteConnectOptions::from_str("sqlite::memory:")
            .unwrap()
            .foreign_keys(true);
        let pool = SqlitePool::connect_with(options).await.unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        pool
    }

    #[tokio::test]
    async fn test_save_service_snapshot_and_restore() {
        let pool = setup_test_db().await;

        // Satisfy foreign keys
        crate::repositories::profile_repository::ProfileRepository::create(&pool, "player-test", None)
            .await
            .unwrap();
        let profiles = crate::repositories::profile_repository::ProfileRepository::list(&pool)
            .await
            .unwrap();
        let prof_id = &profiles[0].id;

        let game = crate::models::Game {
            id: "game-test-1".into(),
            title: "Super Mario World".into(),
            sort_title: None,
            summary: None,
            developer: None,
            publisher: None,
            release_date: None,
            source: crate::models::GameSource::Retro,
            platform: "snes".into(),
            store_id: None,
            executable_path: None,
            launch_arguments: None,
            working_directory: None,
            cover_url: None,
            banner_url: None,
            icon_url: None,
            installed: true,
            is_favorite: false,
            playtime_minutes: 0,
            last_played_at: None,
        };
        crate::repositories::game_repository::GameRepository::upsert(&pool, &game)
            .await
            .unwrap();

        let temp = tempdir().unwrap();
        let save_dir = temp.path().join("save_dir");
        std::fs::create_dir_all(&save_dir).unwrap();

        let save_file = save_dir.join("smw.srm");
        let mut f = File::create(&save_file).unwrap();
        f.write_all(b"SNES SRAM 100% Complete Save").unwrap();

        // 1. Create snapshot
        let snap = SaveService::create_game_snapshot(&pool, prof_id, &game.id, &save_dir)
            .await
            .expect("Failed to create game snapshot");
        assert_eq!(snap.file_count, 1);
        assert!(!snap.snapshot_hash.is_empty());

        // 2. List snapshots
        let list = SaveService::list_snapshots_for_game(&pool, prof_id, &game.id)
            .await
            .unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].id, snap.id);

        // 3. Modify save file
        {
            let mut f_mod = File::create(&save_file).unwrap();
            f_mod.write_all(b"Corrupted Data").unwrap();
        }

        // 4. Restore snapshot
        SaveService::restore_snapshot(&pool, &snap.id, &save_dir)
            .await
            .expect("Restore failed");

        let restored = std::fs::read_to_string(&save_file).unwrap();
        assert_eq!(restored, "SNES SRAM 100% Complete Save");
    }
}
