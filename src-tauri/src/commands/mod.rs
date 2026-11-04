use crate::models::SystemInfo;
use crate::platform::PlatformAdapter;

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        os: PlatformAdapter::get_os().to_string(),
        arch: PlatformAdapter::get_arch().to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        app_data_dir: PlatformAdapter::get_app_data_dir().to_string_lossy().to_string(),
    }
}

#[tauri::command]
pub fn ping() -> String {
    "pong".to_string()
}
