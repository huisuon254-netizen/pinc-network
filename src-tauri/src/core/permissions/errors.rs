use thiserror::Error;
#[derive(Debug, Error)]
pub enum PermissionError {
    #[error("Permission denied: {0}")]
    Denied(String),
    #[error("Device not trusted")]
    DeviceNotTrusted,
    #[error("Trust level too low: required {required}, got {got}")]
    TrustTooLow { required: u8, got: u8 },
}
