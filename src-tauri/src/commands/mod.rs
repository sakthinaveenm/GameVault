use crate::batocera::{BatoceraClient, BatoceraNodeInfo};
use crate::cloud::oauth::{OAuthManager, PkceSession};
use crate::controllers::{ControllerDevice, ControllerInputEvent, ControllerManager};
use crate::database::DbPool;
use crate::downloads::{DownloadItem, DownloadManager};
use crate::emulators::EmulatorRunner;
use crate::errors::AppError;
use crate::games::launcher::GameLauncher;
use crate::games::scanner::{GameScanner, ScannedGameCandidate};
use crate::metadata::igdb::{IgdbClient, IgdbGameMetadata};
use crate::models::{Emulator, Game, SaveSnapshot, SystemInfo, UserProfile};
use crate::platform::PlatformAdapter;
use crate::repositories::game_repository::GameRepository;
use crate::repositories::profile_repository::ProfileRepository;
use crate::save_manager::SaveService;
use crate::statistics::{ProfileStatistics, StatisticsService};
use crate::stores::StoreManager;
use std::path::PathBuf;

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

#[tauri::command]
pub fn list_controllers(
    manager: tauri::State<'_, ControllerManager>,
) -> Vec<ControllerDevice> {
    manager.list_controllers()
}

#[tauri::command]
pub fn poll_controller_event(
    manager: tauri::State<'_, ControllerManager>,
) -> Option<ControllerInputEvent> {
    manager.poll_next_event()
}

#[tauri::command]
pub async fn list_profiles(
    pool: tauri::State<'_, DbPool>,
) -> Result<Vec<UserProfile>, AppError> {
    ProfileRepository::list(&pool).await
}

#[tauri::command]
pub async fn create_profile(
    pool: tauri::State<'_, DbPool>,
    display_name: String,
    avatar_path: Option<String>,
) -> Result<UserProfile, AppError> {
    ProfileRepository::create(&pool, &display_name, avatar_path.as_deref()).await
}

#[tauri::command]
pub async fn delete_profile(
    pool: tauri::State<'_, DbPool>,
    id: String,
) -> Result<(), AppError> {
    ProfileRepository::delete(&pool, &id).await
}

#[tauri::command]
pub fn scan_directory_for_games(
    path: String,
    max_depth: Option<usize>,
) -> Vec<ScannedGameCandidate> {
    GameScanner::scan_directory(&PathBuf::from(path), max_depth.unwrap_or(3))
}

#[tauri::command]
pub async fn list_games(
    pool: tauri::State<'_, DbPool>,
    profile_id: String,
) -> Result<Vec<Game>, AppError> {
    GameRepository::list_for_profile(&pool, &profile_id).await
}

#[tauri::command]
pub async fn upsert_game(
    pool: tauri::State<'_, DbPool>,
    game: Game,
) -> Result<(), AppError> {
    GameRepository::upsert(&pool, &game).await
}

#[tauri::command]
pub async fn toggle_game_favorite(
    pool: tauri::State<'_, DbPool>,
    profile_id: String,
    game_id: String,
    is_favorite: bool,
) -> Result<(), AppError> {
    GameRepository::toggle_favorite(&pool, &profile_id, &game_id, is_favorite).await
}

#[tauri::command]
pub async fn record_game_playtime(
    pool: tauri::State<'_, DbPool>,
    profile_id: String,
    game_id: String,
    minutes: i64,
) -> Result<(), AppError> {
    GameRepository::add_playtime(&pool, &profile_id, &game_id, minutes).await
}

#[tauri::command]
pub async fn delete_game(
    pool: tauri::State<'_, DbPool>,
    game_id: String,
) -> Result<(), AppError> {
    GameRepository::delete(&pool, &game_id).await
}

