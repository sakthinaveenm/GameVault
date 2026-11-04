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
  - Built dark gaming theme with Tailwind CSS v4, custom scrollbars, and controller focus rings.
  - Created full application shell with collapsible Sidebar, Topbar with profile & network indicators, and Controller Button Hints bar.
  - Developed 11 core navigation views: Home Dashboard, My Games Library, Retro Games, Emulators Manager, Batocera Integration, Save Manager, Cloud & Sync, Profiles, Statistics, Downloads, and Settings.
  - Built interactive modals: Quick Menu (`Start` / `Escape`), Game Details with custom parameters and safe deletion confirmation, Scan Folders with executable confirmation, and Add Custom Game.
  - Implemented global controller and keyboard navigation hook (`useControllerNavigation`) supporting Gamepad API polling, D-Pad/Left Stick virtual focus navigation, tab switching (`LB`/`RB` / `Q`/`E`), and action confirmations.
  - Structured Rust backend with models (`Game`, `UserProfile`, `SaveSnapshot`, `Emulator`, `SystemInfo`), error types (`AppError`), platform adapter, and Tauri IPC commands (`get_system_info`, `ping`).
  - Added Rust unit test suite (`cargo test`: 5 passed).
  - Verified clean TypeScript bundling (`npm run build`: 0 errors).
