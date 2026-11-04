# Development Guide

## Prerequisites
- **Node.js**: v20+ (tested with v26+)
- **npm**: v10+ (tested with v11+)
- **Rust Toolchain**: 1.80+ (tested with 1.99.1)
- **Tauri 2 CLI**: `@tauri-apps/cli` v2

## Setup Instructions

1. **Install Node dependencies**:
   ```bash
   npm install
   ```

2. **Verify Rust toolchain**:
   ```bash
   rustc --version
   cargo --version
   ```

3. **Run in Development Mode**:
   ```bash
   npm run tauri dev
   ```

4. **Run Frontend in Browser Mode** (Fast UI iteration without native bridge):
   ```bash
   npm run dev
   ```

5. **Type Checking & Linting**:
   ```bash
   npm run build
   ```

6. **Rust Tests**:
   ```bash
   cd src-tauri && cargo test
   ```