#[tauri::command]
pub fn launch_game(
    executable_path: String,
    args: Vec<String>,
) -> Result<u32, AppError> {
    let mut child = GameLauncher::launch(&PathBuf::from(&executable_path), &args, None)?;
    let pid = child.id();
    
    // Spawn detached monitor to wait for child exit
    std::thread::spawn(move || {
        let _ = child.wait();
    });

    Ok(pid)
}

#[tauri::command]
pub fn discover_store_games() -> Vec<Game> {
    StoreManager::discover_all_stores()
}

#[tauri::command]
pub async fn get_game_metadata(
    pool: tauri::State<'_, DbPool>,
    title: String,
    platform: String,
) -> Result<Option<IgdbGameMetadata>, AppError> {
    IgdbClient::get_cached_metadata(&pool, &title, &platform).await
}

#[tauri::command]
pub async fn cache_game_metadata(
    pool: tauri::State<'_, DbPool>,
    title: String,
    platform: String,
    metadata: IgdbGameMetadata,
) -> Result<(), AppError> {
    IgdbClient::cache_metadata(&pool, &title, &platform, &metadata).await
}

#[tauri::command]
pub fn get_known_emulators() -> Vec<Emulator> {
    EmulatorRunner::get_known_emulators()
}

#[tauri::command]
pub fn launch_rom(
    emulator_path: String,
    custom_args: Option<String>,
    rom_path: String,
) -> Result<u32, AppError> {
    EmulatorRunner::launch_rom(
        &PathBuf::from(&emulator_path),
        custom_args.as_deref(),
        &PathBuf::from(&rom_path),
    )
}

#[tauri::command]
pub async fn ping_batocera_node(host: String, port: u16) -> BatoceraNodeInfo {
    BatoceraClient::ping_node(&host, port).await
}

#[tauri::command]
pub async fn create_game_save_snapshot(
    pool: tauri::State<'_, DbPool>,
    profile_id: String,
    game_id: String,
    save_dir: String,
) -> Result<SaveSnapshot, AppError> {
    SaveService::create_game_snapshot(
        &pool,
        &profile_id,
        &game_id,
        &PathBuf::from(save_dir),
    )
    .await
}

#[tauri::command]
pub async fn list_save_snapshots(
    pool: tauri::State<'_, DbPool>,
    profile_id: String,
    game_id: String,
) -> Result<Vec<SaveSnapshot>, AppError> {
    SaveService::list_snapshots_for_game(&pool, &profile_id, &game_id).await
}

#[tauri::command]
pub async fn restore_save_snapshot(
    pool: tauri::State<'_, DbPool>,
    snapshot_id: String,
    target_save_dir: String,
) -> Result<(), AppError> {
    SaveService::restore_snapshot(&pool, &snapshot_id, &PathBuf::from(target_save_dir)).await
}

#[tauri::command]
pub async fn get_profile_statistics(
    pool: tauri::State<'_, DbPool>,
    profile_id: String,
) -> Result<ProfileStatistics, AppError> {
    StatisticsService::get_profile_statistics(&pool, &profile_id).await
}

#[tauri::command]
pub async fn list_downloads(
    pool: tauri::State<'_, DbPool>,
) -> Result<Vec<DownloadItem>, AppError> {
    DownloadManager::list_downloads(&pool).await
}

#[tauri::command]
pub async fn queue_download(
    pool: tauri::State<'_, DbPool>,
    title: String,
    source_url: String,
    destination_path: String,
    expected_checksum: Option<String>,
) -> Result<DownloadItem, AppError> {
    DownloadManager::queue_download(
        &pool,
        &title,
        &source_url,
        &PathBuf::from(destination_path),
        expected_checksum.as_deref(),
    )
    .await
}

#[tauri::command]
pub fn execute_downloaded_installer(
    file_path: String,
    user_confirmed: bool,
) -> Result<u32, AppError> {
    DownloadManager::execute_installer(&PathBuf::from(file_path), user_confirmed)
}

#[tauri::command]
pub fn generate_oauth_pkce() -> PkceSession {
    OAuthManager::generate_pkce()
}
