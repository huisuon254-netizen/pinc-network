# Agent 5 — CRYPTO KEYS & SECURITY Exhaustive Report
**Files:** `src-tauri/src/core/crypto/{keys.rs:37,cipher.rs:74,hash.rs:41,nonce.rs:19,types.rs:14,validator.rs:24,wallet.rs:156}`, `core/identity/{generator.rs:95,recovery.rs:23,fingerprint.rs:20,session.rs:112}`, `components/wallet/SeedPhraseBackup.tsx:91`, `core/database/schema.rs:379`

## keys.rs
- generate_symmetric_key [u8;32] thread_rng fill, generate_keypair Ed25519 SigningKey::generate thread_rng returns pub/priv Vec<u8>, validate_key_length 32, derive_key_from_bytes SHA256 single hash no salt
- no sign/verify, thread_rng not OsRng, derive weak KDF brute-force, no zeroize, Vec heap.

## cipher.rs
- EncryptedData {ciphertext,nonce}, encrypt key [u8;32] generate_nonce validate Key::from_slice ChaCha12 12B or XChaCha24 24B returns ciphertext+nonce, decrypt validate then decrypt
- no validate_key_length, nonce random no counter, no AAD, error asymmetry leaks encryption e.to_string.

## nonce.rs
- generate_nonce kind size 12/24 thread_rng fill, validate len==expected, thread_rng not OsRng, no counter.

## hash.rs
- sha256_hex, blake3_hex, verify_hash == not ct_eq timing side-channel only SHA256, hash_password SaltString OsRng Argon2 default m19456, verify_password false on parse, no strength enforcement.

## wallet.rs
- Wallet {mnemonic String plaintext clone leak, eth_address,bnb_address,tron_address hex not Base58}, new_random thread_rng BIP39, from_mnemonic BIP44 m/44'/60'/0'/0/0 ETH same BNB, m/44'/195'/0'/0/0 TRON mock hex, ERC20_ABI unused, USDT/USDC mainnet only, DepositManager HashMap f64 in-memory discard mnemonic no persist lowercased address→user, process_webhook no HMAC no dedup value f64 replay spoof.

## identity/generator.rs
- create_identity entropy 32 thread_rng BIP39, build_identity_from_phrase: keypair random NOT derived from mnemonic → recovery mismatch, fingerprint device_fingerprint, encrypt priv SHA256(master_key) single hash no salt weak, node_id 7-digit %10M 23 bits bias collisions, mastery_key not zeroized, recovery_hash sha256 recovery:id:fp predictable.

## recovery.rs
- generate_recovery_hash sha256, recover_identity rebuilds new random keys uuid node_id → different identity not deterministic BIP39 fail.

## fingerprint.rs
- DeviceFingerprint raw OS|ARCH|cpus|hostname sha256 truncated 32 hex FP- low entropy spoofable no TPM.

## validator.rs
- validates non-empty id node_id 7 digits, no pubkey base64 check, no encrypted decode, no password PHC.

## session.rs
- Session {token uuid, node_id, created, expires, active}, create_session uuid token created+minutes*60 expires active 1 INSERT, validate active && expires>now, destroy active 0, cleanup, get_active.
- uuid 122 bits plaintext no HMAC, no IP bind, duration not validated overflow, LockFailed no retry.

## SeedPhraseBackup.tsx
- props seedPhrase onComplete onSkip, split space grid 3 cols word mono, copy clipboard 2s, checkbox confirmed, Skip vs Save disabled, no verification 4-5 words, no screenshot deterrent, Tailwind bg-gray inconsistent vs pinc-card.

## SecurityPage.tsx 601L
- loads has_identity security logs devices identity, showSeedPhrase placeholder •••• no fetch, devices primary/linked, remove via cmd_remove_device, add via pairing_code+qr_png base64 JSON code no HMAC, logs action status.

## schema
- identities(id,node_id,username,public_key,private_key_encrypted b64 blob, fingerprint,recovery hashes,created_at) + password_hash migration, messaging_keys(node_id PK, x25519_public, x25519_private TEXT plaintext CRITICAL), sessions(local), local_users, recovery_codes (code_hash sha256 not Argon2 fast brute), no FK.

## Cargo deps
- chacha20poly1305, ed25519 2, x25519 2, hkdf 0.12 only ghost, rand 0.8 thread_rng vs OsRng, sha2 sha3 blake3 argon2 uuid bip39 base64 hex ethers 2, sha3 unused, hkdf missed for identity, x25519 static_secrets ok but messaging_keys plaintext.

## Findings 24: SHA256 KDF CRITICAL, thread_rng HIGH, no sign HIGH, nonce random MEDIUM, verify == HIGH, wallet mnemonic CRITICAL, TRON hex HIGH, DepositManager f64 HIGH, webhook CRITICAL, SHA256 master CRITICAL, keypair not from mnemonic CRITICAL, node_id bias MEDIUM, recovery rebuild CRITICAL, FP spoof HIGH, session plaintext MEDIUM, LoginScreen double mnemonic CRITICAL, masterKey IPC HIGH, clipboard MEDIUM, messaging_keys plaintext CRITICAL, Cargo hkdf miss MEDIUM.
