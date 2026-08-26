use crate::core::{
    crypto::hash::sha256_hex,
    database::connection::Database,
    identity::{errors::IdentityError, generator::build_identity_from_phrase, types::Identity},
};

pub fn generate_recovery_hash(identity_id: &str, fingerprint_hash: &str) -> String {
    sha256_hex(format!("recovery:{}:{}", identity_id, fingerprint_hash).as_bytes())
}

pub fn recover_identity(
    db: &Database,
    phrase: &str,
    master_key: &str,
    username: &str,
) -> Result<Identity, IdentityError> {
    let mnemonic: bip39::Mnemonic = phrase
        .trim()
        .parse()
        .map_err(|_| IdentityError::RecoveryFailed("Invalid recovery phrase".to_string()))?;
    let identity = build_identity_from_phrase(db, &mnemonic, master_key, username)?;
    Ok(identity)
}
