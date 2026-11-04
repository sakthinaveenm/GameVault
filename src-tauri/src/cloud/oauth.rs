use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use uuid::Uuid;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PkceSession {
    pub code_verifier: String,
    pub code_challenge: String,
    pub state: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GoogleTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
    pub token_type: String,
    pub scope: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GoogleUserProfile {
    pub id: String,
    pub email: String,
    pub verified_email: Option<bool>,
    pub name: Option<String>,
    pub picture: Option<String>,
}

pub struct OAuthManager;

fn percent_encode(s: &str) -> String {
    let mut encoded = String::new();
    for byte in s.bytes() {
        match byte {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(byte as char);
            }
            _ => {
                encoded.push_str(&format!("%{:02X}", byte));
            }
        }
    }
    encoded
}

impl OAuthManager {
    /// Generates a cryptographically random PKCE code verifier and challenge
    pub fn generate_pkce() -> PkceSession {
        let u1 = Uuid::new_v4();
        let u2 = Uuid::new_v4();
        let mut random_bytes = Vec::with_capacity(32);
        random_bytes.extend_from_slice(u1.as_bytes());
        random_bytes.extend_from_slice(u2.as_bytes());

        let code_verifier = URL_SAFE_NO_PAD.encode(&random_bytes);
        
        let mut hasher = Sha256::new();
        hasher.update(code_verifier.as_bytes());
        let hash = hasher.finalize();
        let code_challenge = URL_SAFE_NO_PAD.encode(&hash);
        let state = Uuid::new_v4().to_string();

        PkceSession {
            code_verifier,
            code_challenge,
            state,
        }
    }

    /// Constructs the Google OAuth 2.0 authorization URL
    pub fn build_authorization_url(
        client_id: &str,
        redirect_uri: &str,
        pkce: &PkceSession,
    ) -> String {
        let scopes = "https://www.googleapis.com/auth/drive.appdata%20https://www.googleapis.com/auth/drive.file%20email%20profile";
        format!(
            "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&code_challenge={}&code_challenge_method=S256&state={}&access_type=offline&prompt=consent",
            client_id,
            percent_encode(redirect_uri),
            scopes,
            pkce.code_challenge,
            pkce.state
        )
    }

    /// Binds a loopback TCP listener on an ephemeral port
    pub async fn bind_loopback() -> Result<(TcpListener, u16), String> {
        let listener = TcpListener::bind("127.0.0.1:0")
            .await
            .map_err(|e| format!("Failed to bind loopback TCP port: {}", e))?;
        let port = listener
            .local_addr()
            .map_err(|e| format!("Failed to get local port: {}", e))?
            .port();
        Ok((listener, port))
    }

    /// Parses the HTTP request to extract code and state from `/oauth/callback?code=...&state=...`
    pub fn parse_callback_query(http_request: &str) -> (Option<String>, Option<String>) {
        let first_line = match http_request.lines().next() {
            Some(l) => l,
            None => return (None, None),
        };
        let mut parts = first_line.split_whitespace();
        let _method = parts.next();
        let uri = match parts.next() {
            Some(u) => u,
            None => return (None, None),
        };

        if let Some(pos) = uri.find('?') {
            let query_str = &uri[pos + 1..];
            let mut code = None;
            let mut state = None;

            for param in query_str.split('&') {
                let mut kv = param.splitn(2, '=');
                let k = kv.next().unwrap_or("");
                let v = kv.next().unwrap_or("");
                if k == "code" {
                    code = Some(v.to_string());
                } else if k == "state" {
                    state = Some(v.to_string());
                }
            }
            return (code, state);
        }

        (None, None)
    }

