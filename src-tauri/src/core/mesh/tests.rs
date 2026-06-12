#[cfg(test)]
mod tests {
    use crate::core::mesh::types::{MeshConfig, MeshStatus};
    #[test] fn test_default_config() { let c = MeshConfig::default(); assert!(c.max_peers > 0); assert!(c.relay_enabled); }
    #[test] fn test_default_status_not_ready() { assert!(!MeshStatus::default().ready); }
}
