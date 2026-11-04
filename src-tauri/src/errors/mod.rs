use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Process launch failed: {0}")]
    ProcessLaunch(String),

    #[error("Game not found: {0}")]
    GameNotFound(String),

    #[error("Profile not found: {0}")]
    ProfileNotFound(String),

    #[error("Authentication error: {0}")]
    Auth(String),

    #[error("Cloud sync error: {0}")]
    CloudSync(String),

    #[error("Save manager error: {0}")]
    SaveManager(String),

    #[error("{0}")]
    Generic(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;

