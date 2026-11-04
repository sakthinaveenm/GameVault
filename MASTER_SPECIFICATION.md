# Project: Universal Game Hub

## 1. Project Overview

Build a lightweight, cross-platform desktop gaming launcher inspired by Steam Big Picture Mode, Playnite and modern console interfaces.

The application should unify:

- Installed PC games
- Steam, Epic Games and GOG libraries
- Retro games and emulators
- Batocera game libraries
- IGDB game metadata
- Controller-based navigation
- Local game management
- Legal game downloads and user-provided magnet links

The application must prioritize lightweight performance, fast startup, low RAM consumption, offline functionality and a polished full-screen gaming experience.

This must be a functional desktop application, not a UI prototype.

## 2. Mandatory Technology Stack

Desktop:
- Tauri 2

Backend:
- Rust
- Tokio
- Serde
- SQLx
- SQLite
- Reqwest
- WalkDir
- Tracing
- Gilrs

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Router
- Framer Motion
- Lucide Icons

Architecture:
- Local-first
- Modular backend
- Feature-based frontend
- Event-driven communication
- Offline-first database
- Cross-platform abstractions

Do not use Electron, Node.js as the desktop backend, or a permanently running remote server.

## 3. Supported Operating Systems

First-class targets:
- Windows 10/11
- Linux
- macOS

Use platform-specific adapters where necessary.

Do not assume executable formats, filesystem paths, game stores or emulator configurations are identical across platforms.

## 4. Main Application Interface

Create a premium gaming interface inspired by Steam Big Picture.

Visual requirements:
- Dark gaming theme
- Full-screen mode
- Large game cover cards
- Dynamic game backgrounds
- Smooth but restrained animations
- Controller-friendly navigation
- Responsive layouts
- Sidebar navigation
- Game details pages
- Search and filtering
- Recently played section
- Favorites
- Installed games section
- Retro games section
- Download manager
- Settings

The application must work with both controllers and mouse/keyboard.

## 5. Game Library Module

Implement automatic game discovery.

Supported sources:
- Steam
- Epic Games
- GOG
- Manually added games
- Locally installed games
- Emulator libraries

Features:
- Scan selected folders
- Detect installed games
- Store installation paths
- Detect executable files where possible
- Add custom launch arguments
- Edit game information
- Remove library entries without deleting game files
- Track playtime
- Track last played date
- Mark favorites
- Create custom collections
- Launch games
- Handle missing installations

Prevent duplicate game entries using platform identifiers and normalized paths.

Do not assume every detected executable is a game. Provide manual confirmation.

## 6. Controller Module

Support:
- Xbox controllers
- PlayStation controllers
- Generic XInput and SDL-compatible gamepads where available

Features:
- Controller detection
- Controller disconnect handling
- Navigation using D-pad
- Navigation using analog sticks
- Confirm and cancel buttons
- Back navigation
- Trigger and bumper support
- Configurable button mappings
- Controller-first navigation
- Controller settings screen

Use frontend Gamepad API for basic interface navigation and Rust device integration when needed.

Avoid double input from browser gamepad events and native controller events.

Provide keyboard navigation as a fallback.

## 7. IGDB Integration

Implement IGDB API integration.

Features:
- Search games
- Match game titles
- Fetch covers
- Fetch screenshots
- Fetch descriptions
- Fetch genres
- Fetch developers
- Fetch publishers
- Fetch release dates
- Fetch platforms

Use secure credential handling.

Never expose API secrets in frontend code.

Implement:
- Metadata caching
- Request throttling
- Retry handling
- Offline cache
- Manual metadata correction
- Duplicate matching protection

## 8. Retro Gaming Module

Support configurable integrations with:

- RetroArch
- PCSX2
- RPCS3
- PPSSPP
- Dolphin
- DuckStation
- MAME
- Other manually configured emulators

Features:
- Detect emulator installations where possible
- Configure emulator executable paths
- Configure ROM directories
- Associate ROM extensions with emulators
- Configure per-game launch arguments
- Display platform-specific game collections
- Launch games directly
- Track playtime

Do not distribute copyrighted ROMs or BIOS files.

## 9. Batocera Integration

Implement optional Batocera integration.

Features:
- Connect to a Batocera system over a local network
- Discover configured library locations
- Import game lists and metadata where supported
- Display remote game collections
- Launch games using documented supported mechanisms
- Handle network disconnections
- Support manual connection configuration

Do not assume that Windows paths can directly access Batocera files.

Clearly distinguish local games from remotely hosted games.

## 10. Download Manager

Implement a modular download manager.

Support:
- Official game downloads where permitted
- User-provided download URLs
- User-provided legal magnet links
- Progress tracking
- Pause and resume where supported
- Download speed
- Remaining time
- Storage location selection
- Download history
- Error handling

Do not scrape, index or automate unauthorized repack websites or distribute copyrighted game files.

Do not silently install downloaded executables.

Require user confirmation before executing installers or downloaded files.

## 11. Database

Use SQLite through SQLx.

Create database entities for:

- Games
- Platforms
- GameSources
- Installations
- Emulators
- Controllers
- Collections
- PlaySessions
- Downloads
- MetadataCache
- Settings
- ScanHistory

Requirements:
- Database migrations
- Foreign key constraints
- Indexed queries
- Transactions
- Safe schema upgrades
- Local backup and restore

The application must remain usable without an internet connection.

## 12. Rust Backend Architecture

Organize Rust modules by responsibility.

Suggested structure:

src-tauri/src/
- main.rs
- lib.rs
- commands/
- services/
- models/
- database/
- platforms/
- game_scanner/
- game_launcher/
- controllers/
- metadata/
- emulators/
- batocera/
- downloads/
- configuration/
- events/
- errors/

Keep business logic separate from Tauri commands.

Tauri commands should validate inputs and delegate work to services.

Use Tokio for asynchronous I/O.

Use bounded concurrency for game scanning and metadata retrieval.

Do not block the UI thread.

Use structured error types and meaningful error messages.

## 13. React Frontend Architecture

Organize by features.

src/
- app/
- components/
- features/
  - library/
  - game-details/
  - controller/
  - emulators/
  - batocera/
  - downloads/
  - settings/
  - search/
- hooks/
- services/
- stores/
- types/
- layouts/
- styles/

Create reusable components.

Use Zustand for shared UI state.

Use typed Tauri IPC wrappers.

Avoid unnecessary rerenders.

## 14. Performance Requirements

Performance is a top priority.

