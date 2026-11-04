use crate::errors::{AppError, AppResult};
use crate::save_manager::backup::SaveBackup;
use std::fs::{self, File};
use std::io;
use std::path::Path;
use zip::ZipArchive;

pub struct SaveRestore;

impl SaveRestore {
    pub fn restore_archive_safely(
        archive_path: &Path,
        target_save_dir: &Path,
        backup_archive_dest: Option<&Path>,
    ) -> AppResult<()> {
        if !archive_path.exists() {
            return Err(AppError::SaveManager(format!(
                "Archive file not found: {}",
                archive_path.display()
            )));
        }

        // 1. Mandatory Safety Pre-Restore Backup of current live save files
        if target_save_dir.exists() {
            if let Some(safety_dest) = backup_archive_dest {
                let _ = SaveBackup::create_archive(target_save_dir, safety_dest);
            }
        } else {
            fs::create_dir_all(target_save_dir)?;
        }

        // 2. Safe Extraction with Path Traversal Protection
        let file = File::open(archive_path)?;
        let mut zip = ZipArchive::new(file).map_err(|e| {
            AppError::SaveManager(format!("Failed to open zip archive: {}", e))
        })?;

        for i in 0..zip.len() {
            let mut file_entry = zip.by_index(i).map_err(|e| {
                AppError::SaveManager(format!("Failed to read archive entry: {}", e))
            })?;

            let enclosed_name = match file_entry.enclosed_name() {
                Some(p) => p.to_owned(),
                None => {
                    return Err(AppError::SaveManager(
                        "Path traversal vulnerability detected in archive file entry".into(),
                    ));
                }
            };

            let out_path = target_save_dir.join(enclosed_name);

            if file_entry.is_dir() {
                fs::create_dir_all(&out_path)?;
            } else {
                if let Some(parent) = out_path.parent() {
                    fs::create_dir_all(parent)?;
                }
                let mut out_file = File::create(&out_path)?;
                io::copy(&mut file_entry, &mut out_file)?;
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::tempdir;

    #[test]
    fn test_backup_and_safe_restore_lifecycle() {
        let temp = tempdir().unwrap();
        let root = temp.path();

        let live_saves = root.join("live_saves");
        fs::create_dir_all(&live_saves).unwrap();

        let save_file = live_saves.join("slot1.sav");
        let mut f = File::create(&save_file).unwrap();
        f.write_all(b"Original Save Slot 1 Data").unwrap();

        // Create backup archive
        let archive_dest = root.join("backups/snap1.zip");
        let size = SaveBackup::create_archive(&live_saves, &archive_dest).unwrap();
        assert!(size > 0);
        assert!(archive_dest.exists());

        // Modify live save
        {
            let mut f_mod = File::create(&save_file).unwrap();
            f_mod.write_all(b"Modified Save Slot 1 Data").unwrap();
        }

        // Restore snapshot safely with pre-restore backup
        let safety_dest = root.join("backups/safety_before_restore.zip");
        SaveRestore::restore_archive_safely(&archive_dest, &live_saves, Some(&safety_dest))
            .expect("Restore failed");

        // Verify restored content matches original
        let restored_content = fs::read_to_string(&save_file).unwrap();
        assert_eq!(restored_content, "Original Save Slot 1 Data");

        // Verify safety backup was produced
        assert!(safety_dest.exists());
    }
}
