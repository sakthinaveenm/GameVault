use serde::{Deserialize, Serialize};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannedGameCandidate {
    pub title: String,
    pub executable_path: String,
    pub platform: String,
    pub file_size_bytes: u64,
}

pub struct GameScanner;

impl GameScanner {
    pub fn scan_directory(root_dir: &Path, max_depth: usize) -> Vec<ScannedGameCandidate> {
        let mut candidates = Vec::new();
        if !root_dir.exists() || !root_dir.is_dir() {
            return candidates;
        }

        let walker = WalkDir::new(root_dir)
            .max_depth(max_depth)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok());

        for entry in walker {
            let path = entry.path();
            if Self::is_game_candidate(path) {
                let title = Self::derive_title(path);
                let metadata = entry.metadata().ok();
                let file_size_bytes = metadata.map(|m| m.len()).unwrap_or(0);
                let platform = Self::detect_platform(path);

                candidates.push(ScannedGameCandidate {
                    title,
                    executable_path: path.to_string_lossy().to_string(),
                    platform,
                    file_size_bytes,
                });
            }
        }

        // Deduplicate by path
        candidates.sort_by(|a, b| a.executable_path.cmp(&b.executable_path));
        candidates.dedup_by(|a, b| a.executable_path == b.executable_path);

        candidates
    }

    fn is_game_candidate(path: &Path) -> bool {
        #[cfg(target_os = "macos")]
        {
            if let Some(ext) = path.extension() {
                if ext.eq_ignore_ascii_case("app") {
                    return true;
                }
            }
        }

        #[cfg(target_os = "windows")]
        {
            if let Some(ext) = path.extension() {
                if ext.eq_ignore_ascii_case("exe") {
                    let file_name = path.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
                    let is_helper = file_name.contains("unins")
                        || file_name.contains("crash")
                        || file_name.contains("helper")
                        || file_name.contains("redist")
                        || file_name.contains("quicksfv")
                        || file_name.contains("setup")
                        || file_name.contains("dxwebsetup")
                        || file_name.contains("installer")
                        || file_name.contains("cleanup")
                        || file_name.contains("uploader")
                        || file_name.contains("handler")
                        || file_name.contains("vcredist");
                    if !is_helper {
                        return true;
                    }
                }
            }
        }

        // ROM files for retro games
        if let Some(ext) = path.extension() {
            let ext_str = ext.to_string_lossy().to_lowercase();
            match ext_str.as_str() {
                "iso" | "sfc" | "smc" | "nes" | "cue" | "chd" | "gba" | "gbc" | "n64" | "z64" => {
                    return true;
                }
                _ => {}
            }
        }

        false
    }

    fn derive_title(path: &Path) -> String {
        if let Some(parent) = path.parent() {
            let p_name = parent.file_name().unwrap_or_default().to_string_lossy().to_string();
            let p_lower = p_name.to_lowercase();
            if p_lower == "retail" || p_lower == "binaries" || p_lower == "win64" || p_lower == "bin" || p_lower == "x64" {
                if let Some(gp) = parent.parent() {
                    let gp_name = gp.file_name().unwrap_or_default().to_string_lossy().to_string();
                    if !gp_name.is_empty() && gp_name != "Games" && gp_name != "common" {
                        return gp_name;
                    }
                }
            } else if !p_name.is_empty() && p_name != "Games" && p_name != "common" && !p_lower.contains("steam") {
                return p_name;
            }
        }

        let stem = path
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        stem.replace('_', " ").replace('-', " ")
    }

    fn detect_platform(path: &Path) -> String {
        if let Some(ext) = path.extension() {
            let ext_str = ext.to_string_lossy().to_lowercase();
            match ext_str.as_str() {
                "app" => return "macos".into(),
                "exe" => return "windows".into(),
                "sfc" | "smc" => return "snes".into(),
                "nes" => return "nes".into(),
                "gba" | "gbc" => return "gameboy".into(),
                "cue" | "chd" => return "ps1".into(),
                "n64" | "z64" => return "n64".into(),
                "iso" => return "ps2".into(),
                _ => {}
            }
        }
        std::env::consts::OS.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    #[test]
    fn test_game_scanner_with_synthetic_files() {
        let temp = tempdir().expect("Failed to create tempdir");
        let root = temp.path();

        // Create test fake game candidate
        let test_rom = root.join("Super Mario World.sfc");
        File::create(&test_rom).unwrap();

        let candidates = GameScanner::scan_directory(root, 3);
        assert_eq!(candidates.len(), 1);
        assert!(candidates[0].title.contains("Super Mario World"));
        assert_eq!(candidates[0].platform, "snes");
    }
}