Requirements:
- Fast application startup
- Low idle CPU usage
- Low background RAM usage
- Lazy loading of large game artwork
- Image caching
- Virtualized game grids
- Incremental game scanning
- Background tasks
- Efficient SQLite queries
- No continuous unnecessary polling
- No excessive animations
- Avoid loading all game images simultaneously

Create performance benchmarks and document actual results rather than inventing performance figures.

## 15. Security

- Validate all user inputs.
- Restrict filesystem access to configured directories where possible.
- Avoid arbitrary shell execution.
- Never expose API credentials.
- Use safe process launching with argument arrays.
- Do not execute downloaded files automatically.
- Apply restrictive Tauri capabilities.
- Use explicit user confirmation for destructive operations.
- Keep network integrations optional.

## 16. Development Roadmap

Build in the following order.

Phase 1:
- Initialize Tauri 2
- Initialize React and TypeScript
- Create application shell
- Build navigation and gaming interface

Phase 2:
- Implement controller navigation
- Implement gamepad detection
- Implement configurable controls

Phase 3:
- Implement SQLite database
- Implement local game scanner
- Implement game launching

Phase 4:
- Implement IGDB metadata
- Implement artwork caching
- Implement search

Phase 5:
- Implement Steam, Epic and GOG discovery

Phase 6:
- Implement RetroArch and emulator integrations

Phase 7:
- Implement Batocera connectivity

Phase 8:
- Implement legal download management

Phase 9:
- Implement settings, backup and restore

Phase 10:
- Optimize performance
- Add automated tests
- Package Windows, Linux and macOS builds

## 17. AI Development Rules

Before implementing features:

1. Inspect the existing project.
2. Understand its architecture.
3. Create a development plan.
4. Implement one phase at a time.
5. Compile after each significant change.
6. Run tests.
7. Fix errors before proceeding.
8. Update documentation.
9. Never replace working functionality with mock data.
10. Never claim a feature works without testing it.

Use real functionality wherever possible.

If an external API or integration is unavailable, implement a clear interface and report the limitation.

Do not generate the entire project as one massive file.

Do not leave placeholder buttons that pretend to perform actions.

## 18. Final Deliverables

Produce:

- Complete source code
- Cargo configuration
- Frontend package configuration
- SQLite migrations
- Windows build
- Linux build
- macOS build
- Installation instructions
- User documentation
- Developer documentation
- Architecture documentation
- Testing documentation

The finished application should feel like a dedicated gaming console interface while remaining a lightweight desktop application.

# Additional Project Requirements: Cloud Saves, Google Drive and Profiles

Extend Universal Game Hub with a complete cloud synchronization and multi-profile system.

These are core application features, not optional UI mockups.

## 1. Profile Management System

Implement a multi-profile system.

Features:
- Create profiles.
- Edit profiles.
- Delete profiles with confirmation.
- Choose profile avatars.
- Set display names.
- Switch between profiles.
- Create guest profiles.
- Set a default profile.
- Maintain independent settings per profile.

Each profile must maintain:
- Game library preferences.
- Favorite games.
- Custom collections.
- Recently played games.
- Playtime statistics.
- Controller configuration.
- Emulator configuration.
- Save-game configuration.
- Cloud synchronization preferences.
- UI theme preferences.

Do not confuse local application profiles with Google accounts.

A local profile must work without signing into Google.

Allow a profile to optionally link to a Google account.

Implement profile-specific data isolation.

## 2. Google Authentication

Implement Google OAuth 2.0 for desktop applications.

Requirements:
- Sign in with Google.
- Display account email.
- Display account profile picture where permitted.
- Link Google account to a local profile.
- Disconnect Google account.
- Refresh expired access tokens.
- Handle revoked permissions.
- Handle authentication failures.
- Handle multiple linked accounts if supported.

Security:
- Use an appropriate desktop installed-app OAuth flow.
- Use PKCE where applicable.
- Do not embed a client secret.
- Never expose access tokens to the frontend unnecessarily.
- Store refresh tokens in Windows Credential Manager, macOS Keychain or an appropriate Linux secret service.
- Never synchronize OAuth credentials through Google Drive.
- Implement token revocation and account disconnection.

Use a Tauri deep-link callback or another supported secure desktop OAuth callback mechanism.

## 3. Google Drive Provider

Implement Google Drive API v3.

Create an abstraction:

CloudStorageProvider:
- authenticate()
- get_account_info()
- list_files()
- upload_file()
- download_file()
- update_file()
- delete_file()
- get_file_metadata()
- check_connection()

Implement:
- Google Drive provider.
- Provider-independent synchronization interface.
- Retry handling.
- Rate-limit handling.
- Resumable uploads.
- Download verification.
- Network interruption recovery.

Provide two storage configurations:

A. Private application storage:
Use Google Drive appDataFolder and the drive.appdata scope for application-managed backups.

B. User-visible storage:
Allow users to select an ordinary Google Drive folder through an appropriate user-authorized Drive integration.

Use the narrowest practical OAuth permissions.

Do not request unrestricted Drive access by default.

## 4. Save Game Manager

Create a dedicated save-game management system.

Features:
- Detect save directories where possible.
- Allow manual save directory configuration.
- Support per-game save paths.
- Support multiple save directories for one game.
- Support custom file patterns.
- Detect save changes.
- Calculate file hashes.
- Create save snapshots.
- Compress backups.
- Restore backups.
- Browse backup history.
- Delete old backups with confirmation.
- Configure retention limits.
- Support per-profile save configurations.

Implement a game save configuration database.

Support user-configured paths and maintain an extensible database of known game save locations.

Do not assume save locations are identical across operating systems.

Never delete original save files without explicit confirmation.

## 5. Automatic Save Backup

Implement this workflow:

1. Detect when a managed game starts.
2. Associate the process with the correct game and profile.
3. Monitor the process lifecycle.
4. Detect when the game exits.
5. Wait for save writes to finish.
6. Scan configured save directories.
7. Calculate file hashes.
8. Identify changed files.
9. Create a snapshot.
10. Compress the snapshot.
11. Queue cloud synchronization.
12. Upload when internet is available.
13. Update synchronization metadata.

Allow users to configure automatic backups.

Never continuously scan entire game directories.

Do not back up active save files while they are being written.

Where process detection is unreliable, provide manual backup and configurable delayed backup.

## 6. Cross-Device Save Synchronization

Implement a robust synchronization engine.

Requirements:
- Local-to-cloud synchronization.
- Cloud-to-local synchronization.
- Cross-device synchronization.
- Incremental synchronization.
- Hash-based file comparison.
- Snapshot history.
- Offline queue.
- Retry operations.
- Sync progress.
- Sync logs.
- Device identification.
- Last successful synchronization.
- Conflict detection.

