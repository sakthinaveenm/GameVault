# Universal Game Hub - Master Development Roadmap

## Project Status Overview

| Metric | Status |
|---|---|
| **Current Phase** | Phase 4 Completed -> Proceeding to Phase 5 (IGDB Metadata) & Phase 6 (Game Store Integrations) |
| **Build Status** | Compiling Cleanly (Frontend Vite + Rust Backend 0 errors) |
| **Backend Toolchain** | Rust 1.99.1, Cargo 1.99.1, Tauri 2 |
| **Frontend Toolchain** | React 19, TypeScript 6, Vite 8, Tailwind CSS, Zustand |
| **Target OS** | macOS, Windows 10/11, Linux |
| **Active Target** | macOS (Apple Silicon `aarch64-apple-darwin`) |

---

## Phase Checklist & Milestones

### Phase 0: Project Planning & Environment Setup (Completed)
- [x] Inspect development environment (macOS Apple Silicon).
- [x] Configure and verify Rust toolchain (`rustc 1.99.1`, `cargo 1.99.1`).
- [x] Verify Node.js (`v26.4.0`) and npm (`11.17.0`).
- [x] Scaffold Tauri 2 + React + TypeScript base.
- [x] Install frontend dependencies (`react-router-dom`, `zustand`, `framer-motion`, `lucide-react`, `tailwindcss`).
- [x] Establish architecture specification (`ARCHITECTURE.md`).
- [x] Establish required documentation suite (`DATABASE_SCHEMA.md`, `DEVELOPMENT.md`, etc.).
- [x] Initialize Git repository tracking.

### Phase 1: Application Foundation & Console UI (Completed)
- [x] Configure Tailwind CSS v4 gaming theme (deep charcoal `#0b0e14`, subtle neon accents, focus rings).
- [x] Implement Application Shell with collapsible sidebar and controller-optimized topbar.
- [x] Implement Main Navigation routes & screen views (Home, Library, Retro, Emulators, Batocera, Saves, Cloud, Profiles, Statistics, Downloads, Settings).
- [x] Implement reusable UI components (Focusable GameCard, Hints bar, Quick Menu, Game Details modal, Scan Folders modal, Add Custom Game modal).

### Phase 2: Controller Subsystem & Native Input Integration (Completed)
- [x] Implemented native controller manager using `gilrs` in Rust (`src-tauri/src/controllers/mod.rs`).
- [x] Implemented controller visualizer and calibration tester (`ControllerSettingsScreen.tsx`).
- [x] Implemented real-time face button, bumper, and analog stick coordinate tracking.
- [x] Implemented configurable dead-zone filter and haptic rumble testing trigger.
- [x] Gamepad navigation hook (`useControllerNavigation`) with keyboard fallback.
- [x] Automated unit test for Gilrs controller subsystem.

### Phase 3: Local SQLite Database & Profiles (Completed)
- [x] Initialized SQLx with SQLite connection pool and automatic startup schema migrations.
- [x] Authored comprehensive initial migration (`0001_initial_schema.sql`) covering UserProfiles, Games, Saves, Emulators, CloudFiles, Conflicts, Downloads, and MetadataCache.
- [x] Implemented `ProfileRepository` with full CRUD, default profile creation, and safety check preventing deletion of the last profile.
- [x] Implemented profile-specific data isolation for favorites, playtime, and settings (`profile_game_data`).
- [x] Registered Tauri commands (`list_profiles`, `create_profile`, `delete_profile`).
- [x] In-memory SQLite migration and repository tests passing (8 tests).

### Phase 4: Local Game Library & Process Launcher (Completed)
- [x] Implemented recursive file system game scanner using `walkdir` (`src-tauri/src/games/scanner/`).
- [x] Added candidate detection for `.app`, `.exe`, and retro ROM extensions with file deduplication.
- [x] Implemented safe process launcher (`src-tauri/src/games/launcher/`) using argument vectors (never shell interpolation) and lifecycle monitoring.
- [x] Implemented `GameRepository` with upsert, profile-scoped listing, favorite toggling, and playtime tracking.
- [x] Connected frontend `ScanFoldersModal` to native `scan_directory_for_games` command with candidate confirmation.
- [x] Added automated unit tests for game scanner, process launcher, and game repository (12 backend tests passing).

