# Universal Game Hub - Architecture Documentation

## 1. System Overview

Universal Game Hub is a lightweight, cross-platform desktop gaming launcher and ecosystem engineered with **Tauri 2**, **Rust**, and **React 19 / TypeScript**. It provides a unified console-like experience inspired by Steam Big Picture and Playnite, integrating PC games, storefronts (Steam, Epic, GOG), retro emulators, Batocera networked libraries, save-game backup/versioning, and cloud synchronization (Google Drive API v3) with multi-profile isolation.

```
+-----------------------------------------------------------------------------------+
|                           React 19 + TypeScript Frontend                          |
|  - Zustand Stores (Navigation, Profiles, Library, Save, Cloud, Controller, Audio) |
|  - Console UI Engine (Focus rings, Virtualized Grids, Restrained Animations)      |
|  - Controller Subsystem (Gamepad API + Native Rust Event Fallback)               |
+-----------------------------------------+-----------------------------------------+
                                          | Tauri IPC (Typed Commands & Events)
+-----------------------------------------v-----------------------------------------+
|                               Tauri 2 Rust Backend                                |
|  - Platform Abstraction Layer (Windows, macOS, Linux adapters)                    |
|  - Game Scanner & Store Integrations (Steam ACF, Epic manifests, GOG, Custom)     |
|  - Safe Process Launcher & Playtime Tracker (Lifecycle monitors, Tokio)           |
|  - Retro Gaming & Emulators (RetroArch, Dolphin, PCSX2, DuckStation, etc.)        |
|  - Save Game Manager & Backup Engine (Hash snapshots, zip compression, restore)   |
|  - Cloud Storage & Cross-Device Sync (Google Drive v3, PKCE OAuth, manifests)     |
|  - Multi-Profile Manager (Independent settings, saves, statistics)                |
|  - SQLite Database (SQLx migrations, transactional repositories)                  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory Structure

```
.
├── src/                                  # React 19 / TypeScript Frontend
│   ├── app/                              # Root application, routes, providers
│   ├── components/                       # Shared UI components
│   │   ├── common/                       # Buttons, Cards, Badges, Modals, Focusable
│   │   ├── game-cards/                   # Grid game card, banner card, hero showcase
│   │   ├── navigation/                   # Topbar, Sidebar, Breadcrumb, ControllerHints
│   │   └── dialogs/                      # Confirmation dialogs, modal overlays
│   ├── features/                         # Feature-based modular slices
│   │   ├── home/                         # Dashboard, Continue Playing, Recommendations
│   │   ├── library/                      # Unified game grid, filtering, sorting, scan
│   │   ├── game-details/                 # Game hero, launch button, saves, stats
│   │   ├── controller/                   # Gamepad mapper, calibration, bindings
│   │   ├── emulators/                    # Emulator manager, ROM directories
│   │   ├── batocera/                     # Network Batocera discovery, game lists
│   │   ├── save-manager/                 # Snapshots, restore, version history
│   │   ├── cloud-sync/                   # Google Drive sync, conflict resolution
│   │   ├── profiles/                     # Multi-profile switcher, avatar picker
│   │   ├── statistics/                   # Playtime analytics, graphs, achievements
│   │   └── settings/                     # Launcher settings, paths, integrations
│   ├── hooks/                            # Custom hooks (useController, useGamepad, etc.)
│   ├── services/                         # Tauri IPC wrappers (invocations, listeners)
│   ├── stores/                           # Zustand stores (profile, library, sync, etc.)
│   ├── types/                            # TypeScript interfaces & DTOs
│   └── styles/                           # Tailwind CSS & global theme stylesheets
│
├── src-tauri/                            # Rust Backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── migrations/                       # SQLx SQLite migrations
│   └── src/
│       ├── main.rs                       # Application entrypoint
│       ├── lib.rs                        # Library initialization & plugin setup
│       ├── commands/                     # Thin Tauri IPC command handlers
│       ├── services/                     # Core business logic services
│       ├── models/                       # Domain models & Serde DTOs
│       ├── database/                     # SQLx pool manager & schema migrations
│       ├── repositories/                 # Database CRUD repositories
│       ├── platform/                     # OS abstraction (macOS, Linux, Windows)
│       ├── games/                        # Game scanner, launcher, process tracker
│       ├── stores/                       # Steam, Epic Games, GOG discovery modules
│       ├── controllers/                  # Native gamepad detection (Gilrs)
│       ├── metadata/                     # IGDB client & local metadata cache
│       ├── emulators/                    # Retro emulator runners & ROM scanner
│       ├── batocera/                     # Batocera network protocol client
│       ├── save_manager/                 # Save scanning, hashing, snapshotting, compression
│       ├── cloud/                        # OAuth 2.0 PKCE, Google Drive v3 client
│       ├── sync_engine/                  # Manifest diffing, queue worker, conflict engine
│       ├── profiles/                     # Profile lifecycle & data isolation
│       ├── downloads/                    # Resumable download manager (legal direct/magnet)
│       └── errors/                       # Structured error types (Thiserror / Anyhow)
```

---

## 3. Core Architectural Principles

1. **Local-First & Offline Resilience**:
   - The entire application (library browsing, metadata viewing, launching, save backups, profile switching) functions without an active internet connection.
   - Remote operations (cloud sync, IGDB scraping) degrade gracefully and enqueue work for when connectivity resumes.

2. **Zero Fake Functionality**:
   - Every UI button, action, and toggle maps directly to functional Rust services or concrete frontend state. No hollow mocks.

3. **Thin Commands, Rich Services**:
   - Tauri commands (`#[tauri::command]`) act solely as input validation and serialization boundaries, immediately delegating to domain services.

4. **Controller-First Navigation**:
   - All interactive views are navigable using standard gamepad D-pad, analog sticks, and face buttons (`A` confirm, `B` back, `X` secondary, `Y` options, bumpers for tabs).
   - Seamless fallback to keyboard (Arrow keys, Enter, Esc, Space) and mouse pointer without double-firing events.

5. **Safe Process Lifecycle & Game Save Protection**:
   - Games are launched via safe platform process builders (never shell string concatenation).
   - Before any save restoration or modification, a pre-restore safety snapshot is archived.
   - Deterministic SHA-256 file hashing is used for version comparison, eliminating reliance on volatile modification timestamps.

6. **Profile Data Isolation**:
   - Active profile ID scopes all save paths, playtime metrics, preferences, custom collections, and cloud sync manifests.

