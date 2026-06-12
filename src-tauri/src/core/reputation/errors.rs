use thiserror::Error;
#[derive(Debug, Error)]
pub enum RepuationError {
    #[error("Node burned: {0}")] NodeBurned(String),
    #[error("Invalid rating: must be 1.0-5.0")] InvalidRating,
    #[error("Review not verified")] NotVerified,
    #[error("Self-review not allowed")] SelfReview,
}
