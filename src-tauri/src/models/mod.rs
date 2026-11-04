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
#[serde(rename_all = "camelCase")]
pub struct Game {
    pub id: String,
    pub title: String,
    #[serde(alias = "sort_title")]
    pub sort_title: Option<String>,
    pub summary: Option<String>,
    pub developer: Option<String>,
    pub publisher: Option<String>,
    #[serde(alias = "release_date")]
    pub release_date: Option<String>,
    pub source: GameSource,
    pub platform: String,
    #[serde(alias = "store_id")]
    pub store_id: Option<String>,
    #[serde(alias = "executable_path")]
    pub executable_path: Option<String>,
    #[serde(alias = "launch_arguments")]
    pub launch_arguments: Option<String>,
    #[serde(alias = "working_directory")]
    pub working_directory: Option<String>,
    #[serde(alias = "cover_url")]
    pub cover_url: Option<String>,
    #[serde(alias = "banner_url")]
    pub banner_url: Option<String>,
    #[serde(alias = "icon_url")]
    pub icon_url: Option<String>,
    pub installed: bool,
    #[serde(alias = "is_favorite", default)]
    pub is_favorite: bool,
    #[serde(alias = "playtime_minutes", default)]
    pub playtime_minutes: i64,
    #[serde(alias = "last_played_at")]
    pub last_played_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub id: String,
    #[serde(alias = "display_name")]
    pub display_name: String,
    #[serde(alias = "avatar_path")]
    pub avatar_path: Option<String>,
    #[serde(alias = "is_default", default)]
    pub is_default: bool,
    #[serde(alias = "created_at", default = "Utc::now")]
    pub created_at: DateTime<Utc>,
    #[serde(alias = "updated_at", default = "Utc::now")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSnapshot {
    pub id: String,
    #[serde(alias = "profile_id")]
    pub profile_id: String,
    #[serde(alias = "game_id")]
    pub game_id: String,
    #[serde(alias = "device_id")]
    pub device_id: String,
    #[serde(alias = "snapshot_hash")]
    pub snapshot_hash: String,
    #[serde(alias = "archive_path")]
    pub archive_path: String,
    #[serde(alias = "compressed_size", default)]
    pub compressed_size: i64,
    #[serde(alias = "cloud_status")]
    pub cloud_status: String,
    #[serde(alias = "created_at", default = "Utc::now")]
    pub created_at: DateTime<Utc>,
    #[serde(alias = "file_count", default)]
    pub file_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Emulator {
    pub id: String,
    pub name: String,
    #[serde(alias = "executable_path")]
    pub executable_path: String,
    #[serde(alias = "system_id")]
    pub system_id: String,
    #[serde(alias = "supported_extensions", default)]
    pub supported_extensions: Vec<String>,
    #[serde(alias = "default_arguments")]
    pub default_arguments: Option<String>,
    #[serde(default)]
    pub detected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    #[serde(alias = "app_version")]
    pub app_version: String,
    #[serde(alias = "app_data_dir")]
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
