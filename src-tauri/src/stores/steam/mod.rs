use crate::models::{Game, GameSource};
use std::fs;
use std::path::{Path, PathBuf};

pub struct SteamDetector;

impl SteamDetector {
    pub fn get_steam_path() -> Option<PathBuf> {
        #[cfg(target_os = "macos")]
        {
            if let Some(home) = dirs::home_dir() {
                let p = home.join("Library/Application Support/Steam");
                if p.exists() {
                    return Some(p);
                }
            }
        }
        #[cfg(target_os = "windows")]
        {
            let candidates = [
                PathBuf::from("D:\\Launchers\\Steam"),
                PathBuf::from("C:\\Program Files (x86)\\Steam"),
                PathBuf::from("C:\\Program Files\\Steam"),
                PathBuf::from("D:\\Steam"),
                PathBuf::from("E:\\Steam"),
            ];
            for p in &candidates {
                if p.exists() {
                    return Some(p.clone());
                }
            }
        }
        #[cfg(target_os = "linux")]
        {
            if let Some(home) = dirs::home_dir() {
                let p1 = home.join(".local/share/Steam");
                if p1.exists() {
                    return Some(p1);
                }
                let p2 = home.join(".steam/steam");
                if p2.exists() {
                    return Some(p2);
                }
            }
        }
        None
    }

    pub fn discover_installed_games(steam_root: &Path) -> Vec<Game> {
        let mut games = Vec::new();
        let mut library_dirs = Vec::new();
        let main_steamapps = steam_root.join("steamapps");
        if main_steamapps.exists() {
            library_dirs.push(main_steamapps.clone());
        }

        // Parse libraryfolders.vdf for any additional configured drive libraries
        let vdf_path = main_steamapps.join("libraryfolders.vdf");
        if vdf_path.exists() {
            if let Ok(content) = fs::read_to_string(&vdf_path) {
                for line in content.lines() {
                    let line = line.trim();
                    if line.starts_with("\"path\"") {
                        if let Some(folder_path) = Self::extract_quoted_value(line) {
                            let p = PathBuf::from(folder_path.replace("\\\\", "\\")).join("steamapps");
                            if p.exists() && !library_dirs.contains(&p) {
                                library_dirs.push(p);
                            }
                        }
                    }
                }
            }
        }

        // Parse appmanifest_*.acf files across all discovered library folders
        for steamapps in library_dirs {
            if let Ok(entries) = fs::read_dir(&steamapps) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if let Some(file_name) = path.file_name() {
                        let name_str = file_name.to_string_lossy();
                        if name_str.starts_with("appmanifest_") && name_str.ends_with(".acf") {
                            if let Ok(content) = fs::read_to_string(&path) {
                                if let Some(game) = Self::parse_acf(&content, &steamapps) {
                                    // Skip Steamworks redistributables runtime
                                    if game.store_id.as_deref() != Some("228980") {
                                        games.push(game);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        games
    }

    pub fn parse_acf(acf_content: &str, steamapps_dir: &Path) -> Option<Game> {
        let mut appid = None;
        let mut name = None;
        let mut installdir = None;

        for line in acf_content.lines() {
            let line = line.trim();
            if line.starts_with("\"appid\"") {
                appid = Self::extract_quoted_value(line);
            } else if line.starts_with("\"name\"") {
                name = Self::extract_quoted_value(line);
            } else if line.starts_with("\"installdir\"") {
                installdir = Self::extract_quoted_value(line);
            }
        }

        let appid = appid?;
        let title = name?;
        let install_folder = installdir.unwrap_or_default();
        let full_install_path = steamapps_dir.join("common").join(&install_folder);

        Some(Game {
            id: format!("steam-{}", appid),
            title,
            sort_title: None,
            summary: Some("Installed via Steam client".into()),
            developer: None,
            publisher: None,
            release_date: None,
            source: GameSource::Steam,
            platform: std::env::consts::OS.to_string(),
            store_id: Some(appid.clone()),
            executable_path: Some(full_install_path.to_string_lossy().to_string()),
            launch_arguments: Some(format!("steam://rungameid/{}", appid)),
            working_directory: Some(full_install_path.to_string_lossy().to_string()),
            cover_url: Some(format!(
                "https://steamcdn-a.akamaihd.net/steam/apps/{}/library_600x900.jpg",
                appid
            )),
            banner_url: Some(format!(
                "https://steamcdn-a.akamaihd.net/steam/apps/{}/header.jpg",
                appid
            )),
            icon_url: None,
            installed: true,
            is_favorite: false,
            playtime_minutes: 0,
            last_played_at: None,
        })
    }

    fn extract_quoted_value(line: &str) -> Option<String> {
        let parts: Vec<&str> = line.split('"').collect();
        if parts.len() >= 4 {
            Some(parts[3].to_string())
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_steam_acf() {
        let sample_acf = r#"
        "AppState"
        {
            "appid"		"1145360"
            "Universe"		"1"
            "name"		"Hades"
            "StateFlags"		"4"
            "installdir"		"Hades"
            "LastUpdated"		"1700000000"
            "SizeOnDisk"		"12345678"
        }
        "#;

        let game = SteamDetector::parse_acf(sample_acf, Path::new("/mock/steamapps"))
            .expect("Failed to parse sample ACF");

        assert_eq!(game.id, "steam-1145360");
        assert_eq!(game.title, "Hades");
        assert_eq!(game.source, GameSource::Steam);
        assert_eq!(game.store_id.as_deref(), Some("1145360"));
        assert!(game.launch_arguments.as_deref().unwrap().contains("steam://rungameid/1145360"));
        assert!(game.cover_url.as_deref().unwrap().contains("1145360"));
    }
}
