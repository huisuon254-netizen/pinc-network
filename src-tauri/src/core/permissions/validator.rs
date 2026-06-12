use crate::core::permissions::{errors::PermissionError, types::{DevicePermission, PermissionSet}};

pub fn check_permission(perms: &PermissionSet, required: &DevicePermission) -> Result<(), PermissionError> {
    if !perms.device_trusted { return Err(PermissionError::DeviceNotTrusted); }
    if !perms.granted.contains(required) {
        return Err(PermissionError::Denied(format!("{:?} not granted", required)));
    }
    Ok(())
}

pub fn check_trust_level(perms: &PermissionSet, required: u8) -> Result<(), PermissionError> {
    if perms.trust_level < required {
        return Err(PermissionError::TrustTooLow { required, got: perms.trust_level });
    }
    Ok(())
}
