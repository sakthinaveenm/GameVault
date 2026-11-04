use crate::errors::{AppError, AppResult};
use crate::models::Emulator;
use std::path::Path;
use std::process::Command;

pub struct EmulatorRunner;

impl EmulatorRunner {
    pub fn get_known_emulators() -> Vec<Emulator> {
        vec![
            Emulator {
                id: "retroarch".into(),
                name: "RetroArch".into(),
                executable_path: if cfg!(target_os = "macos") {
                    "/Applications/RetroArch.app/Contents/MacOS/RetroArch".into()
                } else {
                    "retroarch".into()
                },
                system_id: "multi".into(),
                supported_extensions: vec!["nes".into(), "snes".into(), "sfc".into(), "gba".into(), "gbc".into(), "bin".into(), "cue".into()],
                default_arguments: None,
                detected: false,
            },
            Emulator {
                id: "dolphin".into(),
                name: "Dolphin".into(),
                executable_path: if cfg!(target_os = "macos") {
                    "/Applications/Dolphin.app/Contents/MacOS/Dolphin".into()
                } else {
                    "dolphin-emu".into()
                },
                system_id: "gamecube_wii".into(),
                supported_extensions: vec!["iso".into(), "gcm".into(), "wbfs".into(), "ciso".into()],
                default_arguments: Some("-b -e".into()),
                detected: false,
            },
            Emulator {
                id: "pcsx2".into(),
                name: "PCSX2".into(),
                executable_path: if cfg!(target_os = "macos") {
                    "/Applications/PCSX2.app/Contents/MacOS/PCSX2".into()
                } else {
                    "pcsx2".into()
                },
                system_id: "ps2".into(),
                supported_extensions: vec!["iso".into(), "bin".into(), "chd".into(), "gz".into()],
                default_arguments: Some("-nogui".into()),
                detected: false,
            },
            Emulator {
                id: "ppsspp".into(),
                name: "PPSSPP".into(),
                executable_path: if cfg!(target_os = "macos") {
                    "/Applications/PPSSPP.app/Contents/MacOS/PPSSPP".into()
                } else {
                    "ppsspp".into()
                },
                system_id: "psp".into(),
                supported_extensions: vec!["iso".into(), "cso".into(), "pbp".into()],
                default_arguments: None,
                detected: false,
            },
        ]
    }

    pub fn launch_rom(
        emulator_path: &Path,
        custom_args: Option<&str>,
        rom_path: &Path,
    ) -> AppResult<u32> {
        if !emulator_path.exists() {
            return Err(AppError::ProcessLaunch(format!(
                "Emulator executable not found: {}",
                emulator_path.display()
            )));
        }

        if !rom_path.exists() {
            return Err(AppError::ProcessLaunch(format!(
                "ROM file not found: {}",
                rom_path.display()
            )));
        }

        let mut cmd = Command::new(emulator_path);

        if let Some(args_str) = custom_args {
            for arg in args_str.split_whitespace() {
                cmd.arg(arg);
            }
        }

        cmd.arg(rom_path);

        let mut child = cmd.spawn().map_err(|e| {
            AppError::ProcessLaunch(format!(
                "Failed to start emulator '{}': {}",
                emulator_path.display(),
                e
            ))
        })?;

        let pid = child.id();
        std::thread::spawn(move || {
            let _ = child.wait();
        });

        Ok(pid)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_emulator_definitions() {
        let emus = EmulatorRunner::get_known_emulators();
        assert!(emus.len() >= 4);
        assert!(emus.iter().any(|e| e.id == "retroarch"));
        assert!(emus.iter().any(|e| e.id == "dolphin"));
    }

    #[test]
    fn test_launch_rom_missing_files_fails_safely() {
        let fake_emu = PathBuf::from("/nonexistent/emu");
        let fake_rom = PathBuf::from("/nonexistent/game.sfc");
        let res = EmulatorRunner::launch_rom(&fake_emu, None, &fake_rom);
        assert!(res.is_err());
    }
}
