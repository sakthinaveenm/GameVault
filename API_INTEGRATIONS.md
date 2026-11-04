# API Integrations Specification

## 1. IGDB (Internet Game Database) API
- **Protocol**: RESTful HTTP with Twitch OAuth Client Credentials Flow.
- **Security**: Client ID and Client Secret are stored strictly in the backend (keychain or secure config) and never exposed to the frontend browser context.
- **Endpoints Used**:
  - `POST https://id.twitch.tv/oauth2/token`
  - `POST https://api.igdb.com/v4/games`
  - `POST https://api.igdb.com/v4/covers`
  - `POST https://api.igdb.com/v4/artworks`
- **Caching**: All metadata, summaries, release dates, and thumbnail paths are cached in local SQLite tables (`MetadataCache`). Artwork is persisted to the local cache directory (`~/.universalgamehub/cache/artwork/`).
- **Offline Behavior**: When offline, the launcher retrieves cached metadata without hanging or displaying broken image indicators.

## 2. Google OAuth 2.0 & Google Drive API v3
- **Flow**: Desktop Authorization Code Flow with PKCE (RFC 7636).
- **Callback**: Local HTTP loopback listener (`http://127.0.0.1:<port>/oauth/callback`) or custom URI scheme (`universalgamehub://oauth/callback`).
- **Scopes**:
  - `https://www.googleapis.com/auth/drive.appdata` (Private application data folder: isolated and secure)
  - `https://www.googleapis.com/auth/drive.file` (Per-file access for user-selected cloud backup directory)
- **Token Storage**: Refresh tokens are stored directly in the operating system credential vault (macOS Keychain, Windows Credential Manager, Linux Secret Service). No plaintext secrets in SQLite or git.

## 3. Steam Store Discovery
- Parses local Steam installation directory:
  - macOS: `~/Library/Application Support/Steam`
  - Windows: `C:\Program Files (x86)\Steam`
  - Linux: `~/.local/share/Steam` or `~/.steam/steam`
- Reads `libraryfolders.vdf` and app manifests (`appmanifest_<appid>.acf`).
- Launches games via `steam://rungameid/<appid>`.

## 4. Epic Games Launcher Discovery
- Reads manifests from:
  - macOS: `/Users/Shared/Epic Games/`
  - Windows: `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests\*.item`
- Extracts display name, install location, and main executable.

## 5. GOG Galaxy Discovery
- Discovers GOG installs through registry keys on Windows or Galaxy application directory paths on macOS/Linux.

