pub mod batocera;
pub mod cloud;
pub mod commands;
pub mod controllers;
pub mod database;
pub mod downloads;
pub mod emulators;
pub mod errors;
pub mod games;
pub mod metadata;
pub mod models;
pub mod platform;
pub mod repositories;
pub mod save_manager;
pub mod security;
pub mod statistics;
pub mod stores;
pub mod sync_engine;

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
                let db_manager = match database::DatabaseManager::init(&db_path).await {
                    Ok(mgr) => mgr,
                    Err(err) => {
                        eprintln!(
                            "Warning: Failed to initialize SQLite database at {:?}: {}. Falling back to in-memory database.",
                            db_path, err
                        );
                        database::DatabaseManager::init_in_memory()
                            .await
                            .expect("Failed to initialize in-memory SQLite database fallback")
                    }
                };
                app.manage(db_manager.pool().clone());
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::get_default_game_directories,
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
            commands::get_profile_statistics,
            commands::list_downloads,
            commands::queue_download,
            commands::execute_downloaded_installer,
            commands::generate_oauth_pkce,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Universal Game Hub");
}
