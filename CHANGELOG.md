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
  - Implemented safe process `GameLauncher` using typed argument vectors and Tokio process lifecycle monitoring.
  - Implemented `GameRepository` with upsert, listing, favorite toggling, and playtime recording.
  - Added Rust test suite (12 tests passing).
