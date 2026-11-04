use std::path::PathBuf;

pub struct PlatformAdapter;

impl PlatformAdapter {
    pub fn get_os() -> &'static str {
        std::env::consts::OS
    }

    pub fn get_arch() -> &'static str {
        std::env::consts::ARCH
    }

    pub fn get_app_data_dir() -> PathBuf {
        dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("UniversalGameHub")
    }

    pub fn get_default_game_dirs() -> Vec<PathBuf> {
        let mut dirs_list = Vec::new();
        #[cfg(target_os = "macos")]
        {
            dirs_list.push(PathBuf::from("/Applications"));
            if let Some(home) = dirs::home_dir() {
                dirs_list.push(home.join("Applications"));
                dirs_list.push(home.join("Games"));
            }
        }
        #[cfg(target_os = "windows")]
        {
            dirs_list.push(PathBuf::from("C:\\Games"));
            dirs_list.push(PathBuf::from("C:\\Program Files"));
            dirs_list.push(PathBuf::from("C:\\Program Files (x86)"));
        }
        #[cfg(target_os = "linux")]
        {
            if let Some(home) = dirs::home_dir() {
                dirs_list.push(home.join("Games"));
                dirs_list.push(home.join(".local/share/applications"));
            }
            dirs_list.push(PathBuf::from("/usr/share/applications"));
        }
        dirs_list
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_platform_os_detection() {
        let os = PlatformAdapter::get_os();
        assert!(!os.is_empty());
        let arch = PlatformAdapter::get_arch();
        assert!(!arch.is_empty());
    }

    #[test]
    fn test_app_data_directory() {
        let path = PlatformAdapter::get_app_data_dir();
        assert!(path.to_string_lossy().contains("UniversalGameHub"));
    }

    #[test]
    fn test_default_game_dirs() {
        let dirs = PlatformAdapter::get_default_game_dirs();
        assert!(!dirs.is_empty());
    }
}
