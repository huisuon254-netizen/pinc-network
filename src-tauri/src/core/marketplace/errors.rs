use thiserror::Error;
#[derive(Debug, Error)]
pub enum MarketplaceError {
    #[error("Job not found: {0}")] JobNotFound(String),
    #[error("Bid not found: {0}")] BidNotFound(String),
    #[error("Job not open: current status is {0:?}")] JobNotOpen(super::types::JobStatus),
    #[error("Insufficient budget: need {need}, have {have}")] InsufficientBudget { need: f64, have: f64 },
    #[error("Milestone not found: {0}")] MilestoneNotFound(String),
    #[error("Proof already submitted")] ProofAlreadySubmitted,
    #[error("Dispute already exists for job: {0}")] DisputeExists(String),
    #[error("Not authorized: {0}")] NotAuthorized(String),
    #[error("Invalid milestone amount")] InvalidMilestoneAmount,
    #[error("AI detection flagged: {0}")] AiFlaggedFakeWork(String),
    #[error("Deadline passed")] DeadlinePassed,
}
