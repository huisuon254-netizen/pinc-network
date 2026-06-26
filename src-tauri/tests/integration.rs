use pinc_lib::core::{
    crypto::{
        cipher::{decrypt, encrypt},
        nonce::{generate_nonce, validate_nonce},
        types::NonceType,
    },
    database::connection::open_test_db,
    identity::{generator::create_identity, validator::validate_identity},
    startup::startup_check,
    vault::{
        chunker::{merge_chunks, split_chunks},
        encryptor::{vault_decrypt, vault_encrypt},
        integrity::{compute_hash, verify_integrity},
    },
};

const KEY: [u8; 32] = [42u8; 32];

// ── Identity lifecycle ───────────────────────────────────────────────────────

#[test]
fn integration_create_and_reload_identity() {
    let db = open_test_db().unwrap();
    let id = create_identity(&db, &KEY).expect("identity must be created");
    assert!(!id.id.is_empty());
    assert!(id.node_id.starts_with("PINC-"));
    validate_identity(&id).expect("identity must pass validation");

    let loaded =
        pinc_lib::core::database::queries::load_identity(&db, &id.id).expect("must reload from DB");
    assert_eq!(loaded.id, id.id);
    assert_eq!(loaded.fingerprint, id.fingerprint);
}

#[test]
fn integration_two_identities_are_independent() {
    let db = open_test_db().unwrap();
    let id1 = create_identity(&db, &KEY).unwrap();
    let id2 = create_identity(&db, &KEY).unwrap();
    assert_ne!(id1.id, id2.id);
    assert_ne!(id1.public_key, id2.public_key);
    assert_ne!(id1.node_id, id2.node_id);
}

// ── Crypto ───────────────────────────────────────────────────────────────────

#[test]
fn integration_xchacha24_encrypt_decrypt() {
    let key = [9u8; 32];
    let msg = b"integration crypto test";
    let enc = encrypt(&key, msg, NonceType::XChaCha24).unwrap();
    assert_eq!(enc.nonce.len(), 24);
    let dec = decrypt(&key, &enc, NonceType::XChaCha24).unwrap();
    assert_eq!(&dec, msg);
}

#[test]
fn integration_nonce_mismatch_is_rejected() {
    let xchacha_nonce = generate_nonce(&NonceType::XChaCha24);
    // 24-byte nonce must NOT pass ChaCha12 (12-byte) validation
    assert!(validate_nonce(&xchacha_nonce, &NonceType::ChaCha12).is_err());
}

// ── Vault full flow ───────────────────────────────────────────────────────────

#[test]
fn integration_vault_encrypt_chunk_verify_restore() {
    let key = [77u8; 32];
    let original: Vec<u8> = (0u8..=255).cycle().take(700_000).collect();
    let original_hash = compute_hash(&original);

    let chunks = split_chunks(&original);
    assert!(chunks.len() >= 1);

    let encrypted: Vec<Vec<u8>> = chunks
        .iter()
        .map(|c| vault_encrypt(&key, &c.data).unwrap())
        .collect();

    let decrypted_chunks: Vec<pinc_lib::core::vault::types::ChunkMeta> = encrypted
        .iter()
        .enumerate()
        .map(|(i, blob)| {
            let data = vault_decrypt(&key, blob).unwrap();
            pinc_lib::core::vault::types::ChunkMeta {
                index: i,
                hash: compute_hash(&data),
                data,
            }
        })
        .collect();

    let reassembled = merge_chunks(&decrypted_chunks);
    verify_integrity(&reassembled, &original_hash).expect("integrity must pass");
    assert_eq!(reassembled, original);
}

#[test]
fn integration_corruption_detected() {
    let key = [88u8; 32];
    let data = b"important file data";
    let hash = compute_hash(data);
    let mut blob = vault_encrypt(&key, data).unwrap();
    blob[blob.len() - 1] ^= 0xFF;
    assert!(vault_decrypt(&key, &blob).is_err());
    assert!(verify_integrity(b"modified", &hash).is_err());
}

// ── Startup ───────────────────────────────────────────────────────────────────

#[test]
fn integration_startup_passes_on_healthy_db() {
    let db = open_test_db().unwrap();
    let report = startup_check(&db);
    assert!(
        report.all_passed,
        "startup failed: {:?}",
        report.failed_component
    );
    assert_eq!(report.checks.len(), 6);
}

// ── Database constraints ──────────────────────────────────────────────────────

#[test]
fn integration_duplicate_identity_rejected() {
    let db = open_test_db().unwrap();
    let id = create_identity(&db, &KEY).unwrap();
    let result = pinc_lib::core::database::queries::insert_identity(&db, &id);
    assert!(result.is_err(), "duplicate primary key must fail");
}

#[test]
fn integration_identity_count_accurate() {
    use pinc_lib::core::database::queries::identity_count;
    let db = open_test_db().unwrap();
    assert_eq!(identity_count(&db).unwrap(), 0);
    create_identity(&db, &KEY).unwrap();
    assert_eq!(identity_count(&db).unwrap(), 1);
    create_identity(&db, &KEY).unwrap();
    assert_eq!(identity_count(&db).unwrap(), 2);
}
