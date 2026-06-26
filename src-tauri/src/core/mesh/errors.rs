use thiserror::Error;
#[derive(Debug, Error)]
pub enum MeshError {
    #[error("Config invalid: {0}")]
    ConfigInvalid(String),
    #[error("Peer limit reached")]
    PeerLimitReached,
    #[error("Mesh not ready")]
    NotReady,
}
