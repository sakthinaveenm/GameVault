# Testing Strategy & Verification Guide

## 1. Rust Unit & Integration Tests
Located in `src-tauri/src/` and `src-tauri/tests/`:
- **Database & Repositories**: Test SQLite in-memory pools (`sqlite::memory:`), migrations, profile creation, and cascading deletes.
- **Process Launcher**: Test command vector formulation, process exit monitoring, and error handling for missing executables.
- **Save Backup & Restore**: Test SHA-256 computation, zip packing/unpacking, directory traversal resistance, and safety backups.
- **Conflict Engine**: Test manifest diffing, divergence detection, and resolution states.

Run tests:
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

## 2. Frontend Tests
Located in `src/`:
- **Components**: Test focus management, gamepad button handling, modal rendering.
- **Stores**: Zustand state mutation tests (active profile switching, library filters, download queue).

Run tests:
```bash
npm test
```

