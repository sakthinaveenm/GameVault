use crate::database::DbPool;
use crate::errors::{AppError, AppResult};
use crate::models::{CreateProfileInput, UpdateProfileInput, UserProfile};
use crate::platform::PlatformAdapter;
use crate::security::crypto::PasswordHasher;
use chrono::Utc;
use sqlx::Row;
use std::fs;
use uuid::Uuid;

pub struct ProfileRepository;

impl ProfileRepository {
    pub async fn list(pool: &DbPool) -> AppResult<Vec<UserProfile>> {
        let rows = sqlx::query(
            r#"
            SELECT 
                p.id, p.display_name, p.avatar_path, p.is_default,
                p.authentication_enabled, p.auth_type, p.theme_preference,
                p.preferred_controller, p.sync_profile_id, p.last_played_game,
                p.created_at, p.updated_at,
                pcl.google_email,
                (SELECT pgd.last_played_at FROM profile_game_data pgd WHERE pgd.profile_id = p.id AND pgd.last_played_at IS NOT NULL ORDER BY pgd.last_played_at DESC LIMIT 1) as max_last_played_at
            FROM user_profiles p
            LEFT JOIN profile_cloud_links pcl ON p.id = pcl.profile_id
            ORDER BY p.is_default DESC, p.created_at ASC
            "#,
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
                authentication_enabled: row.get::<i64, _>("authentication_enabled") == 1,
                auth_type: row.get::<Option<String>, _>("auth_type").unwrap_or_else(|| "none".into()),
                theme_preference: row.get::<Option<String>, _>("theme_preference").unwrap_or_else(|| "dark".into()),
                preferred_controller: row.get("preferred_controller"),
                sync_profile_id: row.get("sync_profile_id"),
                linked_google_email: row.get("google_email"),
                last_played_game: row.get("last_played_game"),
                last_played_at: row.get("max_last_played_at"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            });
        }
        Ok(profiles)
    }

    pub async fn get_by_id(pool: &DbPool, id: &str) -> AppResult<Option<UserProfile>> {
        let row = sqlx::query(
            r#"
            SELECT 
                p.id, p.display_name, p.avatar_path, p.is_default,
                p.authentication_enabled, p.auth_type, p.theme_preference,
                p.preferred_controller, p.sync_profile_id, p.last_played_game,
                p.created_at, p.updated_at,
                pcl.google_email,
                (SELECT pgd.last_played_at FROM profile_game_data pgd WHERE pgd.profile_id = p.id AND pgd.last_played_at IS NOT NULL ORDER BY pgd.last_played_at DESC LIMIT 1) as max_last_played_at
            FROM user_profiles p
            LEFT JOIN profile_cloud_links pcl ON p.id = pcl.profile_id
            WHERE p.id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        let profile = row.map(|r| UserProfile {
            id: r.get("id"),
            display_name: r.get("display_name"),
            avatar_path: r.get("avatar_path"),
            is_default: r.get::<i64, _>("is_default") == 1,
            authentication_enabled: r.get::<i64, _>("authentication_enabled") == 1,
            auth_type: r.get::<Option<String>, _>("auth_type").unwrap_or_else(|| "none".into()),
            theme_preference: r.get::<Option<String>, _>("theme_preference").unwrap_or_else(|| "dark".into()),
            preferred_controller: r.get("preferred_controller"),
            sync_profile_id: r.get("sync_profile_id"),
            linked_google_email: r.get("google_email"),
            last_played_game: r.get("last_played_game"),
            last_played_at: r.get("max_last_played_at"),
            created_at: r.get("created_at"),
            updated_at: r.get("updated_at"),
        });

        Ok(profile)
    }

    pub async fn create_full(pool: &DbPool, input: &CreateProfileInput) -> AppResult<UserProfile> {
        let id = Uuid::new_v4().to_string();
        let sync_profile_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Check if there are no existing profiles; if so, make this the default
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM user_profiles")
            .fetch_one(pool)
            .await?;
        let is_default = if count.0 == 0 { 1 } else { 0 };

        let auth_type = input.auth_type.to_lowercase();
        let mut auth_enabled = 0;
        let mut pin_hash = None;
        let mut pin_salt = None;
        let mut pwd_hash = None;
        let mut pwd_salt = None;

        if auth_type == "pin" {
            if let Some(pin) = &input.pin {
                if !pin.trim().is_empty() {
                    let salt = PasswordHasher::generate_salt();
                    let hash = PasswordHasher::hash_credential(pin.trim(), &salt);
                    pin_hash = Some(hash);
                    pin_salt = Some(salt);
                    auth_enabled = 1;
                }
            }
        } else if auth_type == "password" {
            if let Some(pwd) = &input.password {
                if !pwd.trim().is_empty() {
                    let salt = PasswordHasher::generate_salt();
                    let hash = PasswordHasher::hash_credential(pwd.trim(), &salt);
                    pwd_hash = Some(hash);
                    pwd_salt = Some(salt);
                    auth_enabled = 1;
                }
            }
        }

        let theme = input.theme_preference.clone().unwrap_or_else(|| "dark".into());

        sqlx::query(
            r#"
            INSERT INTO user_profiles (
                id, display_name, avatar_path, is_default,
                authentication_enabled, auth_type, pin_hash, pin_salt,
                password_hash, password_salt, theme_preference,
                preferred_controller, sync_profile_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&input.display_name)
        .bind(&input.avatar_path)
        .bind(is_default)
        .bind(auth_enabled)
        .bind(&auth_type)
        .bind(pin_hash)
        .bind(pin_salt)
        .bind(pwd_hash)
        .bind(pwd_salt)
        .bind(&theme)
        .bind(&input.preferred_controller)
        .bind(&sync_profile_id)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        // Initialize profile-specific filesystem directories
        let app_data = PlatformAdapter::get_app_data_dir();
        let profile_dir = app_data.join("profiles").join(&id);
        let _ = fs::create_dir_all(profile_dir.join("saves"));
        let _ = fs::create_dir_all(profile_dir.join("backups"));
        let _ = fs::create_dir_all(profile_dir.join("collections"));

        // Initialize default profile settings
        let _ = sqlx::query(
            "INSERT INTO profile_settings (id, profile_id, setting_key, setting_value) VALUES (?, ?, ?, ?)"
        )
        .bind(Uuid::new_v4().to_string())
        .bind(&id)
        .bind("theme")
        .bind(&theme)
        .execute(pool)
        .await;

        Ok(UserProfile {
            id,
            display_name: input.display_name.clone(),
            avatar_path: input.avatar_path.clone(),
            is_default: is_default == 1,
            authentication_enabled: auth_enabled == 1,
            auth_type,
            theme_preference: theme,
            preferred_controller: input.preferred_controller.clone(),
            sync_profile_id: Some(sync_profile_id),
            linked_google_email: None,
            last_played_game: None,
            last_played_at: None,
            created_at: now,
            updated_at: now,
        })
    }

    pub async fn create(
        pool: &DbPool,
        display_name: &str,
        avatar_path: Option<&str>,
    ) -> AppResult<UserProfile> {
        Self::create_full(
            pool,
            &CreateProfileInput {
                display_name: display_name.to_string(),
                avatar_path: avatar_path.map(String::from),
                auth_type: "none".into(),
                pin: None,
                password: None,
                theme_preference: Some("dark".into()),
                preferred_controller: None,
            },
        )
        .await
    }

    pub async fn verify_credentials(
        pool: &DbPool,
        profile_id: &str,
        secret: &str,
    ) -> AppResult<bool> {
        let row = sqlx::query(
            "SELECT authentication_enabled, auth_type, pin_hash, pin_salt, password_hash, password_salt FROM user_profiles WHERE id = ?"
        )
        .bind(profile_id)
        .fetch_optional(pool)
        .await?;

        let row = match row {
            Some(r) => r,
            None => return Ok(false),
        };

        let auth_enabled: i64 = row.get("authentication_enabled");
        if auth_enabled == 0 {
            return Ok(true); // No authentication required
        }

        let auth_type: String = row.get::<Option<String>, _>("auth_type").unwrap_or_default();

        if auth_type == "pin" {
            let hash: Option<String> = row.get("pin_hash");
            let salt: Option<String> = row.get("pin_salt");
            if let (Some(h), Some(s)) = (hash, salt) {
                return Ok(PasswordHasher::verify_credential(secret, &s, &h));
            }
        } else if auth_type == "password" {
            let hash: Option<String> = row.get("password_hash");
            let salt: Option<String> = row.get("password_salt");
            if let (Some(h), Some(s)) = (hash, salt) {
                return Ok(PasswordHasher::verify_credential(secret, &s, &h));
            }
        }

        Ok(false)
    }

    pub async fn update_profile(
        pool: &DbPool,
        input: &UpdateProfileInput,
    ) -> AppResult<UserProfile> {
        let now = Utc::now();
        let mut tx = pool.begin().await?;

        if let Some(name) = &input.display_name {
            sqlx::query("UPDATE user_profiles SET display_name = ?, updated_at = ? WHERE id = ?")
                .bind(name)
                .bind(now)
                .bind(&input.id)
                .execute(&mut *tx)
                .await?;
        }

        if let Some(avatar) = &input.avatar_path {
            sqlx::query("UPDATE user_profiles SET avatar_path = ?, updated_at = ? WHERE id = ?")
                .bind(avatar)
                .bind(now)
                .bind(&input.id)
                .execute(&mut *tx)
                .await?;
        }

        if let Some(theme) = &input.theme_preference {
            sqlx::query("UPDATE user_profiles SET theme_preference = ?, updated_at = ? WHERE id = ?")
                .bind(theme)
                .bind(now)
                .bind(&input.id)
                .execute(&mut *tx)
                .await?;
        }

        if let Some(ctrl) = &input.preferred_controller {
            sqlx::query("UPDATE user_profiles SET preferred_controller = ?, updated_at = ? WHERE id = ?")
                .bind(ctrl)
                .bind(now)
                .bind(&input.id)
                .execute(&mut *tx)
                .await?;
        }

        if let Some(true) = input.remove_auth {
            sqlx::query(
                "UPDATE user_profiles SET authentication_enabled = 0, auth_type = 'none', pin_hash = NULL, pin_salt = NULL, password_hash = NULL, password_salt = NULL, updated_at = ? WHERE id = ?"
            )
            .bind(now)
            .bind(&input.id)
            .execute(&mut *tx)
            .await?;
        } else if let Some(new_pin) = &input.new_pin {
            if !new_pin.trim().is_empty() {
                let salt = PasswordHasher::generate_salt();
                let hash = PasswordHasher::hash_credential(new_pin.trim(), &salt);
                sqlx::query(
                    "UPDATE user_profiles SET authentication_enabled = 1, auth_type = 'pin', pin_hash = ?, pin_salt = ?, password_hash = NULL, password_salt = NULL, updated_at = ? WHERE id = ?"
                )
                .bind(hash)
                .bind(salt)
                .bind(now)
                .bind(&input.id)
                .execute(&mut *tx)
                .await?;
            }
        } else if let Some(new_pwd) = &input.new_password {
            if !new_pwd.trim().is_empty() {
                let salt = PasswordHasher::generate_salt();
                let hash = PasswordHasher::hash_credential(new_pwd.trim(), &salt);
                sqlx::query(
                    "UPDATE user_profiles SET authentication_enabled = 1, auth_type = 'password', password_hash = ?, password_salt = ?, pin_hash = NULL, pin_salt = NULL, updated_at = ? WHERE id = ?"
                )
                .bind(hash)
                .bind(salt)
                .bind(now)
                .bind(&input.id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;

        Self::get_by_id(pool, &input.id)
            .await?
            .ok_or_else(|| AppError::Generic("Profile not found after update".into()))
    }

    pub async fn set_default_profile(pool: &DbPool, id: &str) -> AppResult<()> {
        let mut tx = pool.begin().await?;
        sqlx::query("UPDATE user_profiles SET is_default = 0")
            .execute(&mut *tx)
            .await?;
        sqlx::query("UPDATE user_profiles SET is_default = 1 WHERE id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(())
    }

    pub async fn link_google_account(
        pool: &DbPool,
        profile_id: &str,
        google_account_id: &str,
        google_email: &str,
    ) -> AppResult<()> {
        let profile = Self::get_by_id(pool, profile_id)
            .await?
            .ok_or_else(|| AppError::Generic("Profile not found".into()))?;

        let sync_id = profile
            .sync_profile_id
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        let id = Uuid::new_v4().to_string();

        sqlx::query(
            r#"
            INSERT INTO profile_cloud_links (id, profile_id, sync_profile_id, google_account_id, google_email)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(profile_id, google_account_id) DO UPDATE SET
                google_email = excluded.google_email,
                last_sync_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(id)
        .bind(profile_id)
        .bind(&sync_id)
        .bind(google_account_id)
        .bind(google_email)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn unlink_google_account(pool: &DbPool, profile_id: &str) -> AppResult<()> {
        sqlx::query("DELETE FROM profile_cloud_links WHERE profile_id = ?")
            .bind(profile_id)
            .execute(pool)
            .await?;
        Ok(())
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

        // 4. Create second profile with PIN
        let p2 = ProfileRepository::create_full(
            &pool,
            &CreateProfileInput {
                display_name: "GuestWithPIN".into(),
                avatar_path: None,
                auth_type: "pin".into(),
                pin: Some("1234".into()),
                password: None,
                theme_preference: Some("neon".into()),
                preferred_controller: Some("xbox".into()),
            },
        )
        .await
        .expect("Failed to create PIN profile");

        assert!(p2.authentication_enabled);
        assert_eq!(p2.auth_type, "pin");

        // Test PIN verification
        let ok_auth = ProfileRepository::verify_credentials(&pool, &p2.id, "1234")
            .await
            .unwrap();
        assert!(ok_auth);

        let bad_auth = ProfileRepository::verify_credentials(&pool, &p2.id, "9999")
            .await
            .unwrap();
        assert!(!bad_auth);

        // 5. Delete first profile
        let del_ok = ProfileRepository::delete(&pool, &p1.id).await;
        assert!(del_ok.is_ok());

        let final_list = ProfileRepository::list(&pool).await.unwrap();
        assert_eq!(final_list.len(), 1);
        assert_eq!(final_list[0].id, p2.id);
    }

    #[tokio::test]
    async fn test_profile_update_and_cloud_linking() {
        let pool = setup_test_db().await;

        let p = ProfileRepository::create(&pool, "AlexGamer", None)
            .await
            .unwrap();

        // 1. Update Profile
        let updated = ProfileRepository::update_profile(
            &pool,
            &UpdateProfileInput {
                id: p.id.clone(),
                display_name: Some("AlexTheLegend".into()),
                avatar_path: Some("https://example.com/avatar.png".into()),
                theme_preference: Some("cyberpunk".into()),
                preferred_controller: Some("playstation".into()),
                auth_type: Some("password".into()),
                new_pin: None,
                new_password: Some("secret123".into()),
                remove_auth: Some(false),
            },
        )
        .await
        .unwrap();

        assert_eq!(updated.display_name, "AlexTheLegend");
        assert_eq!(updated.theme_preference, "cyberpunk");
        assert_eq!(updated.preferred_controller, Some("playstation".into()));
        assert!(updated.authentication_enabled);

        // Verify password
        let pass_ok = ProfileRepository::verify_credentials(&pool, &p.id, "secret123")
            .await
            .unwrap();
        assert!(pass_ok);

        // 2. Link Google Account
        ProfileRepository::link_google_account(
            &pool,
            &p.id,
            "google-user-777",
            "alex@gamemail.com",
        )
        .await
        .unwrap();

        let linked_profile = ProfileRepository::get_by_id(&pool, &p.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(
            linked_profile.linked_google_email,
            Some("alex@gamemail.com".into())
        );

        // 3. Unlink Google Account
        ProfileRepository::unlink_google_account(&pool, &p.id)
            .await
            .unwrap();

        let unlinked_profile = ProfileRepository::get_by_id(&pool, &p.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(unlinked_profile.linked_google_email, None);
    }
}
