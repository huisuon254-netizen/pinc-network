use std::{fs, path::Path};
use crate::core::vault::errors::VaultError;

pub fn write_vault_file(path: &Path, blob: &[u8]) -> Result<(), VaultError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| VaultError::StorageWriteFailed(e.to_string()))?;
    }
    fs::write(path, blob).map_err(|e| VaultError::StorageWriteFailed(e.to_string()))
}

pub fn read_vault_file(path: &Path) -> Result<Vec<u8>, VaultError> {
    fs::read(path).map_err(|e| VaultError::StorageReadFailed(e.to_string()))
}

pub fn delete_vault_file(path: &Path) -> Result<(), VaultError> {
    fs::remove_file(path).map_err(|e| VaultError::StorageWriteFailed(e.to_string()))
}
