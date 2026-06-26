use thiserror::Error;
#[derive(Debug, Error)]
pub enum EcosystemError {
    #[error("Engine not initialized: {0}")]
    EngineNotReady(String),
    #[error("Event queue full")]
    QueueFull,
    #[error("Plugin incompatible: {0}")]
    PluginIncompatible(String),
    #[error("Platform not supported: {0:?}")]
    PlatformUnsupported(super::types::Platform),
    #[error("Cross-engine error: {from} → {to}: {reason}")]
    CrossEngineError {
        from: String,
        to: String,
        reason: String,
    },
}