    /// Waits for incoming OAuth redirect on loopback TCP listener
    pub async fn wait_for_authorization_code(
        listener: TcpListener,
        expected_state: &str,
    ) -> Result<String, String> {
        let (mut socket, _) = listener
            .accept()
            .await
            .map_err(|e| format!("TCP accept error: {}", e))?;

        let mut buf = vec![0u8; 4096];
        let n = socket
            .read(&mut buf)
            .await
            .map_err(|e| format!("Socket read error: {}", e))?;
        let request_str = String::from_utf8_lossy(&buf[..n]);

        let (code, state) = Self::parse_callback_query(&request_str);

        let html_response = r#"<!DOCTYPE html>
<html>
<head><title>Universal Game Hub - Cloud Sync</title></head>
<body style="background:#0b0e14;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
<div style="text-align:center;padding:30px;border-radius:16px;background:#1e293b;border:1px solid #334155;">
  <h2 style="color:#38bdf8;margin-bottom:8px;">Authentication Successful</h2>
  <p style="color:#94a3b8;font-size:14px;">Universal Game Hub is now linked to Google Drive.</p>
  <p style="color:#64748b;font-size:12px;">You may safely close this browser window and return to the launcher.</p>
</div>
</body>
</html>"#;

        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            html_response.len(),
            html_response
        );

        let _ = socket.write_all(response.as_bytes()).await;
        let _ = socket.flush().await;

        let received_state = state.ok_or_else(|| "Missing state in OAuth callback".to_string())?;
        if received_state != expected_state {
            return Err("OAuth state mismatch; potential CSRF intercepted".to_string());
        }

        code.ok_or_else(|| "Authorization code missing in callback".to_string())
    }

    /// Exchanges authorization code for tokens via Google OAuth token endpoint
    pub async fn exchange_code(
        client_id: &str,
        client_secret: Option<&str>,
        code: &str,
        code_verifier: &str,
        redirect_uri: &str,
    ) -> Result<GoogleTokens, String> {
        let client = reqwest::Client::new();
        let mut params = HashMap::new();
        params.insert("client_id", client_id);
        if let Some(secret) = client_secret {
            params.insert("client_secret", secret);
        }
        params.insert("code", code);
        params.insert("code_verifier", code_verifier);
        params.insert("grant_type", "authorization_code");
        params.insert("redirect_uri", redirect_uri);

        let res = client
            .post("https://oauth2.googleapis.com/token")
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Token request failed: {}", e))?;

        if !res.status().is_success() {
            let err_body = res.text().await.unwrap_or_default();
            return Err(format!("OAuth token exchange failed: {}", err_body));
        }

        let tokens: GoogleTokens = res
            .json()
            .await
            .map_err(|e| format!("Failed to parse token response: {}", e))?;

        Ok(tokens)
    }

    /// Fetches user identity from Google UserInfo endpoint
    pub async fn fetch_user_info(access_token: &str) -> Result<GoogleUserProfile, String> {
        let client = reqwest::Client::new();
        let res = client
            .get("https://www.googleapis.com/oauth2/v2/userinfo")
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| format!("UserInfo request failed: {}", e))?;

        if !res.status().is_success() {
            let err_body = res.text().await.unwrap_or_default();
            return Err(format!("UserInfo retrieval failed: {}", err_body));
        }

        let profile: GoogleUserProfile = res
            .json()
            .await
            .map_err(|e| format!("Failed to parse userinfo: {}", e))?;

        Ok(profile)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pkce_generation() {
        let pkce = OAuthManager::generate_pkce();
        assert_eq!(pkce.code_verifier.len(), 43); // 32 bytes base64url no pad = 43 chars
        assert!(!pkce.code_challenge.is_empty());
        assert!(!pkce.state.is_empty());
    }

    #[test]
    fn test_parse_callback_query() {
        let http_raw = "GET /oauth/callback?code=4/0Abc123xyz&state=uuid-test-123 HTTP/1.1\r\nHost: 127.0.0.1:8080\r\n\r\n";
        let (code, state) = OAuthManager::parse_callback_query(http_raw);
        assert_eq!(code.as_deref(), Some("4/0Abc123xyz"));
        assert_eq!(state.as_deref(), Some("uuid-test-123"));
    }
}
