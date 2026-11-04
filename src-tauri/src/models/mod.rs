use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum GameSource {
    Steam,
    Epic,
    Gog,
    Local,
    Retro,
    Batocera,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub sort_title: Option<String>,
    pub summary: Option<String>,
    pub developer: Option<String>,
    pub publisher: Option<String>,
    pub release_date: Option<String>,
    pub source: GameSource,
    pub platform: String,
    pub store_id: Option<String>,
    pub executable_path: Option<String>,
    pub launch_arguments: Option<String>,
    pub working_directory: Option<String>,
    pub cover_url: Option<String>,
    pub banner_url: Option<String>,
    pub icon_url: Option<String>,
    pub installed: bool,
    pub is_favorite: bool,
    pub playtime_minutes: i64,
    pub last_played_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: String,
    pub display_name: String,
    pub avatar_path: Option<String>,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveSnapshot {
    pub id: String,
    pub profile_id: String,
    pub game_id: String,
    pub device_id: String,
    pub snapshot_hash: String,
    pub archive_path: String,
    pub compressed_size: i64,
    pub cloud_status: String,
    pub created_at: DateTime<Utc>,
    pub file_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Emulator {
    pub id: String,
    pub name: String,
    pub executable_path: String,
    pub system_id: String,
    pub supported_extensions: Vec<String>,
    pub default_arguments: Option<String>,
    pub detected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub app_version: String,
    pub app_data_dir: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_game_serialization() {
        let game = Game {
            id: "test-game-1".into(),
            title: "Hades".into(),
            sort_title: None,
            summary: Some("Rogue-like dungeon crawler".into()),
            developer: Some("Supergiant Games".into()),
            publisher: Some("Supergiant Games".into()),
            release_date: Some("2020-09-17".into()),
            source: GameSource::Steam,
            platform: "macos".into(),
            store_id: Some("1145360".into()),
            executable_path: Some("/Applications/Hades.app".into()),
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

        let json = serde_json::to_string(&game).expect("Serialization failed");
        assert!(json.contains("Hades"));
        assert!(json.contains("steam"));

        let deserialized: Game = serde_json::from_str(&json).expect("Deserialization failed");
        assert_eq!(deserialized.id, "test-game-1");
        assert_eq!(deserialized.source, GameSource::Steam);
        assert!(deserialized.is_favorite);
    }

    #[test]
    fn test_user_profile_creation() {
        let now = Utc::now();
        let profile = UserProfile {
            id: "prof-1".into(),
            display_name: "RetroHero".into(),
            avatar_path: None,
            is_default: true,
            created_at: now,
            updated_at: now,
        };

        let json = serde_json::to_string(&profile).expect("Failed to serialize profile");
        assert!(json.contains("RetroHero"));
    }
}
