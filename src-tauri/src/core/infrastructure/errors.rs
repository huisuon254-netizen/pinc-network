use thiserror::Error;
#[derive(Debug, Error)]
pub enum InfraError {
    #[error("Bootstrap unreachable: {0}")] BootstrapUnreachable(String),
    #[error("DNS resolution failed: {0}")] DnsFailed(String),
    #[error("Region overloaded: {0}")] RegionOverloaded(String),
    #[error("Emergency recovery needed")] EmergencyRecovery,
    #[error("Snapshot too old: {age_hours} hours")] SnapshotStale { age_hours: u64 },
    #[error("Scaling limit reached: {max} nodes")] ScalingLimit { max: u64 },
}
