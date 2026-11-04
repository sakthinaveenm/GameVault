use crate::database::DbPool;
use crate::errors::AppResult;
use serde::{Deserialize, Serialize};
use sqlx::Row;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IgdbGameMetadata {
    pub igdb_id: u64,
    pub name: String,
    pub summary: Option<String>,
    pub cover_url: Option<String>,
    pub banner_url: Option<String>,
    pub release_date: Option<String>,
    pub developer: Option<String>,
    pub publisher: Option<String>,
    pub genres: Vec<String>,
}

pub struct IgdbClient;

impl IgdbClient {
    pub async fn get_cached_metadata(
        pool: &DbPool,
        title: &str,
        platform: &str,
    ) -> AppResult<Option<IgdbGameMetadata>> {
        let normalized = title.trim().to_lowercase();
        let row = sqlx::query(
            "SELECT metadata_json FROM metadata_cache WHERE title = ? AND platform = ? LIMIT 1"
        )
        .bind(&normalized)
        .bind(platform)
        .fetch_optional(pool)
        .await?;

        if let Some(r) = row {
            let json_str: String = r.get("metadata_json");
            if let Ok(meta) = serde_json::from_str::<IgdbGameMetadata>(&json_str) {
                return Ok(Some(meta));
            }
        }

        Ok(None)
    }

    pub async fn cache_metadata(
        pool: &DbPool,
        title: &str,
        platform: &str,
        metadata: &IgdbGameMetadata,
    ) -> AppResult<()> {
        let normalized = title.trim().to_lowercase();
        let json_str = serde_json::to_string(metadata)?;
        let id = format!("{}-{}", normalized, platform);

        sqlx::query(
            r#"
            INSERT INTO metadata_cache (id, title, platform, metadata_json, cached_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                metadata_json = excluded.metadata_json,
                cached_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(id)
        .bind(normalized)
        .bind(platform)
        .bind(json_str)
        .execute(pool)
        .await?;

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

    #[tokio::test]
    async fn test_igdb_metadata_caching_and_offline_lookup() {
        let pool = setup_test_db().await;

        let sample = IgdbGameMetadata {
            igdb_id: 1145360,
            name: "Hades".into(),
            summary: Some("Defy the god of the dead".into()),
            cover_url: Some("https://images.igdb.com/cover1.jpg".into()),
            banner_url: None,
            release_date: Some("2020-09-17".into()),
            developer: Some("Supergiant Games".into()),
            publisher: Some("Supergiant Games".into()),
            genres: vec!["Roguelike".into(), "Action".into()],
        };

        // Cache
        IgdbClient::cache_metadata(&pool, "Hades", "macos", &sample)
            .await
            .expect("Failed to cache metadata");

        // Lookup from cache
        let cached = IgdbClient::get_cached_metadata(&pool, "hades", "macos")
            .await
            .expect("Lookup failed");

        assert!(cached.is_some());
        let meta = cached.unwrap();
        assert_eq!(meta.name, "Hades");
        assert_eq!(meta.developer.as_deref(), Some("Supergiant Games"));
    }
}
