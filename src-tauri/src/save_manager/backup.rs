use crate::errors::{AppError, AppResult};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

pub struct SaveBackup;

impl SaveBackup {
    pub fn create_archive(source_dir: &Path, destination_zip: &Path) -> AppResult<u64> {
        if !source_dir.exists() || !source_dir.is_dir() {
            return Err(AppError::SaveManager(format!(
                "Source save directory does not exist: {}",
                source_dir.display()
            )));
        }

        if let Some(parent) = destination_zip.parent() {
            fs::create_dir_all(parent)?;
        }

        let file = File::create(destination_zip)?;
        let mut zip = ZipWriter::new(file);
        let options = SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);

        let walker = WalkDir::new(source_dir)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok());

        let mut buffer = Vec::new();

        for entry in walker {
            let path = entry.path();
            if path.is_file() {
                if let Ok(rel) = path.strip_prefix(source_dir) {
                    let rel_str = rel.to_string_lossy().replace('\\', "/");
                    zip.start_file(&rel_str, options).map_err(|e| {
                        AppError::SaveManager(format!("Zip packing error: {}", e))
                    })?;

                    let mut f = File::open(path)?;
                    buffer.clear();
                    f.read_to_end(&mut buffer)?;
                    zip.write_all(&buffer)?;
                }
            }
        }

        zip.finish().map_err(|e| {
            AppError::SaveManager(format!("Failed to finalize zip archive: {}", e))
        })?;

        let metadata = fs::metadata(destination_zip)?;
        Ok(metadata.len())
    }
}

