use crate::core::identity::{errors::IdentityError, types::Identity};

pub fn validate_identity(id: &Identity) -> Result<(), IdentityError> {
    if id.id.is_empty() {
        return Err(IdentityError::ValidationFailed("id empty".into()));
    }
    if id.node_id.is_empty() {
        return Err(IdentityError::ValidationFailed("node_id empty".into()));
    }
    if id.public_key.is_empty() {
        return Err(IdentityError::ValidationFailed("public_key empty".into()));
    }
    if id.private_key_encrypted.is_empty() {
        return Err(IdentityError::ValidationFailed(
            "private_key_encrypted empty".into(),
        ));
    }
    if id.fingerprint.is_empty() {
        return Err(IdentityError::ValidationFailed("fingerprint empty".into()));
    }
    if id.created_at <= 0 {
        return Err(IdentityError::ValidationFailed("invalid timestamp".into()));
    }
    if id.node_id.len() != 7 || !id.node_id.chars().all(|c| c.is_ascii_digit()) {
        return Err(IdentityError::ValidationFailed(
            "node_id must be 7 digits".into(),
        ));
    }
    Ok(())
}
