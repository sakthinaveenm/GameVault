use crate::errors::{AppError, AppResult};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Pool, Sqlite};
use std::fs;
use std::path::Path;
use std::str::FromStr;
use tracing::info;

pub type DbPool = Pool<Sqlite>;

pub struct DatabaseManager {
    pool: DbPool,
}

impl DatabaseManager {
    pub async fn init(database_path: &Path) -> AppResult<Self> {
        if let Some(parent) = database_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let connection_str = format!("sqlite://{}?mode=rwc", database_path.display());
        let connect_options = SqliteConnectOptions::from_str(&connection_str)?
            .create_if_missing(true)
            .foreign_keys(true);

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(connect_options)
            .await?;

        // Run migrations
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .map_err(|e| AppError::Database(sqlx::Error::Migrate(Box::new(e))))?;

        info!("Database initialized and migrations applied successfully.");

        // Ensure default profile exists
        Self::ensure_default_profile(&pool).await?;

        Ok(Self { pool })
    }

    pub async fn init_in_memory() -> AppResult<Self> {
        let connect_options = SqliteConnectOptions::from_str("sqlite::memory:")?
            .foreign_keys(true);

        let pool = SqlitePoolOptions::new()
            .connect_with(connect_options)
            .await?;

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .map_err(|e| AppError::Database(sqlx::Error::Migrate(Box::new(e))))?;

        Self::ensure_default_profile(&pool).await?;

        Ok(Self { pool })
    }

    pub fn pool(&self) -> &DbPool {
        &self.pool
    }

    async fn ensure_default_profile(pool: &DbPool) -> AppResult<()> {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM user_profiles")
            .fetch_one(pool)
            .await?;

        if count.0 == 0 {
            sqlx::query(
                "INSERT INTO user_profiles (id, display_name, is_default) VALUES (?, ?, 1)",
            )
            .bind(uuid::Uuid::new_v4().to_string())
            .bind("Player 1")
            .execute(pool)
            .await?;
            info!("Created default initial user profile: Player 1");
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_in_memory_database_migrations() {
        let connect_options = SqliteConnectOptions::from_str("sqlite::memory:")
            .unwrap()
            .foreign_keys(true);

        let pool = SqlitePoolOptions::new()
            .connect_with(connect_options)
            .await
            .expect("Failed to connect to in-memory SQLite");

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Migration failed on in-memory SQLite");

        DatabaseManager::ensure_default_profile(&pool)
            .await
            .expect("Failed to create default profile");

        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM user_profiles")
            .fetch_one(&pool)
            .await
            .expect("Query failed");

        assert_eq!(count.0, 1);
    }
}