Use a manifest containing:
- Profile ID.
- Game ID.
- Device ID.
- Snapshot ID.
- File paths.
- File sizes.
- File hashes.
- Modification timestamps.
- Cloud file identifiers.
- Manifest version.

Use a deterministic synchronization algorithm.

Do not rely exclusively on modification timestamps.

Use file hashes and snapshot identifiers.

## 7. Conflict Resolution

Conflicts must never result in silent data loss.

Example:
- Device A has save version 1.
- Device B has save version 2.
- Both devices have made changes offline.

When synchronization detects divergent versions:

1. Preserve both snapshots.
2. Mark the game as having a conflict.
3. Display a conflict notification.
4. Show both device names.
5. Show backup timestamps.
6. Allow the user to inspect available versions.
7. Let the user select the version to restore.
8. Keep the unselected version in backup history.

Never blindly overwrite newer local saves.

Before restoring:
- Confirm the game is not running.
- Create a local backup of the current save.
- Verify downloaded file hashes.
- Write restored files atomically where possible.
- Report errors clearly.

## 8. Cloud Backup Dashboard

Create a dedicated Cloud & Sync screen.

Display:
- Google account connection status.
- Linked account.
- Connected devices.
- Cloud storage usage where available.
- Last successful backup.
- Last synchronization.
- Pending uploads.
- Pending downloads.
- Failed operations.
- Save conflicts.
- Backup history.

Actions:
- Backup now.
- Sync now.
- Restore backup.
- Pause synchronization.
- Resume synchronization.
- Disconnect Google.
- Change cloud folder.
- Clear local synchronization queue with confirmation.

## 9. Sync Settings

Provide:
- Automatic synchronization toggle.
- Backup after game exit.
- Synchronize at application startup.
- Synchronize before launching a game.
- Wi-Fi/network availability handling.
- Maximum backup retention.
- Compression settings.
- Per-game sync enable/disable.
- Per-profile sync settings.
- Cloud storage location.
- Conflict notification settings.

Do not block game launching while an unrelated cloud operation is running.

If a game has unresolved save conflicts, show a warning before launching.

## 10. Encryption and Data Safety

Implement optional end-to-end encryption for save backups.

Use established cryptographic libraries and authenticated encryption.

Requirements:
- Encrypt backup archives before cloud upload.
- Keep encryption keys separate from cloud files.
- Use a user-controlled recovery key or passphrase.
- Never upload plaintext encryption keys.
- Support key rotation with safe migration.
- Provide a clear recovery procedure.
- Never claim a backup is encrypted until encryption is actually implemented and tested.

Use safe archive extraction:
- Prevent path traversal.
- Reject unsafe absolute paths.
- Reject symbolic links unless explicitly handled safely.
- Enforce extraction size limits.

## 11. Database Extensions

Add migrations for:

UserProfiles:
- id
- display_name
- avatar_path
- created_at
- updated_at
- is_default

LinkedAccounts:
- id
- profile_id
- provider
- provider_account_id
- email
- linked_at
- last_authenticated_at

Devices:
- id
- device_name
- operating_system
- profile_id
- last_seen_at

SaveConfigurations:
- id
- profile_id
- game_id
- save_path
- platform
- enabled
- backup_delay_seconds

SaveSnapshots:
- id
- profile_id
- game_id
- device_id
- snapshot_hash
- created_at
- compressed_size
- cloud_status

SaveFiles:
- id
- snapshot_id
- relative_path
- file_hash
- file_size

SyncJobs:
- id
- profile_id
- game_id
- operation
- status
- retry_count
- created_at
- completed_at

SyncConflicts:
- id
- game_id
- profile_id
- local_snapshot_id
- cloud_snapshot_id
- status
- detected_at
- resolved_at

SyncHistory:
- id
- operation
- status
- bytes_transferred
- started_at
- completed_at
- error_message

CloudFiles:
- id
- snapshot_id
- provider
- provider_file_id
- uploaded_at

Add foreign keys, indexes and appropriate uniqueness constraints.

Use database transactions for multi-step changes.

## 12. Frontend Screens

Add these pages:

- Profile Selection
- Profile Dashboard
- Profile Settings
- Google Account Connection
- Cloud Storage
- Cloud Synchronization
- Save Manager
- Save Backup History
- Save Conflict Resolution
- Connected Devices
- Synchronization Settings

The UI must be controller navigable.

Display useful loading, success, empty, offline and error states.

Never use fake synchronization indicators.

## 13. Performance

Prioritize low background resource consumption.

Requirements:
- Event-driven synchronization.
- No constant polling when idle.
- Hash only changed files where possible.
- Bounded parallel uploads.
- Background compression.
- Incremental manifests.
- Efficient SQLite queries.
- Pause background synchronization during demanding workloads if necessary.

## 14. Testing

Create tests for:
- Google authentication state handling.
- Token expiration.
- Drive upload.
- Drive download.
- Interrupted upload recovery.
- Snapshot creation.
- File hash verification.
- Save restoration.
- Conflict detection.
- Conflict resolution.
- Offline synchronization queue.
- Multiple profiles.
- Device synchronization.
- Encryption and decryption.
- Interrupted restoration.
- Database migrations.

Use temporary directories and synthetic save files for tests.

Never test destructive restoration against actual user game saves.

## 15. Implementation Order

Phase 1: Profile management and local database.

Phase 2: Save directory configuration and local backups.

Phase 3: Snapshot versioning and restore.

Phase 4: Google OAuth and Drive connectivity.

Phase 5: Cloud upload and download.

Phase 6: Cross-device manifest synchronization.

Phase 7: Conflict detection and resolution.

Phase 8: Encryption and recovery.

Phase 9: Cloud dashboard and settings.

Phase 10: Full integration testing and performance optimization.

Build one phase at a time.

Do not replace functional features with placeholders.

All operations must report real success or failure states.

Preserve existing game launcher functionality throughout development.

# UNIVERSAL GAME HUB
## Complete Product Requirements, Technical Architecture and Development Instructions

You are the principal software architect, senior Rust developer, senior React developer, UI/UX designer, QA engineer and release engineer responsible for building this application.

Your task is to design, develop, test and deliver a complete cross-platform desktop gaming launcher.

Do not build just a prototype or UI demonstration. Build a real, modular, maintainable desktop application with working functionality.

The project name is:

UNIVERSAL GAME HUB

==================================================
1. PRODUCT VISION
==================================================

Create a premium desktop gaming ecosystem inspired by:

