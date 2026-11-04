pub mod epic;
pub mod gog;
pub mod steam;

use crate::models::Game;
use epic::EpicDetector;
use steam::SteamDetector;
use std::collections::HashSet;

pub struct StoreManager;

impl StoreManager {
    pub fn discover_all_stores() -> Vec<Game> {
        let mut discovered = Vec::new();

        // 1. Steam
        if let Some(steam_dir) = SteamDetector::get_steam_path() {
            let steam_games = SteamDetector::discover_installed_games(&steam_dir);
            discovered.extend(steam_games);
        }

        // 2. Epic Games
        if let Some(epic_dir) = EpicDetector::get_manifests_dir() {
            let epic_games = EpicDetector::discover_installed_games(&epic_dir);
            discovered.extend(epic_games);
        }

        // Deduplicate games by normalized title
        let mut unique_titles = HashSet::new();
        let mut deduplicated = Vec::new();

        for game in discovered {
            let normalized = game
                .title
                .to_lowercase()
                .chars()
                .filter(|c| c.is_alphanumeric())
                .collect::<String>();

            if unique_titles.insert(normalized) {
                deduplicated.push(game);
            }
        }

        deduplicated
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_store_manager_discovery_runs() {
        let games = StoreManager::discover_all_stores();
        // May find 0 or more games depending on runner environment
        let _ = games.len();
    }
}
