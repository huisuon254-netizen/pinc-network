use thiserror::Error;
#[derive(Debug, Error)]
pub enum WagerError {
    #[error("Wager not found: {0}")]
    NotFound(String),
    #[error("Insufficient balance: need {need}, have {have}")]
    InsufficientBalance { need: f64, have: f64 },
    #[error("Wager already accepted")]
    AlreadyAccepted,
    #[error("Cannot wager against yourself")]
    SelfWager,
    #[error("Insufficient referees: need {need}, have {have}")]
    InsufficientReferees { need: usize, have: usize },
    #[error("Wager expired")]
    Expired,
    #[error("Outcome disputed")]
    OutcomeDisputed,
    #[error("Invalid game type: {0}")]
    InvalidGameType(String),
    #[error("Tournament full")]
    TournamentFull,
    #[error("Already registered")]
    AlreadyRegistered,
}
