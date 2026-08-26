use crate::core::{
    crypto::hash::sha256_hex,
    database::connection::Database,
    identity::{errors::IdentityError, generator::IdentityProfile, types::Identity},
};
#[cfg(feature = "admin")]
use crate::core::identity::generator::build_identity_from_phrase;
#[cfg(not(feature = "admin"))]
use crate::core::identity::generator::build_identity_from_phrase_mock;

pub fn generate_recovery_hash(identity_id: &str, fingerprint_hash: &str) -> String {
    sha256_hex(format!("recovery:{}:{}", identity_id, fingerprint_hash).as_bytes())
}

/// Recover an identity from a seed phrase.
/// PERMANENCE GUARANTEE: recovery NEVER generates a new node_id — deriving the
/// identity from the SAME seed phrase restores the SAME node_id, permanently
/// re-linked to the supplied master_key password (and existing PIN via pin_hash).
pub fn recover_identity(
    db: &Database,
    phrase: &str,
    master_key: &str,
    username: &str,
    profile: &IdentityProfile,
) -> Result<Identity, IdentityError> {
    #[cfg(feature = "admin")]
    {
        let mnemonic: bip39::Mnemonic = phrase
            .trim()
            .parse()
            .map_err(|_| IdentityError::RecoveryFailed("Invalid recovery phrase".to_string()))?;
        let identity = build_identity_from_phrase(db, &mnemonic, master_key, username, profile)?;
        return Ok(identity);
    }
    #[cfg(not(feature = "admin"))]
    {
        // SARAI mock: no bip39, directly use phrase string — deterministic, so the
        // same phrase always restores the same node_id.
        let identity = build_identity_from_phrase_mock(db, phrase.trim(), master_key, username, profile)?;
        return Ok(identity);
    }
}