- Steam Big Picture Mode
- Playnite
- LaunchBox Big Box
- RetroArch
- Modern gaming console dashboards

The application should bring all games into one unified gaming environment.

The application must support:

1. Installed PC games.
2. Steam game library integration.
3. Epic Games library integration.
4. GOG library integration.
5. Manually added games.
6. Retro games.
7. Emulator integration.
8. Batocera integration.
9. IGDB game metadata.
10. Xbox controllers.
11. PlayStation controllers.
12. Generic controllers.
13. Game save management.
14. Automatic save backups.
15. Cloud save synchronization.
16. Google Drive integration.
17. Google account authentication.
18. Multiple user profiles.
19. Game statistics and playtime.
20. Legal download management.
21. Offline functionality.
22. Cross-device synchronization.
23. Themes and customization.

The application must be lightweight, responsive and suitable for use on a television with a controller.

==================================================
2. MANDATORY TECHNOLOGY STACK
==================================================

Do not change the core technology stack without first explaining the technical reason and obtaining approval.

DESKTOP FRAMEWORK:
- Tauri 2

BACKEND:
- Rust
- Tokio
- Serde
- SQLx
- SQLite
- Reqwest
- WalkDir
- Tracing
- Thiserror
- Anyhow

FRONTEND:
- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Router
- Framer Motion
- Lucide React

DATABASE:
- SQLite
- SQLx migrations

CONTROLLER:
- Browser Gamepad API
- Evaluate SDL3 or Gilrs for native controller integration.
- Avoid duplicate input processing.

CLOUD:
- Google Drive API v3
- Google OAuth 2.0
- PKCE where applicable
- Tauri secure credential storage

GAME METADATA:
- IGDB API

IMAGE HANDLING:
- Local artwork cache
- Lazy loading
- WebP or AVIF where appropriate
- Thumbnail generation

TESTING:
- Rust unit tests
- Rust integration tests
- Vitest
- React Testing Library
- Playwright where appropriate

PACKAGING:
- Windows
- Linux
- macOS

Use maintained, compatible versions of libraries. Check official documentation before implementing integrations.

Do not introduce unnecessary dependencies.

==================================================
3. OPERATING SYSTEM SUPPORT
==================================================

First-class operating systems:

WINDOWS:
- Windows 10
- Windows 11

LINUX:
- Ubuntu
- Debian
- Fedora
- Arch-based distributions
- Other compatible Linux distributions

MACOS:
- Supported current macOS versions and hardware architectures.

Implement platform-specific modules.

Create a common interface for platform-dependent functionality.

Examples:

PlatformAdapter:
- get_os()
- get_app_data_directory()
- get_game_installation_paths()
- discover_game_stores()
- launch_game()
- detect_controllers()
- get_save_directories()
- get_system_information()

Do not hardcode Windows paths throughout the application.

Use proper platform directory conventions.

Do not assume Windows games are compatible with Linux or macOS.

==================================================
4. APPLICATION DESIGN
==================================================

Build a premium, modern gaming dashboard.

DESIGN DIRECTION:

- Dark gaming interface.
- Deep charcoal background.
- Subtle gradients.
- Large game artwork.
- Glass-like panels used sparingly.
- Smooth transitions.
- Minimal visual clutter.
- Premium console dashboard experience.
- Excellent readability on televisions.

Avoid:
- Excessive gradients.
- Excessive animations.
- Too many cards on screen.
- Small controller-unfriendly buttons.
- Excessive nested menus.
- Unnecessary visual decoration.

Use a consistent design system.

Create reusable components.

Support 16:9 desktop displays and different screen resolutions.

Support both standard window mode and fullscreen mode.

MAIN NAVIGATION:

1. Home
2. My Games
3. PC Games
4. Retro Games
5. Emulators
6. Batocera
7. Downloads
8. Save Manager
9. Cloud & Sync
10. Profiles
11. Statistics
12. Settings

Create a controller-friendly sidebar and navigation system.

HOME DASHBOARD:

Display:
- Continue Playing
- Recently Played
- Recently Added
- Favorite Games
- Installed Games
- Retro Games
- Game Recommendations from the user's existing library
- Download Activity
- Cloud Synchronization Status
- Profile Information

All displayed information must come from real application data.

Do not populate the production dashboard with fake games.

==================================================
5. GAME LIBRARY SYSTEM
==================================================

Create a unified game library.

SUPPORTED SOURCES:

- Steam
- Epic Games
- GOG
- Manually installed PC games
- Other desktop games
- Retro games
- Batocera libraries
- Emulator libraries

Implement source-specific adapters.

GAME DISCOVERY:

The application should:
- Scan configured game directories.
- Discover supported game installations.
- Detect executable files where possible.
- Detect supported game store libraries.
- Identify existing installations.
- Import game information.
- Avoid duplicate entries.
- Allow manual game registration.
- Allow users to edit game information.

Support:
- EXE
- APP bundles
- Linux executables
- Emulator-specific ROM extensions

Do not classify every executable as a game automatically.

Provide manual confirmation for ambiguous entries.

GAME MANAGEMENT:

Users should be able to:
- Add games.
- Remove games from the launcher.
- Edit game information.
- Set installation paths.
- Set executable paths.
- Configure launch arguments.
- Set working directories.
- Set custom artwork.
- Add custom categories.
- Mark favorites.
- Create collections.
- Search games.
- Filter by platform.
- Filter by source.
- Filter by installed status.
- Sort by name.
- Sort by release date.
- Sort by playtime.
- Sort by recently played.

Removing a game from the launcher must never delete its installation files.

==================================================
6. GAME LAUNCHING ENGINE
==================================================

Implement a robust Rust game-launching service.

Requirements:
- Launch executable games.
- Launch games through official launchers.
- Support custom launch arguments.
- Support working directories.
- Detect running processes.
- Detect process termination.
- Record start and end timestamps.
- Track playtime.
- Handle failed launches.
- Handle missing executable paths.
- Support per-game launch configurations.

Use safe process creation.

Never concatenate arbitrary user-controlled commands into shell strings.

Use argument arrays and platform-specific process APIs.

Do not bypass store authentication or DRM.

For each game, store its launch source and launch method.

==================================================
7. STEAM, EPIC AND GOG INTEGRATION
==================================================

Implement integrations progressively.

STEAM:

- Detect local Steam installation.
- Discover installed Steam libraries.
- Read locally available app manifests.
- Identify installed games.
- Obtain supported local game information.
- Launch through Steam where appropriate.
- Allow manual library configuration.

EPIC GAMES:

- Detect Epic Games Launcher.
- Discover locally installed games using available installation metadata.
- Import installed game entries.
- Launch through the official launcher when required.

GOG:

- Detect GOG Galaxy where installed.
- Discover locally available installation metadata.
- Import supported games.
- Support standalone installations.

Use official or documented integration methods wherever available.

Do not reverse-engineer authentication or bypass DRM.

If an integration cannot access a particular piece of information, provide manual configuration rather than inventing functionality.

==================================================
8. IGDB GAME METADATA
==================================================

Implement IGDB integration.

Features:
- Search game titles.
- Retrieve descriptions.
- Retrieve release dates.
- Retrieve developers.
- Retrieve publishers.
- Retrieve genres.
- Retrieve platforms.
- Retrieve cover artwork.
- Retrieve screenshots.
- Retrieve game information.

Create a metadata matching engine.

Matching priority:
1. Store-specific game ID.
2. IGDB ID.
3. Normalized title and platform.
4. Manual user selection.

Never automatically overwrite manually corrected metadata.

Implement:
- Search throttling.
- Request caching.
- Error handling.
- Retry mechanisms.
- Offline metadata access.
- Manual metadata editing.

API credentials must never be exposed in frontend JavaScript.

==================================================
9. CONTROLLER SUPPORT
==================================================

Controller support is a core application requirement.

Support:
- Xbox controllers.
- PlayStation controllers.
- Generic compatible controllers.

Implement:
- Controller discovery.
- Controller connection detection.
- Controller disconnect detection.
- D-pad navigation.
- Analog stick navigation.
- A/B/X/Y buttons.
- PlayStation equivalent buttons.
- Triggers.
- Bumpers.
- Start and Select.
- Configurable mappings.
- Dead zones.
- Sensitivity settings.
- Vibration where supported.

Create a global controller input manager.

Recommended default mapping:

D-pad / Left Stick:
Navigate.

A / Cross:
Confirm.

B / Circle:
Back.

X / Square:
Secondary action.

Y / Triangle:
Additional action.

LB / L1:
Previous category.

RB / R1:
Next category.

Start:
Open quick menu.

Back / Share:
Open profile or secondary menu.

Allow custom button mapping.

Implement input debouncing and navigation repeat timing.

Prevent duplicate input from simultaneous frontend and native controller systems.

When a controller disconnects, the interface must continue working using keyboard and mouse.

==================================================
10. RETRO GAMING SYSTEM
==================================================

Create a dedicated retro gaming section.

Support configurable integrations with:

- RetroArch
- PCSX2
- RPCS3
- PPSSPP
- Dolphin
- DuckStation
- MAME
- Cemu
- Other user-configured emulators

Features:
- Detect emulator executable paths.
- Manually configure emulator paths.
- Scan ROM folders.
- Associate systems with emulators.
- Associate file extensions with emulators.
- Configure launch arguments.
- Configure per-game settings.
- Retrieve game artwork.
- Display platform categories.
- Track playtime.
- Launch games.
- Display missing emulator warnings.

Do not distribute copyrighted ROMs, BIOS files or proprietary game files.

Never assume an emulator is installed just because its configuration exists.

==================================================
11. BATOCERA INTEGRATION
==================================================

Create a Batocera integration module.

The application should be able to connect to an existing Batocera system on a local network.

Features:
- Manual IP configuration.
- Connection testing.
- Discover available game systems.
- Import game lists where supported.
- Import available metadata.
- Display remote games.
- Display connection status.
- Handle network failures.
- Allow reconnection.
- Configure remote library locations.
- Distinguish local and remote games.

Use documented Batocera capabilities and supported network protocols.

Do not assume all Batocera installations expose identical APIs or directories.

Provide a manual configuration fallback.

Keep remote game launching separate from local game launching.

==================================================
12. GAME SAVE MANAGER
==================================================

Build a complete save-game management system.

This is a major feature.

Users must be able to manage game saves independently from game installations.

FEATURES:

- Automatic save detection where possible.
- Manual save directory configuration.
- Multiple save directories per game.
- Per-profile save configurations.
- Local backups.
- Automatic backups.
- Manual backups.
- Restore backups.
- Version history.
- Backup compression.
- Backup integrity verification.
- Backup retention settings.
- Selective backup.
- Save deletion confirmation.
- Save directory inspection.

Support platform-specific save locations.

Create an extensible save-location database.

Do not assume every game uses a standard save directory.

Allow users to configure:
- Folder paths.
- File patterns.
- Excluded files.
- Included files.
- Backup delay.
- Automatic backup behavior.

AUTOMATIC BACKUP WORKFLOW:

1. Detect game launch.
2. Identify the selected profile.
3. Associate the game with its save configuration.
4. Detect game termination.
5. Wait for save writes to complete.
6. Scan configured save directories.
7. Calculate file hashes.
8. Compare against previous snapshots.
9. Create a new snapshot if necessary.
10. Compress the snapshot.
11. Verify the snapshot.
12. Add it to the synchronization queue.
13. Upload when cloud synchronization is enabled.

Do not scan entire game installation folders for saves.

Do not back up active save files while the game is writing to them.

Provide manual backup if automatic detection is unavailable.

==================================================
13. SAVE VERSION HISTORY
==================================================

Create a backup history interface.

Display:
- Game name.
- Profile name.
- Backup date.
- Device name.
- File count.
- Backup size.
- Local or cloud location.
- Backup status.

Actions:
- Restore.
- Compare.
- Export.
- Delete.
- Upload.
- Download.

Keep previous backups according to configurable retention rules.

Never delete the only valid backup.

Before restoring:
1. Confirm the game is closed.
2. Back up the current save.
3. Verify the selected snapshot.
4. Extract safely.
5. Restore files.
6. Verify the restored files.
7. Report the result.

==================================================
14. GOOGLE ACCOUNT AUTHENTICATION
==================================================

Implement Google OAuth 2.0 for desktop applications.

Features:
- Sign in with Google.
- Display account information.
- Display profile picture where permitted.
- Link Google to a local profile.
- Disconnect Google.
- Handle expired tokens.
- Refresh tokens.
- Handle revoked authorization.
- Display authentication errors.

Use a secure desktop OAuth flow.

Use PKCE where applicable.

Do not embed a client secret in the distributed desktop application.

Store credentials securely using the operating system's credential storage:
- Windows Credential Manager.
- macOS Keychain.
- Linux Secret Service where available.

Never store refresh tokens in SQLite as plaintext.

Never upload OAuth credentials to Google Drive.

A local profile must remain usable without a Google account.

