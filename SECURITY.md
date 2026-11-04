# Security Policies and Architecture

## 1. Process Execution Safety
- Games, emulators, and store launchers are invoked via typed argument vectors using `std::process::Command` in Rust.
- Shell interpolation (`sh -c`, `cmd.exe /c`) is strictly prohibited to prevent command injection vulnerabilities.

## 2. Path Traversal & File Safety
- Save game zip extraction validates every relative file path to ensure canonical destination stays strictly within the designated target save directory.
- Symlinks pointing outside target directories are rejected during archive extraction.
- Size caps are enforced on uncompressed archive expansion to prevent zip bomb denial-of-service.

## 3. Credential Protection
- OAuth access tokens and refresh tokens are stored in the OS-native keychain (Apple Keychain on macOS, Windows Credential Manager on Windows, Secret Service on Linux).
- API keys (IGDB Twitch client secret) are kept strictly within Rust backend memory and never dispatched to the webview.

## 4. Download Verification & Safe Execution
- Downloaded game installers or packages are never executed automatically upon completion.
- Executables require an explicit confirmation prompt displaying source URL and file path before running.
- SHA-256 integrity verification is conducted when checksums are provided.