### Phase 2: Controller Subsystem
- [ ] Gamepad API connection / disconnection listener.
- [ ] D-pad, Analog stick, face button mapping engine.
- [ ] Configurable button bindings & dead-zone configuration.
- [ ] Virtual focus engine for full TV/console experience.
- [ ] Keyboard navigation fallback (Arrow keys, Enter, Esc, Tab, Space).
- [ ] Prevent duplicate input events.

### Phase 3: Local SQLite Database & Profiles
- [ ] Set up SQLx with SQLite connection pool in Tauri backend.
- [ ] Author SQL migrations (Games, Platforms, Profiles, Saves, Sync, etc.).
- [ ] Multi-profile creation, avatar selection, switching, and default profile logic.
- [ ] Profile data isolation for saves, settings, and library preferences.

### Phase 4: Local Game Library & Launcher
- [ ] File system game scanner for configured directories.
- [ ] Executable detection (`.app`, `.exe`, binaries, scripts).
- [ ] Manual game registration and metadata editing.
- [ ] Safe process launching with argument arrays and working directory support.
- [ ] Process lifecycle monitoring & playtime tracking.

### Phase 5: IGDB Metadata & Artwork Cache
- [ ] Secure backend IGDB client (Twitch OAuth token flow).
- [ ] Title matching and metadata retrieval (summary, genres, developers, release dates).
- [ ] High-resolution artwork downloader and local WebP thumbnail cache.
- [ ] Offline metadata storage in SQLite cache.

### Phase 6: Storefront Integrations (Steam, Epic, GOG)
- [ ] Steam library discovery (VDF/ACF manifest parser).
- [ ] Epic Games Launcher manifest discovery (`.item` files).
- [ ] GOG Galaxy database / manifest discovery.
- [ ] Library deduplication and store-specific launch handlers (`steam://rungameid/`, etc.).

### Phase 7: Retro Gaming & Emulators
- [ ] Configurable emulator integration (RetroArch, Dolphin, PCSX2, PPSSPP, DuckStation, RPCS3, MAME).
- [ ] ROM folder scanner by system extension.
- [ ] Emulator execution with per-game arguments and ROM paths.

### Phase 8: Batocera Network Integration
- [ ] Batocera local network host discovery / manual IP configuration.
- [ ] Network connection tester and status reporter.
- [ ] Remote game list and metadata parser.
- [ ] Remote launcher bridge.

### Phase 9: Local Save Manager & Backup Engine
- [ ] Platform-specific game save path auto-detection and custom path configuration.
- [ ] SHA-256 file hashing for save change detection.
- [ ] Compressed archive snapshot generation (`.zip` / `.tar.gz`).
- [ ] Save version history browser, diff inspection, and safe restoration with pre-restore safety backups.

### Phase 10: Google OAuth 2.0 & Drive Cloud Sync
- [ ] Desktop PKCE Google OAuth 2.0 flow with local loopback or deep link.
- [ ] Secure OS credential storage (macOS Keychain, Windows Credential Manager).
- [ ] Google Drive API v3 client (`appDataFolder` private mode + user-selected folder mode).
- [ ] Manifest-based cross-device sync engine, offline queue, and hash verification.

### Phase 11: Conflict Resolution & End-to-End Encryption
- [ ] Divergent save conflict detection (divergent snapshot trees).
- [ ] Visual side-by-side conflict resolver with timestamps, sizes, and file previews.
- [ ] Optional client-side AES-256-GCM authenticated backup encryption before upload.
- [ ] User recovery key generation and verification.

### Phase 12: Download Manager
- [ ] Resumable HTTP/HTTPS downloader for official games and user-provided URLs.
- [ ] Legal magnet link handling.
- [ ] Download progress, speed throttling, queue pause/resume, and checksum verification.
- [ ] User confirmation gate before running any downloaded installer.

### Phase 13: Statistics, Customization & Polish
- [ ] Playtime analytics charts (most played, playtime per platform, monthly trends).
- [ ] Custom collections and favorites.
- [ ] Performance profiling: low idle RAM, virtualized game cards, zero extraneous polling.

### Phase 14: Release Builds & Packaging
- [ ] macOS build (`.dmg`, `.app`).
- [ ] Windows installer (`.msi`, `.exe`).
- [ ] Linux package (`.AppImage`, `.deb`).
- [ ] Comprehensive test suite execution (Rust unit/integration + Vitest).

---

## Known Bugs & Issues Log
*None at this time.*
