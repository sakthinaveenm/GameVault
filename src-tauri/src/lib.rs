pub mod commands;
pub mod errors;
pub mod models;
pub mod platform;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::ping,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Universal Game Hub");
}
