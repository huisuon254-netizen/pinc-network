use crate::core::crypto::hash::blake3_hex;
use crate::core::database::connection::Database;
use crate::core::database::queries::{
    delete_vault_file as db_delete_vault_file, get_system_config, get_vault_file,
    insert_vault_file, list_vault_files, update_system_config,
};
use crate::core::vault::encryptor;
use crate::core::vault::storage;
use crate::core::vault::types::VaultFileRecord;
use std::path::PathBuf;

pub fn ensure_vault_dir(vault_dir: &std::path::Path) -> Result<(), String> {
    std::fs::create_dir_all(vault_dir).map_err(|e| format!("Failed to create vault dir: {}", e))
}

pub fn get_or_create_vault_key(db: &Database) -> Result<[u8; 32], String> {
    if let Ok(config) = get_system_config(db, "vault_key") {
        let seed = config.config_value;
        let hash = blake3::hash(seed.as_bytes());
        let mut key = [0u8; 32];
        key.copy_from_slice(hash.as_bytes());
        return Ok(key);
    }

    let mut seed = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut seed);
    let seed_hex = hex::encode(seed);

    update_system_config(
        db,
        "vault_key",
        &seed_hex,
        Some("Auto-generated vault encryption key".to_string()),
        "security",
    )
    .map_err(|e| format!("Failed to store vault key: {}", e))?;

    let hash = blake3::hash(&seed);
    let mut key = [0u8; 32];
    key.copy_from_slice(hash.as_bytes());
    Ok(key)
}

fn file_path(vault_dir: &std::path::Path, file_id: &str) -> PathBuf {
    vault_dir.join(format!("{}.bin", file_id))
}

pub fn upload_file(
    db: &Database,
    vault_dir: &std::path::Path,
    name: &str,
    data: &[u8],
    encrypt: bool,
) -> Result<VaultFileRecord, String> {
    ensure_vault_dir(vault_dir)?;
    let key = get_or_create_vault_key(db)?;

    let content_hash = blake3_hex(data);

    let stored_data = if encrypt {
        encryptor::vault_encrypt(&key, data).map_err(|e| e.to_string())?
    } else {
        data.to_vec()
    };

    let file_id = format!("vault-{}", uuid::Uuid::new_v4());
    let path = file_path(vault_dir, &file_id);
    storage::write_vault_file(&path, &stored_data).map_err(|e| e.to_string())?;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let record = VaultFileRecord {
        id: file_id,
        name: name.to_string(),
        hash: content_hash,
        encrypted: encrypt,
        size_bytes: data.len() as i64,
        created_at: now,
    };

    insert_vault_file(db, &record).map_err(|e| e.to_string())?;
    Ok(record)
}

pub fn download_file(
    db: &Database,
    vault_dir: &std::path::Path,
    file_id: &str,
) -> Result<Vec<u8>, String> {
    let record = get_vault_file(db, file_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("File '{}' not found", file_id))?;

    let path = file_path(vault_dir, &record.id);
    let stored_data =
        storage::read_vault_file(&path).map_err(|e| format!("Failed to read vault file: {}", e))?;

    if record.encrypted {
        let key = get_or_create_vault_key(db)?;
        let decrypted = encryptor::vault_decrypt(&key, &stored_data)
            .map_err(|e| format!("Failed to decrypt file: {}", e))?;
        Ok(decrypted)
    } else {
        Ok(stored_data)
    }
}

pub fn delete_file(
    db: &Database,
    vault_dir: &std::path::Path,
    file_id: &str,
) -> Result<(), String> {
    let path = file_path(vault_dir, file_id);
    if path.exists() {
        storage::delete_vault_file(&path).map_err(|e| e.to_string())?;
    }
    db_delete_vault_file(db, file_id).map_err(|e| e.to_string())
}

pub fn list_files(db: &Database) -> Result<Vec<VaultFileRecord>, String> {
    list_vault_files(db).map_err(|e| e.to_string())
}

pub fn get_file_info(db: &Database, file_id: &str) -> Result<VaultFileRecord, String> {
    get_vault_file(db, file_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("File '{}' not found", file_id))
}

pub fn get_file_hash(
    db: &Database,
    vault_dir: &std::path::Path,
    file_id: &str,
) -> Result<String, String> {
    let data = download_file(db, vault_dir, file_id)?;
    Ok(blake3_hex(&data))
}
