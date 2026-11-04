use crate::errors::{AppError, AppResult};
use crate::models::Emulator;
use std::path::Path;
use std::process::Command;

pub struct EmulatorRunner;

impl EmulatorRunner {
    pub fn get_known_emulators() -> Vec<Emulator> {
        let find_path_and_status = |mac_candidates: &[&str], win_candidates: &[&str], linux_default: &str| -> (String, bool) {
            if cfg!(target_os = "macos") {
                for c in mac_candidates {
                    if Path::new(c).exists() {
                        return (c.to_string(), true);
                    }
                }
                (mac_candidates[0].to_string(), false)
            } else if cfg!(target_os = "windows") {
                for c in win_candidates {
                    if Path::new(c).exists() {
                        return (c.to_string(), true);
                    }
                }
                (win_candidates[0].to_string(), false)
            } else {
                (linux_default.to_string(), false)
            }
        };

        let (retroarch_path, retroarch_detected) = find_path_and_status(
            &["/Applications/RetroArch.app/Contents/MacOS/RetroArch"],
            &["C:\\RetroArch-Win64\\retroarch.exe", "C:\\Program Files\\RetroArch\\retroarch.exe", "D:\\Emulators\\RetroArch\\retroarch.exe"],
            "retroarch",
        );

        let (dolphin_path, dolphin_detected) = find_path_and_status(
            &["/Applications/Dolphin.app/Contents/MacOS/Dolphin"],
            &["C:\\Program Files\\Dolphin\\Dolphin.exe", "D:\\Emulators\\Dolphin\\Dolphin.exe"],
            "dolphin-emu",
        );

        let (pcsx2_path, pcsx2_detected) = find_path_and_status(
            &["/Applications/PCSX2.app/Contents/MacOS/PCSX2"],
            &["C:\\Program Files\\PCSX2\\pcsx2-qtx64.exe", "C:\\Program Files (x86)\\PCSX2\\pcsx2.exe", "D:\\Emulators\\PCSX2\\pcsx2-qtx64.exe"],
            "pcsx2",
        );

        let (ppsspp_path, ppsspp_detected) = find_path_and_status(
            &["/Applications/PPSSPP.app/Contents/MacOS/PPSSPP"],
            &["C:\\Program Files\\PPSSPP\\PPSSPPWindows64.exe", "D:\\Emulators\\PPSSPP\\PPSSPPWindows64.exe"],
            "ppsspp",
        );

        vec![
            Emulator {
                id: "retroarch".into(),
                name: "RetroArch".into(),
                executable_path: retroarch_path,
                system_id: "multi".into(),
                supported_extensions: vec!["nes".into(), "snes".into(), "sfc".into(), "gba".into(), "gbc".into(), "bin".into(), "cue".into()],
                default_arguments: None,
                detected: retroarch_detected,
            },
            Emulator {
                id: "dolphin".into(),
                name: "Dolphin".into(),
                executable_path: dolphin_path,
                system_id: "gamecube_wii".into(),
                supported_extensions: vec!["iso".into(), "gcm".into(), "wbfs".into(), "ciso".into()],
                default_arguments: Some("-b -e".into()),
                detected: dolphin_detected,
            },
            Emulator {
                id: "pcsx2".into(),
                name: "PCSX2".into(),
                executable_path: pcsx2_path,
                system_id: "ps2".into(),
                supported_extensions: vec!["iso".into(), "bin".into(), "chd".into(), "gz".into()],
                default_arguments: Some("-nogui".into()),
                detected: pcsx2_detected,
            },
            Emulator {
                id: "ppsspp".into(),
                name: "PPSSPP".into(),
                executable_path: ppsspp_path,
                system_id: "psp".into(),
                supported_extensions: vec!["iso".into(), "cso".into(), "pbp".into()],
                default_arguments: None,
                detected: ppsspp_detected,
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
