# Cloud Synchronization Engine

## 1. Synchronization Model
Universal Game Hub uses a deterministic, hash-based manifest sync model rather than naive modification timestamps.

## 2. Sync Manifest Specification (`manifest.json`)
```json
{
  "manifest_version": 1,
  "profile_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "device_id": "macbook-pro-m2-darwin",
  "timestamp": 1730720000,
  "games": {
    "game-uuid-1": {
      "last_snapshot_id": "snap-550e8400",
      "snapshot_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "compressed_size": 204850,
      "cloud_file_id": "1A2B3C4D5E6F",
      "updated_at": 1730719800
    }
  }
}
```

## 3. Conflict Detection Algorithm
1. Retrieve remote `manifest.json` from Google Drive (`appDataFolder` or user backup folder).
2. Compare local game snapshot hash with remote snapshot hash.
3. If both hashes differ and remote timestamp is newer than last known synced snapshot:
   - Mark as **Sync Conflict**.
   - Do NOT overwrite local save.
   - Present conflict dialog with local vs remote metadata:
     - Device names
     - Timestamps
     - Snapshot file sizes
     - Quick file preview
4. User selects resolution:
   - **Keep Local**: Uploads local snapshot as the new authority.
   - **Keep Cloud**: Downloads remote snapshot, backing up the replaced local version into local backup archive first.
   - **Fork/Keep Both**: Retains both as distinct selectable snapshots in Version History.

