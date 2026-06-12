use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum DevicePermission {
    ReadVault,
    WriteVault,
    RelayTraffic,
    ConnectPeer,
    ShareStorage,
    ExecuteJob,
    SendMessage,
    AccessWallet,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionSet {
    pub granted: Vec<DevicePermission>,
    pub device_trusted: bool,
    pub trust_level: u8, // 0-100
}

impl Default for PermissionSet {
    fn default() -> Self {
        PermissionSet {
            granted: vec![DevicePermission::ReadVault, DevicePermission::WriteVault],
            device_trusted: true,
            trust_level: 50,
        }
    }
}
