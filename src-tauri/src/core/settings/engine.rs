use crate::core::settings::types::PincSettings;

pub struct SettingsEngine {
    pub current: PincSettings,
}

impl Default for SettingsEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl SettingsEngine {
    pub fn new() -> Self {
        SettingsEngine {
            current: PincSettings::default(),
        }
    }
}
