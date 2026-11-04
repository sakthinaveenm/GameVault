use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GameSyncEntry {
    pub last_snapshot_id: String,
    pub snapshot_hash: String,
    pub compressed_size: u64,
    pub cloud_file_id: String,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SyncManifest {
    pub manifest_version: u32,
    pub profile_id: String,
    pub device_id: String,
    pub timestamp: i64,
    pub games: HashMap<String, GameSyncEntry>,
}

impl SyncManifest {
    pub fn new(profile_id: &str, device_id: &str) -> Self {
        Self {
            manifest_version: 1,
            profile_id: profile_id.to_string(),
            device_id: device_id.to_string(),
            timestamp: Utc::now().timestamp(),
            games: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LocalSnapshotInfo {
    pub snapshot_id: String,
    pub snapshot_hash: String,
    pub compressed_size: u64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum SyncAction {
    InSync {
        game_id: String,
    },
    UploadLocal {
        game_id: String,
        local_snapshot_id: String,
    },
    DownloadRemote {
        game_id: String,
        cloud_file_id: String,
        expected_hash: String,
    },
    Conflict {
        game_id: String,
        local_snapshot: LocalSnapshotInfo,
        remote_entry: GameSyncEntry,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ConflictResolutionStrategy {
    KeepLocal,
    KeepCloud,
    KeepBoth,
}

pub struct SyncEngine;

impl SyncEngine {
    /// Compares the local snapshot collection against the remote manifest to determine sync actions
    pub fn evaluate_sync_actions(
        local_snapshots: &HashMap<String, LocalSnapshotInfo>,
        remote_manifest: &SyncManifest,
    ) -> Vec<SyncAction> {
        let mut actions = Vec::new();
        let mut evaluated_game_ids = std::collections::HashSet::new();

        // Check games existing in local snapshots
        for (game_id, local) in local_snapshots {
            evaluated_game_ids.insert(game_id.clone());

            match remote_manifest.games.get(game_id) {
                Some(remote) => {
                    if local.snapshot_hash == remote.snapshot_hash {
                        actions.push(SyncAction::InSync {
                            game_id: game_id.clone(),
                        });
                    } else {
                        // Hashes differ: check timestamps to detect conflict
                        // If local was updated after remote or vice-versa with divergent hashes
                        actions.push(SyncAction::Conflict {
                            game_id: game_id.clone(),
                            local_snapshot: local.clone(),
                            remote_entry: remote.clone(),
                        });
                    }
                }
                None => {
                    // Exists locally but not in cloud
                    actions.push(SyncAction::UploadLocal {
                        game_id: game_id.clone(),
                        local_snapshot_id: local.snapshot_id.clone(),
                    });
                }
            }
        }

        // Check games existing only in remote manifest
        for (game_id, remote) in &remote_manifest.games {
            if !evaluated_game_ids.contains(game_id) {
                actions.push(SyncAction::DownloadRemote {
                    game_id: game_id.clone(),
                    cloud_file_id: remote.cloud_file_id.clone(),
                    expected_hash: remote.snapshot_hash.clone(),
                });
            }
        }

        actions
    }

    /// Generates updated remote manifest reflecting a resolved state
    pub fn apply_resolution(
        manifest: &mut SyncManifest,
        game_id: &str,
        strategy: ConflictResolutionStrategy,
        local_snapshot: &LocalSnapshotInfo,
        new_cloud_file_id: Option<&str>,
    ) {
        match strategy {
            ConflictResolutionStrategy::KeepLocal => {
                let cloud_file_id = new_cloud_file_id.unwrap_or("pending_upload_id").to_string();
                manifest.games.insert(
                    game_id.to_string(),
                    GameSyncEntry {
                        last_snapshot_id: local_snapshot.snapshot_id.clone(),
                        snapshot_hash: local_snapshot.snapshot_hash.clone(),
                        compressed_size: local_snapshot.compressed_size,
                        cloud_file_id,
                        updated_at: Utc::now().timestamp(),
                    },
                );
            }
            ConflictResolutionStrategy::KeepCloud => {
                // Remote remains authority
            }
            ConflictResolutionStrategy::KeepBoth => {
                // Keep local updated as branch
                if let Some(remote) = manifest.games.get(game_id).cloned() {
                    let forked_game_id = format!("{}_cloud_backup", game_id);
                    manifest.games.insert(forked_game_id, remote);
                }
                manifest.games.insert(
                    game_id.to_string(),
                    GameSyncEntry {
                        last_snapshot_id: local_snapshot.snapshot_id.clone(),
                        snapshot_hash: local_snapshot.snapshot_hash.clone(),
                        compressed_size: local_snapshot.compressed_size,
                        cloud_file_id: new_cloud_file_id.unwrap_or("fork_id").to_string(),
                        updated_at: Utc::now().timestamp(),
                    },
                );
            }
        }
        manifest.timestamp = Utc::now().timestamp();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sync_engine_diff_scenarios() {
        let profile_id = "test-prof-1";
        let device_id = "device-mac-1";
        let mut manifest = SyncManifest::new(profile_id, device_id);

        let mut local_snapshots = HashMap::new();

        // 1. Game only in local
        local_snapshots.insert(
            "game-1".to_string(),
            LocalSnapshotInfo {
                snapshot_id: "snap-1".into(),
                snapshot_hash: "hash-aaa".into(),
                compressed_size: 1024,
                created_at: 1000,
            },
        );

        // 2. Game matching in both
        local_snapshots.insert(
            "game-2".to_string(),
            LocalSnapshotInfo {
                snapshot_id: "snap-2".into(),
                snapshot_hash: "hash-identical".into(),
                compressed_size: 2048,
                created_at: 1050,
            },
        );
        manifest.games.insert(
            "game-2".to_string(),
            GameSyncEntry {
                last_snapshot_id: "snap-2-remote".into(),
                snapshot_hash: "hash-identical".into(),
                compressed_size: 2048,
                cloud_file_id: "drive-file-2".into(),
                updated_at: 1050,
            },
        );

        // 3. Game conflicting (different hashes)
        local_snapshots.insert(
            "game-3".to_string(),
            LocalSnapshotInfo {
                snapshot_id: "snap-3-local".into(),
                snapshot_hash: "hash-local-3".into(),
                compressed_size: 4096,
                created_at: 2000,
            },
        );
        manifest.games.insert(
            "game-3".to_string(),
            GameSyncEntry {
                last_snapshot_id: "snap-3-remote".into(),
                snapshot_hash: "hash-remote-3".into(),
                compressed_size: 4100,
                cloud_file_id: "drive-file-3".into(),
                updated_at: 1900,
            },
        );

        // 4. Game only in remote
        manifest.games.insert(
            "game-4".to_string(),
            GameSyncEntry {
                last_snapshot_id: "snap-4-remote".into(),
                snapshot_hash: "hash-remote-4".into(),
                compressed_size: 8192,
                cloud_file_id: "drive-file-4".into(),
                updated_at: 2100,
            },
        );

        let actions = SyncEngine::evaluate_sync_actions(&local_snapshots, &manifest);

        assert!(actions.contains(&SyncAction::UploadLocal {
            game_id: "game-1".into(),
            local_snapshot_id: "snap-1".into(),
        }));

        assert!(actions.contains(&SyncAction::InSync {
            game_id: "game-2".into(),
        }));

        assert!(actions.iter().any(|a| matches!(a, SyncAction::Conflict { game_id, .. } if game_id == "game-3")));

        assert!(actions.contains(&SyncAction::DownloadRemote {
            game_id: "game-4".into(),
            cloud_file_id: "drive-file-4".into(),
            expected_hash: "hash-remote-4".into(),
        }));
    }

    #[test]
    fn test_apply_resolution_keep_local() {
        let mut manifest = SyncManifest::new("p1", "d1");
        let local_info = LocalSnapshotInfo {
            snapshot_id: "snap-local".into(),
            snapshot_hash: "hash-local".into(),
            compressed_size: 500,
            created_at: 100,
        };

        SyncEngine::apply_resolution(
            &mut manifest,
            "game-x",
            ConflictResolutionStrategy::KeepLocal,
            &local_info,
            Some("uploaded-id-123"),
        );

        let entry = manifest.games.get("game-x").expect("game-x in manifest");
        assert_eq!(entry.snapshot_hash, "hash-local");
        assert_eq!(entry.cloud_file_id, "uploaded-id-123");
    }
}
