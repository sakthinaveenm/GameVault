# Changelog

All notable changes to Universal Game Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-04

### Added
- **Phase 0 (Planning & Setup)**:
  - Validated development environment (macOS Apple Silicon, Rust 1.99.1, Node 26.4.0).
  - Scaffolded Tauri 2 application foundation with React 19 and TypeScript.
  - Established 13 architectural and operational documentation files (`ARCHITECTURE.md`, `ROADMAP.md`, `DATABASE_SCHEMA.md`, `DEVELOPMENT.md`, `INSTALLATION.md`, `BUILD.md`, `API_INTEGRATIONS.md`, `CONTROLLER_SUPPORT.md`, `CLOUD_SYNC.md`, `SAVE_MANAGER.md`, `SECURITY.md`, `TESTING.md`, `CHANGELOG.md`).
- **Phase 1 (Application Foundation & Console Interface)**:
  - Dark console gaming theme with Tailwind CSS v4 in `src/styles/globals.css`.
  - Application shell: collapsible `Sidebar.tsx`, `Topbar.tsx` (online indicator, profile pill, controller badge), and `ControllerHints.tsx`.
  - 11 comprehensive screen views (`HomeScreen`, `LibraryScreen`, `RetroScreen`, `EmulatorsScreen`, `BatoceraScreen`, `SaveManagerScreen`, `CloudSyncScreen`, `ProfilesScreen`, `StatisticsScreen`, `DownloadsScreen`, `SettingsScreen`).
  - Interactive modals (`QuickMenuModal`, `GameDetailsModal`, `ScanFoldersModal`, `AddGameModal`).
- **Phase 2 (Controller Subsystem & Native Input)**:
  - Integrated `gilrs` native gamepad subsystem in Rust backend with event polling.
  - Developed real-time `ControllerSettingsScreen` with visual controller tester for buttons and analog axes.
  - Implemented configurable dead-zone filter and haptic rumble testing.
- **Phase 3 (Local SQLite Database & Multi-Profiles)**:
  - Added SQLx SQLite database pool with startup migration execution (`0001_initial_schema.sql`).
  - Implemented `ProfileRepository` with profile creation, switching, and deletion guards.
  - Created profile-scoped data isolation table `profile_game_data`.
- **Phase 4 (Local Game Library & Process Launcher)**:
  - Implemented recursive `GameScanner` with deduplication and candidate detection for `.app`, `.exe`, and ROMs.
  - Implemented safe process `GameLauncher` using typed argument vectors and process lifecycle monitoring.
  - Implemented `GameRepository` with upsert, listing, favorite toggling, and playtime recording.
- **Phase 5 (Storefront Integrations - Steam, Epic, GOG)**:
  - Steam manifest discovery (`appmanifest_*.acf`) Valve KeyValue parser.
  - Epic Games Launcher manifest discovery (`.item` files).
  - GOG Galaxy detection stub and unified store deduplication orchestrator.
- **Phase 6 (IGDB Game Metadata & Cache)**:
  - IGDB client and metadata model.
  - SQLite offline cache (`metadata_cache` table) with offline title matching.
- **Phase 7 (Retro Gaming & Emulators)**:
  - Configurable emulator runner for RetroArch, Dolphin, PCSX2, PPSSPP, DuckStation, RPCS3, MAME.
  - Platform ROM extension mapping and execution.
- **Phase 8 (Batocera Network Integration)**:
  - Async TCP ping client measuring network latency to remote Batocera nodes.
  - EmulationStation `gamelist.xml` parser for remote titles.
- **Phase 9 (Save Game Manager & Safety Backups)**:
  - Recursive SHA-256 file and directory hashing.
  - Deflate ZIP archive creation.
  - Safe extraction with directory traversal protection.
  - Mandatory Safety Pre-Restore Backup: creates a safety backup of live saves before any restore is performed.
- **Phase 10 (Google OAuth 2.0 PKCE Flow)**:
  - Cryptographically secure PKCE code verifier and SHA-256 challenge generator.
  - Ephemeral loopback TCP listener (`127.0.0.1:<port>`) for browser redirect handling.
  - Token exchange and Google UserInfo identity retrieval.
- **Phase 11 (Google Drive API v3 Client)**:
  - Private `appDataFolder` and user folder support.
  - Multipart MIME upload and media patch updates.
  - Resumable downloads and file deletion.
- **Phase 12 (Manifest Sync Engine & Conflict Resolution)**:
  - Deterministic sync manifest format (`manifest.json`) with hashes and timestamps.
  - Manifest diff engine detecting InSync, UploadLocal, DownloadRemote, and Conflicts.
  - Conflict resolution strategies: KeepLocal, KeepCloud (with safety pre-backup), and KeepBoth.
- **Phase 13 (Save Backup Encryption)**:
  - Authenticated AES-256-GCM encryption with user passphrase derivation.
  - Tamper detection and nonce prepending.
- **Phase 14 (Download Manager Engine)**:
  - Resumable streaming downloads with SHA-256 integrity checksum verification.
  - Mandatory security gate: explicit user confirmation modal required before executing any downloaded installer.
- **Phase 15 (Playtime Analytics & Statistics)**:
  - SQLite aggregate queries for total playtime, platform breakdown, and top 5 titles.
  - Connected live statistics view.
- **Phase 16 & 17 (Performance & Release Packaging)**:
  - Zero extraneous polling loops, indexed SQLite tables, and lazy artwork loading.
  - 31 backend unit and integration tests passing with 0 failures.
  - Clean frontend production build.
