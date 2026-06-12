#[cfg(test)]
mod tests {
    use crate::core::permissions::{types::{DevicePermission, PermissionSet}, validator::{check_permission, check_trust_level}};
    #[test] fn test_granted_permission_ok() { let p = PermissionSet::default(); assert!(check_permission(&p, &DevicePermission::ReadVault).is_ok()); }
    #[test] fn test_denied_permission_fails() { let p = PermissionSet::default(); assert!(check_permission(&p, &DevicePermission::AccessWallet).is_err()); }
    #[test] fn test_trust_level_ok() { let p = PermissionSet::default(); assert!(check_trust_level(&p, 40).is_ok()); }
    #[test] fn test_trust_level_too_low() { let p = PermissionSet::default(); assert!(check_trust_level(&p, 90).is_err()); }
    #[test] fn test_untrusted_device_fails() { let p = PermissionSet { device_trusted: false, ..Default::default() }; assert!(check_permission(&p, &DevicePermission::ReadVault).is_err()); }
}