==================================================
15. GOOGLE DRIVE CLOUD STORAGE
==================================================

Implement Google Drive API v3.

Create a provider-independent CloudStorageProvider interface.

Methods:
- authenticate()
- get_account_info()
- list_files()
- upload_file()
- download_file()
- update_file()
- delete_file()
- get_metadata()
- check_connection()

Support two storage modes.

MODE A: APPLICATION PRIVATE STORAGE

Use Google Drive appDataFolder.

Store:
- Application-managed save backups.
- Cloud manifests.
- Profile synchronization metadata.
- Backup indexes.

MODE B: USER-VISIBLE DRIVE FOLDER

Allow the user to select a normal Drive folder for backups.

Use the narrowest appropriate Drive permissions.

Implement:
- Upload.
- Download.
- Resumable uploads.
- File verification.
- Retry.
- Network interruption recovery.
- Duplicate detection.
- Cloud storage status.
- Cloud backup history.

Do not upload complete game installation folders.

Only synchronize explicitly configured application data and game save backups.

==================================================
16. CLOUD SAVE SYNCHRONIZATION ENGINE
==================================================

Build a reliable cross-device synchronization engine.

Example:

Computer A:
- Windows.
- Game installed.
- User plays game.
- Game exits.
- Save is backed up.
- Backup is uploaded to Google Drive.

Computer B:
- Linux.
- Same local profile linked.
- Launcher retrieves the cloud manifest.
- Launcher checks available saves.
- Launcher downloads the appropriate snapshot.
- Launcher verifies it.
- User continues playing.

Implement:
- Local-to-cloud sync.
- Cloud-to-local sync.
- Device-to-device sync.
- Incremental sync.
- Hash comparison.
- Snapshot identification.
- Offline operation queue.
- Retry logic.
- Device registration.
- Sync history.
- Sync status.

Create unique device IDs.

Do not use timestamps as the only source of truth.

Use file hashes and snapshot identifiers.

MANIFEST STRUCTURE:

Include:
- Profile ID.
- Game ID.
- Device ID.
- Snapshot ID.
- Manifest version.
- File paths.
- File sizes.
- File hashes.
- Creation time.
- Cloud file identifiers.

The synchronization engine must be deterministic and recoverable.

==================================================
17. CONFLICT RESOLUTION
==================================================

Conflict resolution is mandatory.

Example:

Computer A has a save version created yesterday.

Computer B has a different save version created today.

Both devices have been offline.

When they reconnect, do not automatically overwrite either version.

Instead:

1. Detect divergent snapshots.
2. Preserve both snapshots.
3. Create a conflict record.
4. Display a warning.
5. Show device names.
6. Show timestamps.
7. Allow inspection of versions.
8. Let the user choose a version.
9. Preserve the unselected version.
10. Restore the selected version only after confirmation.

Do not blindly use last-write-wins.

Do not lose data during interrupted synchronization.

==================================================
18. BACKUP ENCRYPTION
==================================================

Implement optional client-side encryption.

Use maintained cryptographic libraries and authenticated encryption.

Requirements:
- Encrypt save archives before uploading.
- Keep encryption keys separate from Google Drive.
- Support a user-controlled recovery key or passphrase.
- Never upload plaintext encryption keys.
- Support recovery procedures.
- Verify encrypted archive integrity.
- Document the encryption model.

Do not claim encryption is enabled unless the entire upload and restore workflow actually uses it.

==================================================
19. PROFILE MANAGEMENT
==================================================

Build a complete multi-profile system.

Features:
- Create profile.
- Edit profile.
- Delete profile.
- Profile avatar.
- Profile name.
- Profile switching.
- Default profile.
- Guest profile.
- Profile-specific preferences.
- Optional Google account association.

Each profile maintains:
- Game library preferences.
- Favorites.
- Collections.
- Playtime.
- Recently played.
- Save configurations.
- Save backups.
- Controller settings.
- Emulator settings.
- Cloud settings.
- UI preferences.

Do not require online authentication for local profile usage.

Prevent data leakage between profiles.

==================================================
20. PLAYER STATISTICS
==================================================

Create a statistics dashboard.

Display:
- Total games.
- Installed games.
- Retro games.
- Total playtime.
- Most played games.
- Recently played games.
- Last played date.
- Playtime by platform.
- Monthly playtime.
- Favorite games.

Track playtime using actual game process start and termination events.

Avoid inventing playtime when process tracking is unavailable.

Allow manual correction of statistics if appropriate.

Do not claim Steam achievements or external platform achievements are synchronized unless the relevant integration actually supports it.

==================================================
21. DOWNLOAD MANAGER
==================================================

Create a modular download manager.

Support:
- Official game downloads where authorized.
- User-provided direct URLs.
- User-provided legal magnet links.
- Download progress.
- Download speed.
- Remaining time.
- Pause.
- Resume.
- Cancel.
- Download history.
- Storage configuration.
- Error handling.

Implement a safe download pipeline.

Do not scrape or aggregate pirated repack websites or unauthorized copyrighted game links.

Do not automate unauthorized FitGirl repack discovery or downloads.

Do not bypass DRM or authentication.

Never execute downloaded files automatically.

Require explicit confirmation before running installers or downloaded executables.

Provide file integrity verification where checksums are available.

==================================================
22. SQLITE DATABASE DESIGN
==================================================

Use SQLite with SQLx.

Create migrations for:

Games
Platforms
GameSources
Installations
Emulators
Controllers
Collections
PlaySessions
MetadataCache
UserProfiles
ProfileSettings
LinkedAccounts
Devices
SaveConfigurations
SaveSnapshots
SaveFiles
CloudFiles
SyncJobs
SyncConflicts
SyncHistory
Downloads
Settings
ScanHistory

Requirements:
- Foreign keys.
- Appropriate indexes.
- Unique constraints.
- Transactions.
- Migration history.
- Backup and restore.
- Safe schema upgrades.
- Efficient queries.

Keep database access behind repository or service layers.

Never access SQLite directly from React.

==================================================
23. RUST BACKEND ARCHITECTURE
==================================================

Suggested structure:

src-tauri/src/

main.rs
lib.rs

commands/
services/
models/
database/
repositories/

platform/
  windows/
  linux/
  macos/

games/
  scanner/
  launcher/
  discovery/
  sources/

stores/
  steam/
  epic/
  gog/

controllers/

metadata/
  igdb/

emulators/

batocera/

save_manager/
  scanner/
  backup/
  restore/
  snapshots/
  versions/
  compression/

cloud/
  oauth/
  google_drive/
  providers/
  manifests/

