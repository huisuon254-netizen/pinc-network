use crate::core::vault::{errors::VaultError, types::VaultFileRecord};

pub fn serialize_meta(rec: &VaultFileRecord) -> Result<Vec<u8>, VaultError> {
    serde_json::to_vec(rec).map_err(|e| VaultError::StorageWriteFailed(e.to_string()))
}

pub fn deserialize_meta(data: &[u8]) -> Result<VaultFileRecord, VaultError> {
    serde_json::from_slice(data).map_err(|e| VaultError::StorageReadFailed(e.to_string()))
}
