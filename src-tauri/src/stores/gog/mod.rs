use crate::models::Game;
use std::path::{Path, PathBuf};

pub struct GogDetector;

impl GogDetector {
    pub fn get_gog_games_dir() -> Option<PathBuf> {
        #[cfg(target_os = "macos")]
        {
            if let Some(home) = dirs::home_dir() {
                let p = home.join("GOG Games");
                if p.exists() {
                    return Some(p);
                }
            }
        }
        #[cfg(target_os = "windows")]
        {
            let p = PathBuf::from("C:\\GOG Games");
            if p.exists() {
                return Some(p);
            }
        }
        None
    }

    pub fn discover_installed_games(_root: &Path) -> Vec<Game> {
        // GOG standalone game scan
        Vec::new()
    }
}
