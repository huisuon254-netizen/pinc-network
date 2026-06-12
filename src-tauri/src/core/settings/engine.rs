use crate::core::settings::types::PincSettings;

pub struct SettingsEngine {
    pub current: PincSettings,
}

impl SettingsEngine {
    pub fn new() -> Self {
        SettingsEngine {
            current: PincSettings::default(),
        }
    }
}
