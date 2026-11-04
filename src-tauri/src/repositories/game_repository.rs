use crate::database::DbPool;
use crate::errors::AppResult;
use crate::models::{Game, GameSource};
use chrono::Utc;
use sqlx::Row;

pub struct GameRepository;

impl GameRepository {
    pub async fn list_for_profile(pool: &DbPool, profile_id: &str) -> AppResult<Vec<Game>> {
        let rows = sqlx::query(
            r#"
            SELECT 
                g.id, g.title, g.sort_title, g.summary, g.developer, g.publisher,
                g.release_date, g.source, g.platform, g.store_id, g.executable_path,
                g.launch_arguments, g.working_directory, g.cover_url, g.banner_url,
                g.icon_url, g.installed,
                COALESCE(pgd.is_favorite, 0) as is_favorite,
                COALESCE(pgd.playtime_minutes, 0) as playtime_minutes,
                pgd.last_played_at
            FROM games g
            LEFT JOIN profile_game_data pgd 
                ON g.id = pgd.game_id AND pgd.profile_id = ?
            ORDER BY g.title ASC
            "#,
        )
        .bind(profile_id)
        .fetch_all(pool)
        .await?;

        let mut games = Vec::new();
        for row in rows {
            let source_str: String = row.get("source");
            let source = match source_str.as_str() {
                "steam" => GameSource::Steam,
                "epic" => GameSource::Epic,
                "gog" => GameSource::Gog,
                "retro" => GameSource::Retro,
                "batocera" => GameSource::Batocera,
                _ => GameSource::Local,
            };

            games.push(Game {
                id: row.get("id"),
                title: row.get("title"),
                sort_title: row.get("sort_title"),
                summary: row.get("summary"),
                developer: row.get("developer"),
                publisher: row.get("publisher"),
                release_date: row.get("release_date"),
                source,
                platform: row.get("platform"),
                store_id: row.get("store_id"),
                executable_path: row.get("executable_path"),
                launch_arguments: row.get("launch_arguments"),
                working_directory: row.get("working_directory"),
                cover_url: row.get("cover_url"),
                banner_url: row.get("banner_url"),
                icon_url: row.get("icon_url"),
                installed: row.get::<i64, _>("installed") == 1,
                is_favorite: row.get::<i64, _>("is_favorite") == 1,
                playtime_minutes: row.get("playtime_minutes"),
                last_played_at: row.get("last_played_at"),
            });
        }
        Ok(games)
    }

    pub async fn upsert(pool: &DbPool, game: &Game) -> AppResult<()> {
        let source_str = match game.source {
            GameSource::Steam => "steam",
            GameSource::Epic => "epic",
            GameSource::Gog => "gog",
            GameSource::Retro => "retro",
            GameSource::Batocera => "batocera",
            GameSource::Local => "local",
        };

        sqlx::query(
            r#"
            INSERT INTO games (
                id, title, sort_title, summary, developer, publisher,
                release_date, source, platform, store_id, executable_path,
                launch_arguments, working_directory, cover_url, banner_url,
                icon_url, installed, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                summary = excluded.summary,
                executable_path = excluded.executable_path,
                launch_arguments = excluded.launch_arguments,
                cover_url = excluded.cover_url,
                banner_url = excluded.banner_url,
                installed = excluded.installed,
                updated_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(&game.id)
        .bind(&game.title)
        .bind(&game.sort_title)
        .bind(&game.summary)
        .bind(&game.developer)
        .bind(&game.publisher)
        .bind(&game.release_date)
        .bind(source_str)
        .bind(&game.platform)
        .bind(&game.store_id)
        .bind(&game.executable_path)
        .bind(&game.launch_arguments)
        .bind(&game.working_directory)
        .bind(&game.cover_url)
        .bind(&game.banner_url)
        .bind(&game.icon_url)
        .bind(if game.installed { 1 } else { 0 })
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn toggle_favorite(
        pool: &DbPool,
        profile_id: &str,
        game_id: &str,
        is_favorite: bool,
    ) -> AppResult<()> {
        sqlx::query(
            r#"
            INSERT INTO profile_game_data (profile_id, game_id, is_favorite)
            VALUES (?, ?, ?)
            ON CONFLICT(profile_id, game_id) DO UPDATE SET
                is_favorite = excluded.is_favorite
            "#,
        )
        .bind(profile_id)
        .bind(game_id)
        .bind(if is_favorite { 1 } else { 0 })
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn add_playtime(
        pool: &DbPool,
        profile_id: &str,
        game_id: &str,
        additional_minutes: i64,
    ) -> AppResult<()> {
        let now = Utc::now();
        sqlx::query(
            r#"
            INSERT INTO profile_game_data (profile_id, game_id, playtime_minutes, last_played_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(profile_id, game_id) DO UPDATE SET
                playtime_minutes = playtime_minutes + excluded.playtime_minutes,
                last_played_at = excluded.last_played_at
            "#,
        )
        .bind(profile_id)
        .bind(game_id)
        .bind(additional_minutes)
        .bind(now)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn delete(pool: &DbPool, game_id: &str) -> AppResult<()> {
        sqlx::query("DELETE FROM games WHERE id = ?")
            .bind(game_id)
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
    async fn test_game_repository_crud() {
        let pool = setup_test_db().await;

        // Create profiles first so foreign keys are satisfied
        crate::repositories::profile_repository::ProfileRepository::create(&pool, "prof-1", None)
            .await
            .unwrap();
        crate::repositories::profile_repository::ProfileRepository::create(&pool, "prof-2", None)
            .await
            .unwrap();

        // Get actual profile IDs
        let profiles = crate::repositories::profile_repository::ProfileRepository::list(&pool)
            .await
            .unwrap();
        let prof1_id = &profiles[0].id;
        let prof2_id = &profiles[1].id;

        let game = Game {
            id: "game-101".into(),
            title: "Celeste".into(),
            sort_title: None,
            summary: Some("Precision platformer".into()),
            developer: Some("Maddy Makes Games".into()),
            publisher: None,
            release_date: None,
            source: GameSource::Local,
            platform: "macos".into(),
            store_id: None,
            executable_path: Some("/Applications/Celeste.app".into()),
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

        // Insert
        GameRepository::upsert(&pool, &game).await.unwrap();

        // List for profile 1
        let list = GameRepository::list_for_profile(&pool, prof1_id)
            .await
            .unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].title, "Celeste");
        assert!(!list[0].is_favorite);

        // Toggle Favorite for profile 1
        GameRepository::toggle_favorite(&pool, prof1_id, "game-101", true)
            .await
            .unwrap();

        let updated_list = GameRepository::list_for_profile(&pool, prof1_id)
            .await
            .unwrap();
        assert!(updated_list[0].is_favorite);

        // Add Playtime
        GameRepository::add_playtime(&pool, prof1_id, "game-101", 45)
            .await
            .unwrap();

        let list_playtime = GameRepository::list_for_profile(&pool, prof1_id)
            .await
            .unwrap();
        assert_eq!(list_playtime[0].playtime_minutes, 45);

        // Verify profile 2 isolation (different profile has 0 playtime)
        let list_prof2 = GameRepository::list_for_profile(&pool, prof2_id)
            .await
            .unwrap();
        assert_eq!(list_prof2[0].playtime_minutes, 0);
        assert!(!list_prof2[0].is_favorite);

        // Delete from launcher
        GameRepository::delete(&pool, "game-101").await.unwrap();
        let empty_list = GameRepository::list_for_profile(&pool, prof1_id)
            .await
            .unwrap();
        assert_eq!(empty_list.len(), 0);
    }
}
