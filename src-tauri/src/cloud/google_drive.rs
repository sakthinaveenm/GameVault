use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveFile {
    pub id: String,
    pub name: String,
    #[serde(rename = "mimeType", default)]
    pub mime_type: Option<String>,
    #[serde(default)]
    pub size: Option<String>,
    #[serde(rename = "md5Checksum", default)]
    pub md5_checksum: Option<String>,
    #[serde(rename = "modifiedTime", default)]
    pub modified_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveFileList {
    #[serde(default)]
    pub files: Vec<DriveFile>,
}

pub struct GoogleDriveClient;

impl GoogleDriveClient {
    /// Searches for a file in Google Drive private AppDataFolder
    pub async fn find_appdata_file(
        access_token: &str,
        filename: &str,
    ) -> Result<Option<DriveFile>, String> {
        let client = reqwest::Client::new();
        let query = format!("name = '{}' and trashed = false", filename);

        let res = client
            .get("https://www.googleapis.com/drive/v3/files")
            .bearer_auth(access_token)
            .query(&[
                ("spaces", "appDataFolder"),
                ("q", &query),
                ("fields", "files(id, name, mimeType, size, md5Checksum, modifiedTime)"),
            ])
            .send()
            .await
            .map_err(|e| format!("Drive search request error: {}", e))?;

        if !res.status().is_success() {
            let err_body = res.text().await.unwrap_or_default();
            return Err(format!("Drive search failed: {}", err_body));
        }

        let file_list: DriveFileList = res
            .json()
            .await
            .map_err(|e| format!("Failed to parse Drive file list: {}", e))?;

        Ok(file_list.files.into_iter().next())
    }

    /// Uploads a new file to the private AppDataFolder using multipart MIME
    pub async fn upload_appdata_file(
        access_token: &str,
        filename: &str,
        content: &[u8],
        mime_type: &str,
    ) -> Result<DriveFile, String> {
        let client = reqwest::Client::new();
        let boundary = "UNIVERSAL_GAME_HUB_BOUNDARY";

        let metadata_json = serde_json::json!({
            "name": filename,
            "parents": ["appDataFolder"]
        })
        .to_string();

        let mut body = Vec::new();
        // Part 1: Metadata
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(b"Content-Type: application/json; charset=UTF-8\r\n\r\n");
        body.extend_from_slice(metadata_json.as_bytes());
        body.extend_from_slice(b"\r\n");

        // Part 2: File binary data
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(format!("Content-Type: {}\r\n\r\n", mime_type).as_bytes());
        body.extend_from_slice(content);
        body.extend_from_slice(b"\r\n");

        // Closing boundary
        body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", access_token))
                .map_err(|e| format!("Header error: {}", e))?,
        );
        headers.insert(
            CONTENT_TYPE,
            HeaderValue::from_str(&format!("multipart/related; boundary={}", boundary))
                .map_err(|e| format!("Header error: {}", e))?,
        );

        let res = client
            .post("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")
            .headers(headers)
            .body(body)
            .send()
            .await
            .map_err(|e| format!("Drive multipart upload request error: {}", e))?;

        if !res.status().is_success() {
            let err_body = res.text().await.unwrap_or_default();
            return Err(format!("Drive upload failed: {}", err_body));
        }

        let file: DriveFile = res
            .json()
            .await
            .map_err(|e| format!("Failed to parse uploaded Drive file response: {}", e))?;

        Ok(file)
    }

    /// Overwrites existing file content
    pub async fn update_file_content(
        access_token: &str,
        file_id: &str,
        content: &[u8],
        mime_type: &str,
    ) -> Result<DriveFile, String> {
        let client = reqwest::Client::new();
        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", access_token))
                .map_err(|e| format!("Header error: {}", e))?,
        );
        headers.insert(
            CONTENT_TYPE,
            HeaderValue::from_str(mime_type).map_err(|e| format!("Header error: {}", e))?,
        );

        let url = format!(
            "https://www.googleapis.com/upload/drive/v3/files/{}?uploadType=media",
            file_id
        );

        let res = client
            .patch(&url)
            .headers(headers)
            .body(content.to_vec())
            .send()
            .await
            .map_err(|e| format!("Drive update file request error: {}", e))?;

        if !res.status().is_success() {
            let err_body = res.text().await.unwrap_or_default();
            return Err(format!("Drive update failed: {}", err_body));
        }

        let file: DriveFile = res
            .json()
            .await
            .map_err(|e| format!("Failed to parse updated file response: {}", e))?;

        Ok(file)
    }

    /// Downloads binary file content from Google Drive
    pub async fn download_file(access_token: &str, file_id: &str) -> Result<Vec<u8>, String> {
        let client = reqwest::Client::new();
        let url = format!("https://www.googleapis.com/drive/v3/files/{}?alt=media", file_id);

        let res = client
            .get(&url)
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| format!("Drive download request error: {}", e))?;

        if !res.status().is_success() {
            let err_body = res.text().await.unwrap_or_default();
            return Err(format!("Drive download failed: {}", err_body));
        }

        let bytes = res
            .bytes()
            .await
            .map_err(|e| format!("Failed to read downloaded bytes: {}", e))?;

        Ok(bytes.to_vec())
    }

    /// Deletes a file from Google Drive
    pub async fn delete_file(access_token: &str, file_id: &str) -> Result<(), String> {
        let client = reqwest::Client::new();
        let url = format!("https://www.googleapis.com/drive/v3/files/{}", file_id);

        let res = client
            .delete(&url)
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| format!("Drive delete request error: {}", e))?;

        if !res.status().is_success() {
            let err_body = res.text().await.unwrap_or_default();
            return Err(format!("Drive delete failed: {}", err_body));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_drive_file_serialization() {
        let json_str = r#"{
            "id": "file-12345",
            "name": "manifest.json",
            "mimeType": "application/json",
            "size": "450",
            "md5Checksum": "abcde12345"
        }"#;

        let file: DriveFile = serde_json::from_str(json_str).expect("Deserialize DriveFile");
        assert_eq!(file.id, "file-12345");
        assert_eq!(file.name, "manifest.json");
        assert_eq!(file.size.as_deref(), Some("450"));
    }
}
