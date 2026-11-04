use crate::database::DbPool;
use crate::errors::{AppError, AppResult};
use crate::models::UserProfile;
use chrono::Utc;
use sqlx::Row;
use uuid::Uuid;

pub struct ProfileRepository;

impl ProfileRepository {
    pub async fn list(pool: &DbPool) -> AppResult<Vec<UserProfile>> {
        let rows = sqlx::query(
            "SELECT id, display_name, avatar_path, is_default, created_at, updated_at FROM user_profiles ORDER BY is_default DESC, created_at ASC"
        )
        .fetch_all(pool)
        .await?;

        let mut profiles = Vec::new();
        for row in rows {
            profiles.push(UserProfile {
                id: row.get("id"),
                display_name: row.get("display_name"),
                avatar_path: row.get("avatar_path"),
                is_default: row.get::<i64, _>("is_default") == 1,
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            });
        }
        Ok(profiles)
    }

    pub async fn create(
        pool: &DbPool,
        display_name: &str,
        avatar_path: Option<&str>,
    ) -> AppResult<UserProfile> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            "INSERT INTO user_profiles (id, display_name, avatar_path, is_default, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)"
        )
        .bind(&id)
        .bind(display_name)
        .bind(avatar_path)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        Ok(UserProfile {
            id,
            display_name: display_name.to_string(),
            avatar_path: avatar_path.map(String::from),
            is_default: false,
            created_at: now,
            updated_at: now,
        })
    }

    pub async fn delete(pool: &DbPool, id: &str) -> AppResult<()> {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM user_profiles")
            .fetch_one(pool)
            .await?;

        if count.0 <= 1 {
            return Err(AppError::Generic(
                "Cannot delete the only remaining profile.".to_string(),
            ));
        }

        let mut tx = pool.begin().await?;

        sqlx::query("DELETE FROM user_profiles WHERE id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await?;

        // If the deleted profile was default, make the first available profile default
        let remaining_default: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM user_profiles WHERE is_default = 1")
                .fetch_one(&mut *tx)
                .await?;

        if remaining_default.0 == 0 {
            sqlx::query(
                "UPDATE user_profiles SET is_default = 1 WHERE id = (SELECT id FROM user_profiles LIMIT 1)"
            )
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
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
    async fn test_profile_crud_operations() {
        let pool = setup_test_db().await;

        // 1. Create a profile
        let p1 = ProfileRepository::create(&pool, "ProPlayer", None)
            .await
            .expect("Failed to create profile");
        assert_eq!(p1.display_name, "ProPlayer");

        // 2. List profiles
        let list = ProfileRepository::list(&pool)
            .await
            .expect("Failed to list profiles");
        assert_eq!(list.len(), 1);

        // 3. Prevent deleting last profile
        let del_err = ProfileRepository::delete(&pool, &p1.id).await;
        assert!(del_err.is_err());

        // 4. Create second profile
        let p2 = ProfileRepository::create(&pool, "Guest", None)
            .await
            .expect("Failed to create second profile");
        let list2 = ProfileRepository::list(&pool).await.unwrap();
        assert_eq!(list2.len(), 2);

        // 5. Delete first profile
        let del_ok = ProfileRepository::delete(&pool, &p1.id).await;
        assert!(del_ok.is_ok());

        let final_list = ProfileRepository::list(&pool).await.unwrap();
        assert_eq!(final_list.len(), 1);
        assert_eq!(final_list[0].id, p2.id);
    }
}
