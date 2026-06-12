#[cfg(test)]
mod tests {
    use crate::core::settings::types::PincSettings;
    #[test] fn test_default_settings() { let s = PincSettings::default(); assert_eq!(s.theme, "dark-cyber"); assert!(s.relay_enabled); assert_eq!(s.network_port, 9000); }
    #[test] fn test_settings_serializes() { let s = PincSettings::default(); assert!(serde_json::to_string(&s).is_ok()); }
    #[test] fn test_settings_deserializes() { let json = serde_json::to_string(&PincSettings::default()).unwrap(); let s: PincSettings = serde_json::from_str(&json).unwrap(); assert_eq!(s.theme, "dark-cyber"); }
}
