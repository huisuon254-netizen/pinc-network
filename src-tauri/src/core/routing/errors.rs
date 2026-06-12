use thiserror::Error;
#[derive(Debug, Error)]
pub enum RoutingError {
    #[error("No path found from {from} to {to}")] NoPath { from: String, to: String },
    #[error("Routing table empty")] EmptyTable,
    #[error("Region not found: {0}")] RegionNotFound(String),
    #[error("NAT traversal failed: {0}")] NatFailed(String),
    #[error("Max hops exceeded")] MaxHopsExceeded,
}
