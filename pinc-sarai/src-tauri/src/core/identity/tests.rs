#[cfg(test)]
mod tests {
    use crate::core::{
        database::connection::open_test_db,
        identity::{
            fingerprint::device_fingerprint, generator::{create_identity, IdentityProfile},
            validator::validate_identity,
        },
    };

    const KEY: &str = "test_password_key";

    fn test_profile() -> IdentityProfile {
        IdentityProfile {
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            date_of_birth: "1990-01-01".to_string(),
        }
    }

    #[test]
    fn test_create_identity_succeeds() {
        let db = open_test_db().unwrap();
        let result = create_identity(&db, KEY, "testuser", &test_profile());
        assert!(result.is_ok(), "{:?}", result);
    }

    #[test]
    fn test_identity_node_id_format() {
        let db = open_test_db().unwrap();
        let id = create_identity(&db, KEY, "testuser", &test_profile()).unwrap();
        assert_eq!(id.node_id.len(), 7, "node_id: {}", id.node_id);
    }

    #[test]
    fn test_identity_fields_not_empty() {
        let db = open_test_db().unwrap();
        let id = create_identity(&db, KEY, "testuser", &test_profile()).unwrap();
        assert!(!id.public_key.is_empty());
        assert!(!id.private_key_encrypted.is_empty());
        assert!(!id.fingerprint.is_empty());
        assert!(id.created_at > 0);
        assert_eq!(id.username, "testuser");
    }

    #[test]
    fn test_private_key_is_encrypted() {
        use base64::{engine::general_purpose::STANDARD as B64, Engine};
        let db = open_test_db().unwrap();
        let id = create_identity(&db, KEY, "testuser", &test_profile()).unwrap();
        let blob = B64.decode(&id.private_key_encrypted).unwrap();
        // nonce(24) + ciphertext(32) + tag(16) = 72+ bytes
        assert!(blob.len() > 48);
    }

    #[test]
    fn test_two_identities_differ() {
        let db = open_test_db().unwrap();
        let id1 = create_identity(&db, KEY, "user1", &test_profile()).unwrap();
        let id2 = create_identity(&db, KEY, "user2", &test_profile()).unwrap();
        assert_ne!(id1.id, id2.id);
        assert_ne!(id1.public_key, id2.public_key);
    }

    #[test]
    fn test_validation_catches_empty_id() {
        use crate::core::identity::types::Identity;
        let bad = Identity {
            id: "".to_string(),
            node_id: "1234567".to_string(),
            username: "".to_string(),
            first_name: "".to_string(),
            last_name: "".to_string(),
            date_of_birth: "".to_string(),
            public_key: "key".to_string(),
            private_key_encrypted: "enc".to_string(),
            fingerprint: "fp".to_string(),
            recovery_key_hash: "rk".to_string(),
            recovery_phrase_hash: "rp".to_string(),
            password_hash: "ph".to_string(),
            pin_hash: "".to_string(),
            created_at: 1700000000,
        };
        assert!(validate_identity(&bad).is_err());
    }

    #[test]
    fn test_fingerprint_deterministic() {
        let fp1 = device_fingerprint().unwrap();
        let fp2 = device_fingerprint().unwrap();
        assert_eq!(fp1.hash, fp2.hash);
    }

    #[test]
    fn test_fingerprint_has_prefix() {
        let fp = device_fingerprint().unwrap();
        assert!(fp.hash.starts_with("FP-"));
    }

    #[test]
    fn test_identity_saved_and_reloadable() {
        use crate::core::database::queries::load_identity;
        let db = open_test_db().unwrap();
        let id = create_identity(&db, KEY, "testuser", &test_profile()).unwrap();
        let loaded = load_identity(&db, &id.id).unwrap();
        assert_eq!(loaded.fingerprint, id.fingerprint);
    }

    #[test]
    fn test_loaded_identity_passes_validation() {
        use crate::core::database::queries::load_identity;
        let db = open_test_db().unwrap();
        let id = create_identity(&db, KEY, "testuser", &test_profile()).unwrap();
        let loaded = load_identity(&db, &id.id).unwrap();
        assert!(validate_identity(&loaded).is_ok());
    }
}
