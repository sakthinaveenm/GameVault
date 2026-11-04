use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{self, Read};
use std::path::Path;
use walkdir::WalkDir;

pub struct SaveHasher;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FileHashEntry {
    pub relative_path: String,
    pub sha256_hash: String,
    pub size_bytes: u64,
}

impl SaveHasher {
    pub fn hash_file(path: &Path) -> io::Result<String> {
        let mut file = File::open(path)?;
        let mut hasher = Sha256::new();
        let mut buffer = [0u8; 8192];

        loop {
            let bytes_read = file.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }

        Ok(format!("{:x}", hasher.finalize()))
    }

    pub fn scan_and_hash_dir(dir: &Path) -> io::Result<(String, Vec<FileHashEntry>)> {
        let mut entries = Vec::new();
        let mut combined_hasher = Sha256::new();

        if !dir.exists() || !dir.is_dir() {
            return Ok(("empty".to_string(), entries));
        }

        let walker = WalkDir::new(dir)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok());

        for entry in walker {
            let path = entry.path();
            if path.is_file() {
                if let Ok(rel) = path.strip_prefix(dir) {
                    let rel_str = rel.to_string_lossy().replace('\\', "/");
                    let file_hash = Self::hash_file(path)?;
                    let size = entry.metadata()?.len();

                    combined_hasher.update(rel_str.as_bytes());
                    combined_hasher.update(file_hash.as_bytes());

                    entries.push(FileHashEntry {
                        relative_path: rel_str,
                        sha256_hash: file_hash,
                        size_bytes: size,
                    });
                }
            }
        }

        entries.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
        let combined_hash = format!("{:x}", combined_hasher.finalize());

        Ok((combined_hash, entries))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::tempdir;

    #[test]
    fn test_file_and_dir_hashing() {
        let temp = tempdir().unwrap();
        let root = temp.path();

        let save1 = root.join("save1.dat");
        let mut f1 = File::create(&save1).unwrap();
        f1.write_all(b"Game Save File 1 Content").unwrap();

        let (hash, entries) = SaveHasher::scan_and_hash_dir(root).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].relative_path, "save1.dat");
        assert!(!hash.is_empty());
    }
}

