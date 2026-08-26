use crate::core::{crypto::hash::sha256_hex, identity::errors::IdentityError};

pub struct DeviceFingerprint {
    pub raw: String,
    pub hash: String,
}

pub fn device_fingerprint() -> Result<DeviceFingerprint, IdentityError> {
    let mut parts = vec![
        std::env::consts::OS.to_string(),
        std::env::consts::ARCH.to_string(),
        format!("cpus:{}", num_cpus::get()),
    ];
    if let Ok(h) = hostname::get() {
        parts.push(h.to_string_lossy().to_string());
    }
    let raw = parts.join("|");
    let hash = format!("FP-{}", &sha256_hex(raw.as_bytes())[..32].to_uppercase());
    Ok(DeviceFingerprint { raw, hash })
}