sync_engine/
  scheduler/
  queue/
  worker/
  diff/
  conflict/

profiles/

downloads/

security/

events/

configuration/

errors/

Keep commands thin.

Keep business logic inside service modules.

Use typed request and response structures.

Use async operations where appropriate.

Use bounded concurrency.

Avoid unnecessary background tasks.

Use structured logs.

==================================================
24. REACT FRONTEND ARCHITECTURE
==================================================

Suggested structure:

src/

app/
  App.tsx
  router.tsx

components/
  common/
  game-cards/
  navigation/
  dialogs/
  controller/

features/

  home/

  library/

  game-details/

  controller/

  emulators/

  batocera/

  downloads/

  save-manager/

  cloud-sync/

  profiles/

  statistics/

  settings/

hooks/

services/

stores/

types/

layouts/

styles/

Use TypeScript strict mode.

Use Zustand for shared state.

Create typed wrappers around Tauri commands.

Keep components reusable.

Implement loading, error, offline, empty and success states.

Use virtualization for large game collections.

Lazy-load artwork.

Avoid unnecessary React rerenders.

==================================================
25. SETTINGS
==================================================

Create a complete settings interface.

Categories:

GENERAL:
- Language.
- Theme.
- Startup behavior.
- Fullscreen.
- Minimize to tray where supported.
- Application updates.

LIBRARY:
- Game scan directories.
- Automatic scanning.
- Store integrations.
- Metadata preferences.

CONTROLLER:
- Controller selection.
- Button mapping.
- Dead zones.
- Navigation settings.

EMULATOR:
- Emulator paths.
- ROM directories.
- Launch configurations.

SAVE MANAGER:
- Automatic backups.
- Backup delay.
- Retention limits.
- Save directories.

CLOUD:
- Google connection.
- Drive storage mode.
- Synchronization schedule.
- Encryption.
- Conflict notifications.

PROFILE:
- Profile switching.
- Avatar.
- Personal settings.

DOWNLOADS:
- Download directory.
- Maximum concurrent downloads.
- Download history.

==================================================
26. OFFLINE-FIRST REQUIREMENTS
==================================================

The launcher must remain useful without internet.

Offline functionality:
- Open application.
- Switch local profiles.
- View installed games.
- Browse cached artwork.
- Browse cached metadata.
- Launch installed games.
- Launch local emulators.
- Browse local save backups.
- Create local save backups.
- View statistics.
- Edit game information.
- Configure settings.

Cloud operations should enter a queue when offline.

When connectivity returns:
- Check cloud manifest.
- Reconcile pending changes.
- Detect conflicts.
- Synchronize safely.

Do not block the application because Google Drive is unavailable.

==================================================
27. PERFORMANCE REQUIREMENTS
==================================================

Performance and lightweight resource usage are top priorities.

Requirements:
- Fast startup.
- Low idle CPU.
- Low background RAM usage.
- Efficient database access.
- Lazy-loaded artwork.
- Thumbnail caching.
- Virtualized game grids.
- Incremental scanning.
- Bounded concurrency.
- Background compression.
- Event-driven synchronization.
- No unnecessary polling.
- No continuous full-directory scans.
- No excessive animations.

Measure actual resource consumption.

Create a performance report covering:
- Startup time.
- Idle RAM.
- Idle CPU.
- Game scanning speed.
- Library rendering.
- Image cache behavior.
- Synchronization overhead.

Do not invent benchmark numbers.

==================================================
28. SECURITY REQUIREMENTS
==================================================

Implement:
- Input validation.
- Safe filesystem operations.
- Safe process launching.
- Secure OAuth token storage.
- Restricted Tauri permissions.
- Safe archive extraction.
- Encryption for optional cloud backups.
- Explicit user confirmation for destructive actions.
- Safe download handling.
- Network request validation.

Prevent:
- Path traversal.
- Arbitrary shell execution.
- Token leakage.
- Accidental save deletion.
- Unintended profile data sharing.
- Unsafe automatic execution.
- Silent save overwrites.

==================================================
29. TESTING REQUIREMENTS
==================================================

Every major feature must have tests.

RUST:
- Database tests.
- Repository tests.
- Scanner tests.
- Game launcher tests.
- Controller tests.
- Save snapshot tests.
- Restore tests.
- Cloud provider tests.
- OAuth state handling tests.
- Sync tests.
- Conflict resolution tests.
- Encryption tests.

REACT:
- Component tests.
- Navigation tests.
- Controller navigation tests.
- Profile switching tests.
- Save manager tests.
- Cloud status tests.
- Error handling tests.

INTEGRATION:
- Game scanning.
- Game launching.
- Save backup.
- Save restore.
- Google Drive upload.
- Google Drive download.
- Offline queue.
- Conflict handling.
- Cross-profile isolation.

Use synthetic games and synthetic save data for automated tests.

Do not perform destructive tests against actual user game saves.

==================================================
30. BUILD AND RELEASE
==================================================

Provide working builds for:

Windows:
- Installer.
- Portable build if practical.

Linux:
- AppImage where supported.
- DEB.
- RPM where supported.

macOS:
- DMG.
- Apple Silicon and Intel where supported by dependencies.

Set up:
- Cargo configuration.
- Frontend build configuration.
- Tauri configuration.
- Platform-specific packaging.
- Version management.
- Release documentation.

Use GitHub Actions for cross-platform build automation where practical.

Document all platform-specific prerequisites.

==================================================
31. IMPLEMENTATION ROADMAP
==================================================

Do not attempt to implement everything simultaneously.

Implement in this order.

PHASE 0: PROJECT PLANNING
- Inspect environment.
- Verify installed Rust toolchain.
- Verify Node.js and package manager.
- Verify platform dependencies.
- Create architecture document.
- Create feature checklist.
- Create project structure.
- Initialize Git.

PHASE 1: APPLICATION FOUNDATION
- Initialize Tauri 2.
- Initialize React.
- Configure TypeScript.
- Configure Tailwind.
- Create application shell.
- Implement navigation.
- Implement themes.
- Create reusable components.

PHASE 2: CONTROLLER SYSTEM
- Detect gamepads.
- Implement navigation.
- Implement button mappings.
- Implement keyboard fallback.
- Test Xbox and PlayStation controllers.

PHASE 3: LOCAL DATABASE AND PROFILES
- Initialize SQLite.
- Create migrations.
- Implement repositories.
- Implement profile creation.
- Implement profile switching.
- Implement profile-specific settings.

PHASE 4: LOCAL GAME LIBRARY
- Implement folder scanning.
- Implement manual game addition.
- Implement game management.
- Implement game launching.
- Implement playtime tracking.

