use crate::models::{Game, GameSource};
use serde::Deserialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Deserialize)]
pub struct EpicManifestItem {
    #[serde(rename = "DisplayName")]
    pub display_name: String,
    #[serde(rename = "AppName")]
    pub app_name: String,
    #[serde(rename = "InstallLocation")]
    pub install_location: String,
    #[serde(rename = "LaunchExecutable")]
    pub launch_executable: Option<String>,
}

pub struct EpicDetector;

impl EpicDetector {
    pub fn get_manifests_dir() -> Option<PathBuf> {
        #[cfg(target_os = "macos")]
        {
            let p = PathBuf::from("/Users/Shared/Epic Games");
            if p.exists() {
                return Some(p);
            }
        }
        #[cfg(target_os = "windows")]
        {
            let p = PathBuf::from("C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests");
            if p.exists() {
                return Some(p);
            }
        }
        None
    }

    pub fn discover_installed_games(manifests_dir: &Path) -> Vec<Game> {
        let mut games = Vec::new();
        if !manifests_dir.exists() {
            return games;
        }

        if let Ok(entries) = fs::read_dir(manifests_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Some(ext) = path.extension() {
                    if ext.eq_ignore_ascii_case("item") {
                        if let Ok(content) = fs::read_to_string(&path) {
                            if let Ok(manifest) = serde_json::from_str::<EpicManifestItem>(&content) {
                                games.push(Self::convert_to_game(manifest));
                            }
                        }
                    }
                }
            }
        }

        games
    }

    pub fn convert_to_game(manifest: EpicManifestItem) -> Game {
        let exe_path = manifest.launch_executable.map(|exe| {
            Path::new(&manifest.install_location)
                .join(exe)
                .to_string_lossy()
                .to_string()
        });

        Game {
            id: format!("epic-{}", manifest.app_name),
            title: manifest.display_name,
            sort_title: None,
            summary: Some("Installed via Epic Games Launcher".into()),
            developer: None,
            publisher: None,
            release_date: None,
            source: GameSource::Epic,
            platform: std::env::consts::OS.to_string(),
            store_id: Some(manifest.app_name.clone()),
            executable_path: exe_path,
            launch_arguments: Some(format!(
                "com.epicgames.launcher://apps/{}?action=launch&silent=true",
                manifest.app_name
            )),
            working_directory: Some(manifest.install_location),
            cover_url: None,
            banner_url: None,
            icon_url: None,
            installed: true,
            is_favorite: false,
            playtime_minutes: 0,
            last_played_at: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_epic_manifest() {
        let sample_json = r#"
        {
            "DisplayName": "Grand Theft Auto V",
            "AppName": "GTAV",
            "InstallLocation": "/Games/GTAV",
            "LaunchExecutable": "PlayGTAV.exe"
        }
        "#;

        let manifest: EpicManifestItem = serde_json::from_str(sample_json).unwrap();
        let game = EpicDetector::convert_to_game(manifest);

        assert_eq!(game.id, "epic-GTAV");
        assert_eq!(game.title, "Grand Theft Auto V");
        assert_eq!(game.source, GameSource::Epic);
        assert!(game.launch_arguments.as_deref().unwrap().contains("epicgames.launcher"));
    }
}

