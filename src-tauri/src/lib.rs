pub mod batocera;
pub mod commands;
pub mod controllers;
pub mod database;
pub mod emulators;
pub mod errors;
pub mod games;
pub mod metadata;
pub mod models;
pub mod platform;
pub mod repositories;
pub mod save_manager;
pub mod security;
pub mod stores;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let controller_manager = controllers::ControllerManager::new()
        .expect("Failed to initialize Gilrs controller subsystem");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            app.manage(controller_manager);

            let app_data_dir = platform::PlatformAdapter::get_app_data_dir();
            let db_path = app_data_dir.join("universal_game_hub.sqlite");
            
            tauri::async_runtime::block_on(async {
                let db_manager = database::DatabaseManager::init(&db_path)
                    .await
                    .expect("Failed to initialize SQLite database");
                app.manage(db_manager.pool().clone());
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::ping,
            commands::list_controllers,
            commands::poll_controller_event,
            commands::list_profiles,
            commands::create_profile,
            commands::delete_profile,
            commands::scan_directory_for_games,
            commands::list_games,
            commands::upsert_game,
            commands::toggle_game_favorite,
            commands::record_game_playtime,
            commands::delete_game,
            commands::launch_game,
            commands::discover_store_games,
            commands::get_game_metadata,
            commands::cache_game_metadata,
            commands::get_known_emulators,
            commands::launch_rom,
            commands::ping_batocera_node,
            commands::create_game_save_snapshot,
            commands::list_save_snapshots,
            commands::restore_save_snapshot,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Universal Game Hub");
}
