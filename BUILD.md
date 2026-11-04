# Build & Release Engineering

## Building Universal Game Hub

### Standard Production Build
```bash
npm run tauri build
```
This produces:
- **macOS**: `src-tauri/target/release/bundle/dmg/Universal Game Hub_0.1.0_aarch64.dmg`
- **Windows**: `src-tauri/target/release/bundle/msi/Universal Game Hub_0.1.0_x64_en-US.msi`
- **Linux**: `src-tauri/target/release/bundle/appimage/Universal Game Hub_0.1.0_amd64.AppImage`

### Frontend Only Build
```bash
npm run build
```
Outputs static assets into the `dist/` directory.

### Cargo Release Profile Optimizations
Configured in `src-tauri/Cargo.toml`:
```toml
[profile.release]
codegen-units = 1
lto = true
opt-level = 3
panic = "abort"
strip = true
```
These settings minimize binary size and boost execution speed for optimal startup and low idle RAM footprint.

