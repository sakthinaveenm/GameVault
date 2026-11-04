# Save Game Management & Version History

## 1. Overview
The Save Game Manager detaches game save data from fragile local directories, giving users snapshot creation, automated post-play backups, version restoration, and diff inspection.

## 2. Automated Save Backup Lifecycle
1. **Game Launch Event**: Process monitor captures PID, game ID, profile ID, and configured save directories.
2. **Game Exit Event**: Monitor detects process termination.
3. **Write Quiescence Delay**: Waits a configurable delay (default 5 seconds) to ensure all deferred disk flushes complete.
4. **Directory Scan**: Recursively hashes all save files using SHA-256.
5. **Change Evaluation**: Compares combined file hash against latest snapshot.
6. **Snapshot Generation**: If changes are detected:
   - Packs changed save files into a compressed `.zip` archive stored in `~/.universalgamehub/saves/<profile_id>/<game_id>/<snapshot_id>.zip`.
   - Records metadata in `SaveSnapshots` and `SaveFiles` database tables.
   - Enqueues cloud sync if Google Drive sync is enabled for the active profile.

## 3. Safe Restoration Guarantees
- **Safety Pre-Restore Backup**: Universal Game Hub automatically generates a timestamped snapshot of current live save files *before* executing any restore operation.
- **Atomic Extraction**: Archives are extracted into a temporary directory first, verified against stored file hashes, and then atomically swapped or copied into the target save directory.
- **Process Guard**: Restorations are rejected if the game process is currently running.

