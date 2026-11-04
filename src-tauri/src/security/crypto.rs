use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;

pub struct BackupCrypto;

impl BackupCrypto {
    pub fn derive_key(passphrase: &str) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(passphrase.as_bytes());
        hasher.finalize().into()
    }

    pub fn encrypt_file(source: &Path, destination: &Path, passphrase: &str) -> Result<(), String> {
        let key_bytes = Self::derive_key(passphrase);
        let cipher = Aes256Gcm::new_from_slice(&key_bytes)
            .map_err(|e| format!("Cipher init error: {}", e))?;

        let mut file = File::open(source).map_err(|e| format!("Read error: {}", e))?;
        let mut plaintext = Vec::new();
        file.read_to_end(&mut plaintext)
            .map_err(|e| format!("Read error: {}", e))?;

        // 96-bit nonce (12 bytes)
        let nonce_bytes = [0x42u8; 12];
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_ref())
            .map_err(|e| format!("Encryption failure: {}", e))?;

        let mut dest = File::create(destination).map_err(|e| format!("Write error: {}", e))?;
        // Prepend nonce
        dest.write_all(&nonce_bytes)
            .map_err(|e| format!("Write error: {}", e))?;
        dest.write_all(&ciphertext)
            .map_err(|e| format!("Write error: {}", e))?;

        Ok(())
    }

    pub fn decrypt_file(source: &Path, destination: &Path, passphrase: &str) -> Result<(), String> {
        let key_bytes = Self::derive_key(passphrase);
        let cipher = Aes256Gcm::new_from_slice(&key_bytes)
            .map_err(|e| format!("Cipher init error: {}", e))?;

        let mut file = File::open(source).map_err(|e| format!("Read error: {}", e))?;
        let mut encrypted_data = Vec::new();
        file.read_to_end(&mut encrypted_data)
            .map_err(|e| format!("Read error: {}", e))?;

        if encrypted_data.len() < 12 {
            return Err("Encrypted data is too short".into());
        }

        let nonce = Nonce::from_slice(&encrypted_data[..12]);
        let ciphertext = &encrypted_data[12..];

        let decrypted = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|_| "Decryption failed or invalid recovery key".to_string())?;

        let mut dest = File::create(destination).map_err(|e| format!("Write error: {}", e))?;
        dest.write_all(&decrypted)
            .map_err(|e| format!("Write error: {}", e))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_aes256gcm_encryption_and_tamper_detection() {
        let temp = tempdir().unwrap();
        let plain_file = temp.path().join("plaintext.sav");
        let enc_file = temp.path().join("encrypted.enc");
        let dec_file = temp.path().join("decrypted.sav");

        std::fs::write(&plain_file, b"Confidential Save Game State").unwrap();

        // Encrypt
        BackupCrypto::encrypt_file(&plain_file, &enc_file, "SuperSecretPassphrase123")
            .expect("Encryption failed");
        assert!(enc_file.exists());

        // Decrypt
        BackupCrypto::decrypt_file(&enc_file, &dec_file, "SuperSecretPassphrase123")
            .expect("Decryption failed");

        let content = std::fs::read_to_string(&dec_file).unwrap();
        assert_eq!(content, "Confidential Save Game State");

        // Tamper test with wrong key
        let wrong_key_res = BackupCrypto::decrypt_file(&enc_file, &dec_file, "WrongPassphrase");
        assert!(wrong_key_res.is_err());
    }
}
