use serde::{Deserialize, Serialize};

/// SARAI identity.
///
/// PERMANENCE: `node_id` is the user's unique, permanent ID. It is permanently
/// linked to the master password (`password_hash`, Argon2 of master_key) and to
/// the app PIN (`pin_hash`, Argon2 of PIN). It is NEVER regenerated: recovery
/// via seed phrase restores the SAME node_id (see generator::build_identity_from_phrase).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Identity {
    pub id: String,
    pub node_id: String,
    pub username: String,
    /// Real identity fields — two names + date of birth make the ID uniquely attributable.
    #[serde(default)]
    pub first_name: String,
    #[serde(default)]
    pub last_name: String,
    #[serde(default)]
    pub date_of_birth: String,
    pub public_key: String,
    pub private_key_encrypted: String,
    pub fingerprint: String,
    pub recovery_key_hash: String,
    pub recovery_phrase_hash: String,
    /// Argon2 hash of master password — permanent link ID <-> password.
    pub password_hash: String,
    /// Argon2 hash of the app PIN — permanent link ID <-> PIN.
    #[serde(default)]
    pub pin_hash: String,
    pub created_at: i64,
}