PHASE 5: IGDB
- Implement API configuration.
- Implement game search.
- Implement metadata matching.
- Implement artwork caching.
- Implement offline metadata.

PHASE 6: GAME STORE INTEGRATIONS
- Steam discovery.
- Epic discovery.
- GOG discovery.
- Library deduplication.
- Store launching.

PHASE 7: RETRO GAMING
- Emulator management.
- ROM scanning.
- Emulator launch configuration.
- Retro game library.

PHASE 8: BATOCERA
- Network configuration.
- Connection testing.
- Game-list import.
- Remote library display.

PHASE 9: LOCAL SAVE MANAGER
- Save directory configuration.
- Save scanning.
- Snapshot creation.
- Compression.
- Backup history.
- Restore.

PHASE 10: GOOGLE AUTHENTICATION
- OAuth setup.
- Secure token storage.
- Account linking.
- Account disconnection.

PHASE 11: GOOGLE DRIVE
- Private app storage.
- User-selected Drive folder.
- Upload.
- Download.
- Resumable transfers.
- Cloud manifest.

PHASE 12: CLOUD SAVE SYNCHRONIZATION
- Device registration.
- Incremental synchronization.
- Offline queue.
- Hash verification.
- Conflict detection.
- Conflict resolution.

PHASE 13: ENCRYPTION
- Backup encryption.
- Recovery key.
- Restore verification.
- Security tests.

PHASE 14: DOWNLOAD MANAGER
- Legal direct downloads.
- Legal magnet links.
- Download queue.
- Progress tracking.
- Pause and resume.

PHASE 15: STATISTICS AND CUSTOMIZATION
- Playtime dashboard.
- Collections.
- Favorites.
- Themes.
- Settings.

PHASE 16: FINAL OPTIMIZATION
- Performance profiling.
- Memory optimization.
- UI optimization.
- Security audit.
- Regression tests.

PHASE 17: RELEASE
- Windows build.
- Linux build.
- macOS build.
- Installation documentation.
- User manual.
- Release notes.

==================================================
32. STRICT AI DEVELOPMENT RULES
==================================================

Follow these rules throughout development.

1. Do not generate the entire application in one giant file.

2. Do not create only a frontend mockup.

3. Do not use fake game data in production functionality.

4. Do not implement buttons that do nothing.

5. Do not claim an integration works without testing it.

6. Do not remove working functionality when adding new features.

7. Do not change the architecture unnecessarily.

8. Do not introduce unnecessary dependencies.

9. Do not expose API keys or OAuth tokens.

10. Do not overwrite save files without preserving previous versions.

11. Do not execute downloaded files automatically.

12. Do not assume every operating system behaves identically.

13. Do not block the UI during background tasks.

14. Do not silently swallow errors.

15. Do not leave incomplete database migrations.

16. Do not leave critical security features as placeholders while claiming they are complete.

17. Do not skip tests.

18. Keep documentation updated.

19. Keep a development progress tracker.

20. Commit changes to Git at logical milestones, if Git is configured.

==================================================
33. REQUIRED PROJECT DOCUMENTATION
==================================================

Create:

README.md
ARCHITECTURE.md
DEVELOPMENT.md
INSTALLATION.md
BUILD.md
DATABASE_SCHEMA.md
API_INTEGRATIONS.md
CONTROLLER_SUPPORT.md
CLOUD_SYNC.md
SAVE_MANAGER.md
SECURITY.md
TESTING.md
ROADMAP.md
CHANGELOG.md

Maintain:

- Current phase.
- Completed features.
- In-progress features.
- Pending features.
- Known bugs.
- Build status.
- Test status.

==================================================
34. DEFINITION OF DONE
==================================================

The application is not complete simply because it builds.

A feature is complete only when:

- Its UI exists.
- Its backend exists.
- Its database integration exists where required.
- It handles success.
- It handles failure.
- It handles offline states where applicable.
- It has been tested.
- It has documentation.

The final product must provide a real gaming experience.

A user should be able to:

1. Install the application.
2. Create a local profile.
3. Connect a controller.
4. Scan installed games.
5. Browse a unified game library.
6. Retrieve IGDB metadata.
7. Launch installed games.
8. Play retro games through configured emulators.
9. Connect to Batocera.
10. Back up game saves.
11. Connect Google Drive.
12. Synchronize saves across computers.
13. Resolve save conflicts.
14. Switch profiles.
15. View playtime statistics.
16. Continue using the launcher offline.

==================================================
35. START DEVELOPMENT NOW
==================================================

Begin with PHASE 0.

First inspect the development environment.

Check:
- Rust installation.
- Cargo installation.
- Node.js.
- npm.
- Tauri prerequisites.
- Operating system.
- Available build tools.

Then:

1. Create the project directory named UniversalGameHub.
2. Initialize Git.
3. Initialize the Tauri 2 application.
4. Configure React and TypeScript.
5. Create the project architecture.
6. Create the documentation files.
7. Create ROADMAP.md.
8. Create a detailed task checklist.
9. Verify the first application build.
10. Start implementing PHASE 1.

Do not stop after generating the plan.

Continue implementing the current phase, testing it, fixing errors and updating the documentation.

Work phase by phase.

At the end of each phase:

- Report implemented features.
- Report files created or modified.
- Report tests executed.
- Report test results.
- Report known limitations.
- Report the next phase.

If a feature requires unavailable API credentials, hardware or external services, implement the configuration and integration structure, explain what is needed, and continue with independently testable features.

Never claim something is complete if it has not been verified.

Your objective is to deliver a complete, production-quality Universal Game Hub desktop application.

START WITH PHASE 0 AND PROCEED THROUGH THE ROADMAP.


Continue developing Universal Game Hub according to the existing master specification.

Before making changes:
1. Inspect the existing codebase.
2. Read ROADMAP.md and ARCHITECTURE.md.
3. Identify completed and incomplete functionality.
4. Do not overwrite or remove working code.

During development:
- Implement the next incomplete phase.
- Follow the existing Rust and React architecture.
- Write production-quality code.
- Run relevant tests.
- Build the application.
- Fix all errors introduced by your changes.
- Avoid mock functionality.
- Keep offline functionality intact.
- Preserve existing database data and migrations.

After implementation:
- Update ROADMAP.md.
- Update CHANGELOG.md.
- Update relevant documentation.
- Report completed functionality.
- Report tests and build results.
- Identify any remaining limitations.

Do not skip ahead to unrelated phases. Continue until the current phase is genuinely complete.


