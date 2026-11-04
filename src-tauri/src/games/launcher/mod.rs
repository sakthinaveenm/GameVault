use crate::errors::{AppError, AppResult};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::time::Instant;
use tracing::info;

pub struct GameLauncher;

pub struct RunningGameSession {
    pub process_id: u32,
    pub start_time: Instant,
}

impl GameLauncher {
    pub fn launch(
        executable_path: &Path,
        args: &[String],
        working_dir: Option<&Path>,
    ) -> AppResult<Child> {
        let path_str = executable_path.to_string_lossy();

        // 1. Support URL / Store Protocol Launching (e.g. steam://rungameid/..., com.epicgames.launcher://...)
        let is_protocol = path_str.starts_with("steam://")
            || path_str.starts_with("com.epicgames.launcher://")
            || path_str.starts_with("http://")
            || path_str.starts_with("https://");

        if is_protocol {
            #[cfg(target_os = "windows")]
            {
                let mut cmd = Command::new("cmd");
                cmd.args(["/c", "start", "", &path_str]);
                return cmd.spawn().map_err(|e| {
                    AppError::ProcessLaunch(format!("Failed to launch store protocol: {}", e))
                });
            }
            #[cfg(target_os = "macos")]
            {
                let mut cmd = Command::new("open");
                cmd.arg(&*path_str);
                return cmd.spawn().map_err(|e| {
                    AppError::ProcessLaunch(format!("Failed to launch store protocol: {}", e))
                });
            }
            #[cfg(target_os = "linux")]
            {
                let mut cmd = Command::new("xdg-open");
                cmd.arg(&*path_str);
                return cmd.spawn().map_err(|e| {
                    AppError::ProcessLaunch(format!("Failed to launch store protocol: {}", e))
                });
            }
        }

        // Check if executable exists on filesystem
        if !executable_path.exists() {
            // Check if first argument is a protocol scheme as fallback
            if let Some(first_arg) = args.first() {
                if first_arg.starts_with("steam://") || first_arg.starts_with("com.epicgames.launcher://") {
                    #[cfg(target_os = "windows")]
                    {
                        let mut cmd = Command::new("cmd");
                        cmd.args(["/c", "start", "", first_arg]);
                        return cmd.spawn().map_err(|e| AppError::ProcessLaunch(e.to_string()));
                    }
                    #[cfg(target_os = "macos")]
                    {
                        let mut cmd = Command::new("open");
                        cmd.arg(first_arg);
                        return cmd.spawn().map_err(|e| AppError::ProcessLaunch(e.to_string()));
                    }
                    #[cfg(target_os = "linux")]
                    {
                        let mut cmd = Command::new("xdg-open");
                        cmd.arg(first_arg);
                        return cmd.spawn().map_err(|e| AppError::ProcessLaunch(e.to_string()));
                    }
                }
            }

            return Err(AppError::ProcessLaunch(format!(
                "Executable file not found: {}",
                executable_path.display()
            )));
        }

        // 2. macOS .app bundle directory execution via `open`
        #[cfg(target_os = "macos")]
        {
            if executable_path.is_dir()
                && executable_path
                    .extension()
                    .map_or(false, |ext| ext.eq_ignore_ascii_case("app"))
            {
                let mut cmd = Command::new("open");
                cmd.arg(executable_path);
                if !args.is_empty() {
                    cmd.arg("--args");
                    cmd.args(args);
                }
                cmd.stdout(Stdio::null());
                cmd.stderr(Stdio::null());
                return cmd.spawn().map_err(|e| {
                    AppError::ProcessLaunch(format!(
                        "Failed to launch macOS bundle '{}': {}",
                        executable_path.display(),
                        e
                    ))
                });
            }
        }

        // 3. Standard executable process launch
        let mut cmd = Command::new(executable_path);
        cmd.args(args);

        if let Some(dir) = working_dir {
            cmd.current_dir(dir);
        } else if let Some(parent) = executable_path.parent() {
            cmd.current_dir(parent);
        }

        cmd.stdout(Stdio::null());
        cmd.stderr(Stdio::null());

        info!(
            "Launching process: {} with args: {:?}",
            executable_path.display(),
            args
        );

        let child = cmd.spawn().map_err(|e| {
            AppError::ProcessLaunch(format!(
                "Failed to execute '{}': {}",
                executable_path.display(),
                e
            ))
        })?;

        Ok(child)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_launch_nonexistent_fails_safely() {
        let fake = PathBuf::from("/nonexistent/game_binary_xyz");
        let result = GameLauncher::launch(&fake, &[], None);
        assert!(result.is_err());
        match result {
            Err(AppError::ProcessLaunch(msg)) => assert!(msg.contains("not found")),
            _ => panic!("Expected ProcessLaunch error"),
        }
    }

    #[test]
    fn test_launch_valid_binary() {
        // Test with benign system binary
        #[cfg(unix)]
        let binary = PathBuf::from("/bin/echo");
        #[cfg(windows)]
        let binary = PathBuf::from("C:\\Windows\\System32\\cmd.exe");

        if binary.exists() {
            let mut child = GameLauncher::launch(&binary, &["hello".into()], None)
                .expect("Failed to launch benign command");
            let exit = child.wait().expect("Wait failed");
            assert!(exit.success());
        }
    }
}
