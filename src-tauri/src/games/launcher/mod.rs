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
        if !executable_path.exists() {
            return Err(AppError::ProcessLaunch(format!(
                "Executable file not found: {}",
                executable_path.display()
            )));
        }

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
