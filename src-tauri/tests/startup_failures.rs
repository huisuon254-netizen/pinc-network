use pinc_lib::core::{
    database::connection::open_test_db,
    vault::encryptor::vault_decrypt,
    crypto::{cipher::EncryptedData, cipher::decrypt, types::NonceType},
    identity::{types::Identity, validator::validate_identity},
    startup::startup_check,
};

#[test]
fn startup_passes_on_fresh_db() {
    let db = open_test_db().unwrap();
    let report = startup_check(&db);
    assert!(report.all_passed);
}

#[test]
fn startup_report_has_six_checks() {
    let db = open_test_db().unwrap();
    let report = startup_check(&db);
    assert_eq!(report.checks.len(), 6);
}

#[test]
fn startup_report_check_names() {
    let db = open_test_db().unwrap();
    let report = startup_check(&db);
    let names: Vec<&str> = report.checks.iter().map(|c| c.name.as_str()).collect();
    assert!(names.contains(&"Crypto"));
    assert!(names.contains(&"Database"));
    assert!(names.contains(&"Vault"));
}

#[test]
fn wrong_nonce_size_returns_error_not_panic() {
    let bad = EncryptedData { nonce: vec![0u8; 8], ciphertext: vec![0u8; 32] };
    let result = decrypt(&[0u8; 32], &bad, NonceType::XChaCha24);
    assert!(result.is_err());
}

#[test]
fn corrupt_vault_blob_returns_error() {
    let key = [0u8; 32];
    let blob = vec![0xFFu8; 10];
    let result = vault_decrypt(&key, &blob);
    assert!(result.is_err());
}

#[test]
fn identity_with_empty_id_fails_validation() {
    let bad = Identity {
        id: "".to_string(), node_id: "PINC-AA-0001".to_string(),
        public_key: "k".to_string(), private_key_encrypted: "e".to_string(),
        fingerprint: "f".to_string(), recovery_key_hash: "r".to_string(),
        recovery_phrase_hash: "rp".to_string(), created_at: 1700000000,
    };
    assert!(validate_identity(&bad).is_err());
}

#[test]
fn identity_with_bad_node_id_fails_validation() {
    let bad = Identity {
        id: "some-uuid".to_string(), node_id: "NOT-PINC-FORMAT".to_string(),
        public_key: "k".to_string(), private_key_encrypted: "e".to_string(),
        fingerprint: "f".to_string(), recovery_key_hash: "r".to_string(),
        recovery_phrase_hash: "rp".to_string(), created_at: 1700000000,
    };
    assert!(validate_identity(&bad).is_err());
}

#[test]
fn missing_identity_load_returns_error() {
    use pinc_lib::core::database::queries::load_identity;
    let db = open_test_db().unwrap();
    assert!(load_identity(&db, "does-not-exist").is_err());
}
