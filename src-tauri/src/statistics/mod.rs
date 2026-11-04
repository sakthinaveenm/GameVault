use crate::database::DbPool;
use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopPlayedGame {
    pub id: String,
    pub title: String,
    pub playtime_minutes: i64,
    pub cover_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileStatistics {
    pub total_playtime_minutes: i64,
    pub total_games: i64,
    pub installed_games: i64,
    pub favorite_games: i64,
    pub platform_breakdown: HashMap<String, i64>,
    pub top_played_games: Vec<TopPlayedGame>,
}

pub struct StatisticsService;

impl StatisticsService {
    pub async fn get_profile_statistics(
        pool: &DbPool,
        profile_id: &str,
    ) -> Result<ProfileStatistics, AppError> {
        // Total playtime
        let total_playtime_minutes: (i64,) = sqlx::query_as(
            "SELECT COALESCE(SUM(playtime_minutes), 0) FROM profile_game_data WHERE profile_id = ?"
        )
        .bind(profile_id)
        .fetch_one(pool)
        .await
        .map_err(AppError::Database)?;

        // Total games
        let total_games: (i64,) = sqlx::query_as(
            "SELECT COUNT(game_id) FROM profile_game_data WHERE profile_id = ?"
        )
        .bind(profile_id)
        .fetch_one(pool)
        .await
        .map_err(AppError::Database)?;

        // Installed games
        let installed_games: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(g.id) 
            FROM games g
            INNER JOIN profile_game_data pg ON g.id = pg.game_id
            WHERE pg.profile_id = ? AND g.installed = 1
            "#
        )
        .bind(profile_id)
        .fetch_one(pool)
        .await
        .map_err(AppError::Database)?;

        // Favorite games
        let favorite_games: (i64,) = sqlx::query_as(
            "SELECT COUNT(game_id) FROM profile_game_data WHERE profile_id = ? AND is_favorite = 1"
        )
        .bind(profile_id)
        .fetch_one(pool)
        .await
        .map_err(AppError::Database)?;

        // Platform breakdown
        let platform_rows: Vec<(String, i64)> = sqlx::query_as(
            r#"
            SELECT g.platform, COUNT(g.id)
            FROM games g
            INNER JOIN profile_game_data pg ON g.id = pg.game_id
            WHERE pg.profile_id = ?
            GROUP BY g.platform
            "#
        )
        .bind(profile_id)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)?;

        let mut platform_breakdown = HashMap::new();
        for (platform, count) in platform_rows {
            platform_breakdown.insert(platform, count);
        }

        // Top played games
        let top_rows: Vec<(String, String, i64, Option<String>)> = sqlx::query_as(
            r#"
            SELECT g.id, g.title, pg.playtime_minutes, g.cover_url
            FROM games g
            INNER JOIN profile_game_data pg ON g.id = pg.game_id
            WHERE pg.profile_id = ?
            ORDER BY pg.playtime_minutes DESC
            LIMIT 5
            "#
        )
        .bind(profile_id)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)?;

        let top_played_games = top_rows
            .into_iter()
            .map(|(id, title, playtime_minutes, cover_url)| TopPlayedGame {
                id,
                title,
                playtime_minutes,
                cover_url,
            })
            .collect();

        Ok(ProfileStatistics {
            total_playtime_minutes: total_playtime_minutes.0,
            total_games: total_games.0,
            installed_games: installed_games.0,
            favorite_games: favorite_games.0,
            platform_breakdown,
            top_played_games,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::DatabaseManager;
    use crate::models::{Game, GameSource};
    use crate::repositories::game_repository::GameRepository;
    use crate::repositories::profile_repository::ProfileRepository;

    #[tokio::test]
    async fn test_profile_statistics_aggregation() {
        let db = DatabaseManager::init_in_memory().await.unwrap();
        let pool = db.pool();

        let profile = ProfileRepository::create(pool, "Stats Gamer", None)
            .await
            .unwrap();

        let game1 = Game {
            id: "game-stats-1".into(),
            title: "Super Game Alpha".into(),
            sort_title: None,
            summary: None,
            developer: None,
            publisher: None,
            release_date: None,
            source: GameSource::Steam,
            platform: "pc".into(),
            store_id: None,
            executable_path: None,
            launch_arguments: None,
            working_directory: None,
            cover_url: None,
            banner_url: None,
            icon_url: None,
            installed: true,
            is_favorite: true,
            playtime_minutes: 120,
            last_played_at: None,
        };
        GameRepository::upsert(pool, &game1).await.unwrap();
        GameRepository::toggle_favorite(pool, &profile.id, &game1.id, true)
            .await
            .unwrap();
        GameRepository::add_playtime(pool, &profile.id, &game1.id, 120)
            .await
            .unwrap();

        let game2 = Game {
            id: "game-stats-2".into(),
            title: "Retro Odyssey".into(),
            sort_title: None,
            summary: None,
            developer: None,
            publisher: None,
            release_date: None,
            source: GameSource::Retro,
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
            playtime_minutes: 60,
            last_played_at: None,
        };
        GameRepository::upsert(pool, &game2).await.unwrap();
        GameRepository::add_playtime(pool, &profile.id, &game2.id, 60)
            .await
            .unwrap();

        let stats = StatisticsService::get_profile_statistics(pool, &profile.id)
            .await
            .unwrap();

        assert_eq!(stats.total_playtime_minutes, 180);
        assert_eq!(stats.total_games, 2);
        assert_eq!(stats.installed_games, 2);
        assert_eq!(stats.favorite_games, 1);
        assert_eq!(*stats.platform_breakdown.get("pc").unwrap_or(&0), 1);
        assert_eq!(*stats.platform_breakdown.get("snes").unwrap_or(&0), 1);
        assert_eq!(stats.top_played_games.len(), 2);
        assert_eq!(stats.top_played_games[0].title, "Super Game Alpha");
    }
}
