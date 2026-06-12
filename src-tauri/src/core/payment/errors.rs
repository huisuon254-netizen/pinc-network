use thiserror::Error;
#[derive(Debug, Error)]
pub enum PaymentError {
    #[error("Insufficient balance: need {need}, have {have}")] InsufficientBalance { need: f64, have: f64 },
    #[error("Escrow not found: {0}")] EscrowNotFound(String),
    #[error("Escrow already released")] AlreadyReleased,
    #[error("Escrow conditions not met")] ConditionsNotMet,
    #[error("Invalid amount: {0}")] InvalidAmount(String),
    #[error("Withdrawal rejected: {0}")] WithdrawalRejected(String),
    #[error("Recipient not confirmed")] RecipientNotConfirmed,
    #[error("Transaction not found: {0}")] TxNotFound(String),
    #[error("Fraud detected: {0}")] FraudDetected(String),
    #[error("Currency mismatch")] CurrencyMismatch,
    #[error("Rollback failed: {0}")] RollbackFailed(String),
}
